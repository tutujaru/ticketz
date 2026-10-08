import crypto from "crypto";
import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import Message from "../models/Message";
import CreateOrUpdateContactService from "./ContactServices/CreateOrUpdateContactService";
import FindOrCreateTicketService from "./TicketServices/FindOrCreateTicketService";
import CreateMessageService from "./MessageServices/CreateMessageService";
import { getIO } from "../libs/socket";

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v26.0";
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

export const isWhatsappCloudApi = (whatsapp: Whatsapp): boolean =>
  whatsapp.provider === "whatsapp-cloud-api";

const getConfig = (whatsapp: Whatsapp) => {
  if (!whatsapp.tokenMeta || !whatsapp.metaPhoneNumberId) {
    throw new AppError("ERR_WHATSAPP_CLOUD_API_NOT_CONFIGURED", 400);
  }
  return {
    accessToken: whatsapp.tokenMeta,
    phoneNumberId: whatsapp.metaPhoneNumberId
  };
};

const graphRequest = async (
  whatsapp: Whatsapp,
  body: Record<string, unknown>
) => {
  const { accessToken, phoneNumberId } = getConfig(whatsapp);
  const response = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new AppError(data?.error?.message || "ERR_WHATSAPP_CLOUD_API");
  }
  return data;
};

export const sendCloudTextMessage = async (
  whatsapp: Whatsapp,
  number: string,
  body: string
) =>
  graphRequest(whatsapp, {
    recipient_type: "individual",
    to: number.replace(/\D/g, ""),
    type: "text",
    text: { preview_url: true, body }
  });

export const sendCloudMediaMessage = async (
  whatsapp: Whatsapp,
  number: string,
  filePath: string,
  mimetype: string,
  filename: string,
  caption?: string
) => {
  const { accessToken, phoneNumberId } = getConfig(whatsapp);
  const file = await (await import("fs/promises")).readFile(filePath);
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append(
    "file",
    new Blob([file as unknown as BlobPart], { type: mimetype }),
    filename
  );
  const upload = await fetch(`${GRAPH_URL}/${phoneNumberId}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form
  });
  const uploadData = await upload.json();
  if (!upload.ok || !uploadData.id) {
    throw new AppError(uploadData?.error?.message || "ERR_WHATSAPP_CLOUD_API");
  }
  const type = mimetype.startsWith("image/")
    ? "image"
    : mimetype.startsWith("video/")
      ? "video"
      : mimetype.startsWith("audio/")
        ? "audio"
        : "document";
  return graphRequest(whatsapp, {
    recipient_type: "individual",
    to: number.replace(/\D/g, ""),
    type,
    [type]: { id: uploadData.id, ...(caption ? { caption } : {}) }
  });
};

export const verifyCloudWebhookSignature = (
  rawBody: Buffer,
  signature: string | undefined,
  appSecret: string
): boolean => {
  if (!signature || !signature.startsWith("sha256=") || !appSecret)
    return false;
  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody.toString("utf8"))
    .digest("hex");
  return signature.slice(7).toLowerCase() === expected;
};

const getText = (message: any): string => {
  if (message.type === "text") return message.text?.body || "";
  if (message.type === "button") return message.button?.text || "";
  if (message.type === "interactive") {
    return (
      message.interactive?.button_reply?.title ||
      message.interactive?.list_reply?.title ||
      ""
    );
  }
  return message[message.type]?.caption || `[${message.type}]`;
};

export const processCloudWebhook = async (payload: any): Promise<void> => {
  if (payload?.object !== "whatsapp_business_account") return;
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (change.field !== "messages" || !value?.messages) continue;
      const whatsapp = await Whatsapp.findOne({
        where: { metaPhoneNumberId: value.metadata?.phone_number_id },
        include: ["queues"]
      });
      if (!whatsapp) continue;
      for (const incoming of value.messages) {
        if (!incoming.id || (await Message.findByPk(incoming.id))) continue;
        const sender = incoming.from;
        const profile = value.contacts?.find(
          (contact: any) => contact.wa_id === sender
        );
        const contact = await CreateOrUpdateContactService({
          name: profile?.profile?.name || sender,
          number: sender,
          companyId: whatsapp.companyId,
          channel: "whatsapp"
        });
        const { ticket } = await FindOrCreateTicketService(
          contact,
          whatsapp.id,
          whatsapp.companyId,
          {
            incrementUnread: true,
            queue:
              whatsapp.queues?.length === 1 ? whatsapp.queues[0] : undefined
          }
        );
        const message = await CreateMessageService({
          messageData: {
            id: incoming.id,
            ticketId: ticket.id,
            contactId: contact.id,
            body: getText(incoming),
            fromMe: false,
            read: false,
            ack: 1,
            remoteJid: `${sender}@s.whatsapp.net`,
            dataJson: JSON.stringify(incoming)
          },
          companyId: whatsapp.companyId
        });
        await ticket.update({
          lastMessage: message.body.substring(0, 255).replace(/\n/g, " ")
        });
      }
    }
  }
};

export const updateCloudMessageStatus = async (
  whatsapp: Whatsapp,
  status: any
): Promise<void> => {
  const message = await Message.findOne({
    where: { id: status.id },
    include: [{ model: Ticket, where: { whatsappId: whatsapp.id } }]
  });
  if (!message) return;
  const ack =
    { sent: 2, delivered: 3, read: 4, failed: -1 }[status.status] || 1;
  await message.update({ ack });
  getIO()
    .to(message.ticketId.toString())
    .emit(`company-${message.companyId}-appMessage`, {
      action: "update",
      message
    });
};
