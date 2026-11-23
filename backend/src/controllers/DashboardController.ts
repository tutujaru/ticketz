import { Request, Response } from "express";

import {
  DashboardDateRange,
  statusSummaryService,
  ticketsStatisticsService,
  usersReportService
} from "../services/ReportService/DashboardService";
import Company from "../models/Company";
import User from "../models/User";
import Ticket from "../models/Ticket";
import Contact from "../models/Contact";
import Queue from "../models/Queue";
import Whatsapp from "../models/Whatsapp";
import TicketTraking from "../models/TicketTraking";
import AppError from "../errors/AppError";
import { Op } from "sequelize";
import { removeWbot } from "../libs/wbot";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import { sendWhatsappUpdate } from "../services/WhatsappService/SocketSendWhatsappUpdate";

const getDashboardCompanyScope = async (
  req: Request
): Promise<number | number[]> => {
  const user = await User.findByPk(req.user.id, { attributes: ["super"] });
  if (!user?.super) return req.user.companyId;

  const companies = await Company.findAll({
    where: { status: true },
    attributes: ["id"]
  });

  return companies.map(company => company.id);
};

export const ticketsStatistic = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const params: DashboardDateRange = req.query;
  const companyId = await getDashboardCompanyScope(req);

  const result = await ticketsStatisticsService(companyId, params);
  return res.status(200).json(result);
};

export const usersReport = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const params: DashboardDateRange = req.query;
  const companyId = await getDashboardCompanyScope(req);

  const result = await usersReportService(companyId, params);
  return res.status(200).json(result);
};

export const statusSummary = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const companyId = await getDashboardCompanyScope(req);

  const dashboardData = await statusSummaryService(companyId);
  return res.status(200).json(dashboardData);
};

export const activeTickets = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const user = await User.findByPk(req.user.id, { attributes: ["super"] });
  if (!user?.super) {
    throw new AppError("Acesso não permitido", 403);
  }

  const tickets = await Ticket.findAll({
    where: {
      status: "open",
      userId: { [Op.ne]: null }
    },
    attributes: [
      "id",
      "userId",
      "contactId",
      "companyId",
      "whatsappId",
      "queueId",
      "createdAt",
      "updatedAt"
    ],
    include: [
      { model: User, as: "user", attributes: ["id", "name"] },
      { model: Contact, as: "contact", attributes: ["id", "name", "number"] },
      { model: Company, as: "company", attributes: ["id", "name"] },
      { model: Queue, as: "queue", attributes: ["id", "name", "color"] },
      { model: Whatsapp, as: "whatsapp", attributes: ["id", "name"] },
      {
        model: TicketTraking,
        as: "ticketTrakings",
        attributes: ["id", "startedAt", "createdAt"],
        where: { finishedAt: null },
        required: false
      }
    ],
    order: [["updatedAt", "DESC"]]
  });

  return res.status(200).json(tickets);
};

const assertSuperadmin = async (req: Request) => {
  const user = await User.findByPk(req.user.id, { attributes: ["super"] });
  if (!user?.super) throw new AppError("Acesso não permitido", 403);
};

export const activeWhatsapps = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await assertSuperadmin(req);

  const whatsapps = await Whatsapp.findAll({
    attributes: [
      "id",
      "name",
      "channel",
      "provider",
      "status",
      "isDefault",
      "updatedAt",
      "companyId"
    ],
    include: [{ model: Company, as: "company", attributes: ["id", "name"] }],
    order: [["name", "ASC"]]
  });

  return res.status(200).json(whatsapps);
};

export const manageWhatsapp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await assertSuperadmin(req);
  const whatsapp = await Whatsapp.findByPk(req.params.whatsappId);
  if (!whatsapp) throw new AppError("ERR_NO_WAPP_FOUND", 404);

  const { action } = req.body;
  if (action === "restart") {
    await removeWbot(whatsapp.id, false);
    await StartWhatsAppSession(whatsapp, whatsapp.companyId);
  } else if (action === "disconnect") {
    await removeWbot(whatsapp.id, false);
    await whatsapp.update({ status: "DISCONNECTED", qrcode: "", retries: 0 });
    sendWhatsappUpdate(whatsapp);
  } else {
    throw new AppError("Ação de conexão inválida", 400);
  }

  return res.status(200).json({ message: "Ação executada com sucesso." });
};
