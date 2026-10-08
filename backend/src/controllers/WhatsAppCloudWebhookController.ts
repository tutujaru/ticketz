import { Request, Response } from "express";
import Whatsapp from "../models/Whatsapp";
import {
  processCloudWebhook,
  updateCloudMessageStatus,
  verifyCloudWebhookSignature
} from "../services/WhatsappCloudApiService";
import { logger } from "../utils/logger";

const raw = (req: Request): Buffer => {
  const request = req as Request & { rawBody?: Buffer };
  return request.rawBody || Buffer.from(JSON.stringify(req.body || {}));
};

export const verify = async (req: Request, res: Response) => {
  const {
    "hub.mode": mode,
    "hub.challenge": challenge,
    "hub.verify_token": token
  } = req.query as Record<string, string>;
  if (mode !== "subscribe" || !challenge || !token) {
    return res.sendStatus(400);
  }
  const whatsapp = await Whatsapp.findOne({
    where: { metaVerifyToken: token }
  });
  return whatsapp ? res.status(200).send(challenge) : res.sendStatus(403);
};

export const receive = async (req: Request, res: Response) => {
  const signature = req.header("x-hub-signature-256");
  const phoneNumberId =
    req.body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
  const whatsapp = phoneNumberId
    ? await Whatsapp.findOne({ where: { metaPhoneNumberId: phoneNumberId } })
    : null;
  if (
    !whatsapp ||
    !verifyCloudWebhookSignature(raw(req), signature, whatsapp.metaAppSecret)
  ) {
    return res.sendStatus(403);
  }
  try {
    for (const entry of req.body.entry || []) {
      for (const change of entry.changes || []) {
        for (const status of change.value?.statuses || []) {
          await updateCloudMessageStatus(whatsapp, status);
        }
      }
    }
    await processCloudWebhook(req.body);
    return res.sendStatus(200);
  } catch (error) {
    logger.error({ error }, "Error processing WhatsApp Cloud API webhook");
    return res.sendStatus(500);
  }
};
