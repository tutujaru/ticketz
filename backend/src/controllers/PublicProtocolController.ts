import * as crypto from "crypto";
import { Request, Response } from "express";
import Ticket from "../models/Ticket";
import Contact from "../models/Contact";
import Company from "../models/Company";
import Queue from "../models/Queue";
import Whatsapp from "../models/Whatsapp";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import { cacheLayer } from "../libs/cache";
import { logger } from "../utils/logger";

const CODE_TTL_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

const normalizeProtocol = (value: unknown) =>
  String(value || "")
    .trim()
    .toUpperCase();

const codeKey = (protocol: string) => `public-protocol-code:${protocol}`;
const cooldownKey = (protocol: string) =>
  `public-protocol-code-cooldown:${protocol}`;

const findTicket = async (protocol: string) =>
  Ticket.findOne({
    where: { protocol },
    include: [
      { model: Contact, as: "contact", attributes: ["id", "number"] },
      { model: Company, as: "company", attributes: ["id", "name"] },
      { model: Queue, as: "queue", attributes: ["id", "name"] },
      { model: Whatsapp, as: "whatsapp", attributes: ["id", "name", "status"] }
    ]
  });

const statusLabel = (status: string) => {
  switch (status) {
    case "open":
      return "Em atendimento";
    case "closed":
      return "Encerrado";
    case "awaiting_return":
    case "waiting_return":
    case "waiting":
      return "Aguardando retorno";
    case "pending":
    default:
      return "Aguardando atendimento";
  }
};

const publicTicket = (ticket: Ticket) => ({
  protocol: ticket.protocol,
  status: ticket.status,
  statusLabel: statusLabel(ticket.status),
  openedAt: ticket.createdAt,
  updatedAt: ticket.updatedAt,
  company: ticket.company?.name || null,
  queue: ticket.queue?.name || null
});

export const requestCode = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const protocol = normalizeProtocol(req.body?.protocol);
  if (!protocol) {
    return res.status(400).json({ message: "Informe o protocolo." });
  }

  const ticket = await findTicket(protocol);
  // Always return the same response for unknown protocols.
  if (!ticket || !ticket.contact?.number) {
    return res.status(200).json({
      message:
        "Se o protocolo existir, um código será enviado pelo WhatsApp cadastrado."
    });
  }

  const existingCode = await cacheLayer.get(codeKey(protocol));
  const inCooldown = await cacheLayer.get(cooldownKey(protocol));
  if (existingCode || inCooldown) {
    return res.status(200).json({
      message:
        "Um código já foi enviado. Aguarde alguns instantes para solicitar outro."
    });
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  await cacheLayer.set(codeKey(protocol), code, "EX", CODE_TTL_SECONDS);
  await cacheLayer.set(
    cooldownKey(protocol),
    "1",
    "EX",
    RESEND_COOLDOWN_SECONDS
  );

  try {
    await SendWhatsAppMessage({
      ticket,
      body: `Código de confirmação para consultar o protocolo ${protocol}: ${code}. Este código é válido por 10 minutos.`
    });
  } catch (error) {
    await cacheLayer.del(codeKey(protocol));
    await cacheLayer.del(cooldownKey(protocol));
    logger.warn(
      { err: error },
      `Unable to send public protocol code for ${protocol}`
    );
  }

  return res.status(200).json({
    message:
      "Se o protocolo existir, um código será enviado pelo WhatsApp cadastrado."
  });
};

export const verifyCode = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const protocol = normalizeProtocol(req.body?.protocol);
  const code = String(req.body?.code || "").trim();

  if (!protocol || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: "Protocolo ou código inválido." });
  }

  const storedCode = await cacheLayer.get(codeKey(protocol));
  if (!storedCode || storedCode !== code) {
    return res.status(401).json({ message: "Código inválido ou expirado." });
  }

  const ticket = await findTicket(protocol);
  if (!ticket) {
    return res.status(404).json({ message: "Protocolo não encontrado." });
  }

  await cacheLayer.del(codeKey(protocol));
  return res.status(200).json(publicTicket(ticket));
};
