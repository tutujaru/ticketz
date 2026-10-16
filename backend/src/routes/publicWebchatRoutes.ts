import { Router } from "express";
import * as PublicWebchatController from "../controllers/PublicWebchatController";

const publicWebchatRoutes = Router();

publicWebchatRoutes.get(
  "/public/webchat/connections",
  PublicWebchatController.connections
);
publicWebchatRoutes.get(
  "/public/webchat/connections/:whatsappId/queues",
  PublicWebchatController.queues
);
publicWebchatRoutes.post(
  "/public/webchat/start",
  PublicWebchatController.start
);
publicWebchatRoutes.get(
  "/public/webchat/session/:token/messages",
  PublicWebchatController.messages
);
publicWebchatRoutes.post(
  "/public/webchat/session/:token/messages",
  PublicWebchatController.send
);
publicWebchatRoutes.post(
  "/public/webchat/session/:token/close",
  PublicWebchatController.close
);

export default publicWebchatRoutes;
