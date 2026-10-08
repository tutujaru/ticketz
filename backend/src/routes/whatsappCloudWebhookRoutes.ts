import { Router } from "express";
import * as controller from "../controllers/WhatsAppCloudWebhookController";

const routes = Router();
routes.get("/webhooks/whatsapp", controller.verify);
routes.post("/webhooks/whatsapp", controller.receive);

export default routes;
