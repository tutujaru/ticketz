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
