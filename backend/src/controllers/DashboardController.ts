import { Request, Response } from "express";

import {
  DashboardDateRange,
  statusSummaryService,
  ticketsStatisticsService,
  usersReportService
} from "../services/ReportService/DashboardService";
import Company from "../models/Company";

const getDashboardCompanyScope = async (
  req: Request
): Promise<number | number[]> => {
  if (!req.user.isSuper) return req.user.companyId;

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
