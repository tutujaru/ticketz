import { Request, Response } from "express";
import crypto from "crypto";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";

import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";
import { cacheLayer } from "../libs/cache";
import Contact from "../models/Contact";
import Message from "../models/Message";
import Queue from "../models/Queue";
import Ticket from "../models/Ticket";
import Whatsapp from "../models/Whatsapp";
import FindOrCreateContactService from "../services/ContactServices/FindOrCreateContactService";
import FindOrCreateATicketTrakingService from "../services/TicketServices/FindOrCreateATicketTrakingService";

const SESSION_TTL_SECONDS = 60 * 60 * 12;
const SESSION_PREFIX = "public-webchat-session";

interface WebchatSession {
  ticketId: number;
  contactId: number;
  companyId: number;
  whatsappId: number;
  queueId: number;
}

const sessionKey = (token: string) => `${SESSION_PREFIX}:${token}`;

const getSession = async (token: string): Promise<WebchatSession> => {
  if (!token || !/^[a-f0-9-]{36}$/i.test(token)) {
    throw new AppError("Sessão do Webchat inválida", 401);
  }

  const value = await cacheLayer.get(sessionKey(token));
  if (!value) {
    throw new AppError("Sessão do Webchat expirada", 401);
  }

  return JSON.parse(value) as WebchatSession;
};

const publicWhatsappWhere = {
  channel: {
    [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }]
  }
};

export const connections = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const whatsapps = await Whatsapp.findAll({
    where: publicWhatsappWhere,
    attributes: ["channel", "name", "status"],
    order: [["name", "ASC"]]
  });

  return res.json(
    whatsapps.map(whatsapp => ({
      channel: whatsapp.channel,
      name: whatsapp.name,
      status: whatsapp.status
    }))
  );
};

export const queues = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { channel } = req.params;
  const whatsapp = await Whatsapp.findOne({
    where: { channel },
    include: [
      {
        model: Queue,
        as: "queues",
        attributes: ["id", "name", "color"],
        through: { attributes: [] },
        order: [["name", "ASC"]]
      }
    ]
  });

  if (!whatsapp) {
    throw new AppError("Canal de Webchat não encontrado", 404);
  }

  return res.json(
    ((whatsapp.queues || []) as Queue[]).map(queue => ({
      id: queue.id,
      name: queue.name,
      color: queue.color
    }))
  );
};

export const start = async (req: Request, res: Response): Promise<Response> => {
  const { channel, queueId, name, phone, message } = req.body as {
    channel?: string;
    queueId?: number | string;
    name?: string;
    phone?: string;
    message?: string;
  };

  const cleanName = String(name || "").trim();
  const cleanMessage = String(message || "").trim();
  const cleanPhone = String(phone || "").replace(/\D/g, "");
  const numericQueueId = Number(queueId);

  if (!channel || !cleanName || cleanName.length < 2) {
    throw new AppError("Informe o canal e um nome válido", 400);
  }
  if (!cleanMessage) {
    throw new AppError("Informe a mensagem inicial", 400);
  }
  if (!Number.isInteger(numericQueueId)) {
    throw new AppError("Escolha uma fila de atendimento", 400);
  }

  const whatsapp = await Whatsapp.findOne({ where: { channel } });
  if (!whatsapp) {
    throw new AppError("Canal de Webchat não encontrado", 404);
  }

  const queue = await Queue.findOne({
    where: { id: numericQueueId, companyId: whatsapp.companyId },
    include: [
      {
        model: Whatsapp,
        as: "whatsapps",
        where: { id: whatsapp.id },
        through: { attributes: [] },
        required: true
      }
    ]
  });

  if (!queue) {
    throw new AppError("A fila escolhida não pertence à conexão", 400);
  }

  const token = crypto.randomUUID();
  const contactNumber = cleanPhone || `webchat-${token}`;
  const contact = await FindOrCreateContactService({
    name: cleanName,
    number: contactNumber,
    companyId: whatsapp.companyId
  });

  const openTicket = await Ticket.findOne({
    where: {
      contactId: contact.id,
      companyId: whatsapp.companyId,
      channel: "webchat",
      status: { [Op.ne]: "closed" }
    }
  });

  const ticket =
    openTicket ||
    (await Ticket.create({
      contactId: contact.id,
      companyId: whatsapp.companyId,
      whatsappId: whatsapp.id,
      queueId: queue.id,
      status: "pending",
      channel: "webchat",
      isGroup: false,
      userId: null
    }));

  if (!openTicket) {
    await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId: ticket.companyId,
      whatsappId: ticket.whatsappId,
      userId: null
    });
  }

  await cacheLayer.set(
    sessionKey(token),
    JSON.stringify({
      ticketId: ticket.id,
      contactId: contact.id,
      companyId: whatsapp.companyId,
      whatsappId: whatsapp.id,
      queueId: queue.id
    } satisfies WebchatSession),
    "EX",
    SESSION_TTL_SECONDS
  );

  await Message.create({
    id: uuidv4(),
    ticketId: ticket.id,
    contactId: contact.id,
    companyId: whatsapp.companyId,
    queueId: queue.id,
    body: cleanMessage,
    fromMe: false,
    read: false,
    ack: 0,
    channel: "webchat",
    remoteJid: contactNumber
  });

  const io = getIO();
  io.to(ticket.id.toString()).emit(`company-${whatsapp.companyId}-appMessage`, {
    action: "create",
    message: { ticketId: ticket.id, body: cleanMessage, fromMe: false }
  });

  return res.status(201).json({
    token,
    protocol: ticket.protocol,
    ticketId: ticket.id,
    status: ticket.status,
    queue: { id: queue.id, name: queue.name, color: queue.color }
  });
};

export const messages = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const session = await getSession(String(req.params.token));
  const records = await Message.findAll({
    where: { ticketId: session.ticketId },
    attributes: ["id", "body", "fromMe", "mediaType", "mediaUrl", "createdAt"],
    order: [["createdAt", "ASC"]],
    limit: 200
  });

  return res.json({
    protocol: (
      await Ticket.findByPk(session.ticketId, {
        attributes: ["protocol", "status"]
      })
    )?.toJSON(),
    messages: records
  });
};

export const send = async (req: Request, res: Response): Promise<Response> => {
  const session = await getSession(String(req.params.token));
  const body = String(req.body?.body || "").trim();
  if (!body) {
    throw new AppError("Digite uma mensagem", 400);
  }

  const message = await Message.create({
    id: uuidv4(),
    ticketId: session.ticketId,
    contactId: session.contactId,
    companyId: session.companyId,
    queueId: session.queueId,
    body,
    fromMe: false,
    read: false,
    ack: 0,
    channel: "webchat"
  });

  await Ticket.update(
    {
      lastMessage: body,
      unreadMessages:
        (await Ticket.count({ where: { id: session.ticketId } })) || 0
    },
    { where: { id: session.ticketId } }
  );

  getIO()
    .to(session.ticketId.toString())
    .emit(`company-${session.companyId}-appMessage`, {
      action: "create",
      message
    });

  return res.status(201).json({ message });
};

export const close = async (req: Request, res: Response): Promise<Response> => {
  const session = await getSession(String(req.params.token));
  await Ticket.update(
    { status: "closed" },
    { where: { id: session.ticketId } }
  );
  await cacheLayer.del(sessionKey(String(req.params.token)));
  return res.sendStatus(204);
};
