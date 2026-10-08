import { Router } from "express";
import * as controller from "../controllers/PasswordResetController";

const routes = Router();
routes.post("/auth/forgot-password", controller.request);
routes.post("/auth/reset-password/:token", controller.confirm);

export default routes;
