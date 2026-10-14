import express from "express";
import * as PublicProtocolController from "../controllers/PublicProtocolController";

const publicProtocolRoutes = express.Router();

publicProtocolRoutes.post(
  "/public/protocol/request-code",
  PublicProtocolController.requestCode
);
publicProtocolRoutes.post(
  "/public/protocol/verify",
  PublicProtocolController.verifyCode
);

export default publicProtocolRoutes;
