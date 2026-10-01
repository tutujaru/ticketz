import moment from "moment";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Company from "../../models/Company";
import Message from "../../models/Message";
import TicketNote from "../../models/TicketNote";
import ShowTicketService from "./ShowTicketService";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { startQueue, verifyMessage } from "../WbotServices/wbotMessageListener";
import AppError from "../../errors/AppError";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import User from "../../models/User";
import formatBody from "../../helpers/Mustache";
import { logger } from "../../utils/logger";
import { incrementCounter } from "../CounterServices/IncrementCounter";
import { getJidOf } from "../WbotServices/getJidOf";
import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";
import TicketTransferLog from "../../models/TicketTransferLog";
import { _t } from "../TranslationServices/i18nService";

export interface UpdateTicketData {
  status?: string;
  userId?: number | null;
  queueId?: number | null;
  whatsappId?: number;
  targetCompanyId?: number;
  chatbot?: boolean;
  queueOptionId?: number;
  justClose?: boolean;
}

interface Request {
  ticketData: UpdateTicketData;
  ticketId: number;
  reqUserId?: number;
  companyId?: number | undefined;
  dontRunChatbot?: boolean;
}

interface Response {
  ticket: Ticket;
  oldStatus: string;
  oldUserId: number | undefined;
}

const sendFormattedMessage = async (
  message: string,
  ticket: Ticket,
  user?: User
) => {
  const messageText = formatBody(message, ticket, user);

  const wbot = await GetTicketWbot(ticket);
  const queueChangedMessage = await wbot.sendMessage(getJidOf(ticket), {
    text: messageText
  });
  await verifyMessage(queueChangedMessage, ticket, ticket.contact);
};

export function websocketUpdateTicket(ticket: Ticket, moreChannels?: string[]) {
  const io = getIO();
  let ioStack = io
    .to(ticket.id.toString())
    .to(`user-${ticket?.userId}`)
    .to(`queue-${ticket.queueId}-notification`)
    .to(`queue-${ticket.queueId}-${ticket.status}`)
    .to(`company-${ticket.companyId}-notification`)
    .to(`company-${ticket.companyId}-${ticket.status}`);

  if (moreChannels) {
    moreChannels.forEach(channel => {
      ioStack = ioStack.to(channel);
    });
  }

  ioStack.emit(`company-${ticket.companyId}-ticket`, {
    action: "update",
    ticket
  });
}

const UpdateTicketService = async ({
  ticketData,
  ticketId,
  reqUserId,
  companyId,
  dontRunChatbot
}: Request): Promise<Response> => {
  try {
    if (!companyId && !reqUserId) {
      throw new Error("Need reqUserId or companyId");
    }

    const user = reqUserId ? await User.findByPk(reqUserId) : null;

    if (reqUserId) {
      if (!user) {
        throw new AppError("User not found", 404);
      }
      companyId = user.companyId;
    }
    const { justClose } = ticketData;
    let { status } = ticketData;
    let { queueId, userId, whatsappId } = ticketData;
    const hasTargetCompany =
      ticketData.targetCompanyId !== undefined &&
      ticketData.targetCompanyId !== null;
    const parsedTargetCompanyId = hasTargetCompany
      ? Number(ticketData.targetCompanyId)
      : companyId;

    if (
      !Number.isInteger(parsedTargetCompanyId) ||
      parsedTargetCompanyId <= 0
    ) {
      throw new AppError("ERR_COMPANY_NOT_FOUND", 404);
    }

    const normalizeOptionalId = (
      value: number | string | null | undefined,
      errorMessage: string
    ): number | null | undefined => {
      if (value === undefined) return undefined;
      if (value === null || value === "") return null;
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new AppError(errorMessage, 400);
      }
      return parsed;
    };

    queueId = normalizeOptionalId(queueId, "ERR_QUEUE_NOT_FOUND");
    userId = normalizeOptionalId(userId, "ERR_USER_NOT_FOUND");
    whatsappId = normalizeOptionalId(whatsappId, "ERR_WAPP_NOT_FOUND") as
      number | undefined;
    const sourceCompanyId = companyId;
    const fromChatbot = ticketData.chatbot || false;
    let chatbot: boolean | null = fromChatbot;
    let queueOptionId: number | null = ticketData.queueOptionId || null;

    const io = getIO();

    const userRatingSetting = await GetCompanySetting(
      companyId,
      "userRating",
      "disabled"
    );

    const ticket = await ShowTicketService(ticketId, companyId);
    const isGroup = ticket.contact?.isGroup || ticket.isGroup;
    const sourceWhatsappId = ticket.whatsappId;
    const sourceQueueId = ticket.queueId;
    let targetCompanyId = companyId;
    let targetContactId = ticket.contactId;
    let targetWhatsappId = ticket.whatsappId;
    const requestedCompanyId = parsedTargetCompanyId;
    const changingCompany = requestedCompanyId !== companyId;
    const changingWhatsapp =
      whatsappId !== undefined &&
      whatsappId !== null &&
      whatsappId !== ticket.whatsappId;

    if (changingWhatsapp) {
      const targetWhatsapp = await Whatsapp.findOne({
        where: {
          id: whatsappId,
          companyId: changingCompany ? requestedCompanyId : companyId
        }
      });
      if (!targetWhatsapp) {
        throw new AppError("ERR_WAPP_NOT_FOUND", 404);
      }
      targetWhatsappId = targetWhatsapp.id;
      const targetOpenTicket = await CheckContactOpenTickets(
        ticket.contactId,
        targetWhatsapp.id,
        true
      );
      if (targetOpenTicket && targetOpenTicket.id !== ticket.id) {
        throw new AppError("ERR_OTHER_OPEN_TICKET", 400);
      }
    }

    if (changingCompany) {
      if (!Number.isInteger(requestedCompanyId)) {
        throw new AppError("ERR_COMPANY_NOT_FOUND", 404);
      }
      if (!whatsappId) {
        throw new AppError("ERR_WAPP_NOT_FOUND", 400);
      }
      const targetCompany = await Company.findOne({
        where: { id: requestedCompanyId, status: true }
      });
      const targetWhatsapp = await Whatsapp.findOne({
        where: { id: Number(whatsappId), companyId: requestedCompanyId }
      });
      if (!targetCompany || !targetWhatsapp) {
        throw new AppError("ERR_WAPP_NOT_FOUND", 404);
      }
      if (userId) {
        const targetUser = await User.findOne({
          where: { id: Number(userId), companyId: requestedCompanyId }
        });
        if (!targetUser) {
          throw new AppError("ERR_USER_NOT_FOUND", 404);
        }
      }
      if (queueId) {
        const targetQueue = await Queue.findOne({
          where: { id: Number(queueId), companyId: requestedCompanyId }
        });
        if (!targetQueue) {
          throw new AppError("ERR_QUEUE_NOT_FOUND", 404);
        }
      }
      let targetContact = await Contact.findOne({
        where: {
          number: ticket.contact.number,
          companyId: requestedCompanyId
        }
      });
      if (!targetContact) {
        targetContact = await Contact.create({
          name: ticket.contact.name,
          number: ticket.contact.number,
          email: ticket.contact.email || "",
          profilePicUrl: ticket.contact.profilePicUrl || "",
          disableBot: ticket.contact.disableBot,
          companyId: requestedCompanyId
        });
      }
      const targetOpenTicket = await CheckContactOpenTickets(
        targetContact.id,
        targetWhatsapp.id,
        true
      );
      if (targetOpenTicket && targetOpenTicket.id !== ticket.id) {
        throw new AppError("ERR_OTHER_OPEN_TICKET", 400);
      }

      await Message.update(
        {
          companyId: requestedCompanyId,
          contactId: targetContact.id,
          queueId: null
        },
        { where: { ticketId: ticket.id } }
      );
      await TicketNote.update(
        { contactId: targetContact.id },
        { where: { ticketId: ticket.id } }
      );
      targetCompanyId = requestedCompanyId;
      targetContactId = targetContact.id;
      targetWhatsappId = targetWhatsapp.id;
      status = userId ? "open" : "pending";
      companyId = targetCompanyId;
    }

    if (queueId && queueId !== ticket.queueId) {
      const newQueue = await Queue.findByPk(queueId);
      if (!newQueue) {
        throw new AppError("Queue not found", 404);
      }
      if (newQueue.companyId !== targetCompanyId) {
        throw new AppError("Queue does not belong to the same company", 403);
      }
    }

    if (userId) {
      const targetUser = await User.findOne({
        where: { id: Number(userId), companyId: targetCompanyId }
      });
      if (!targetUser) {
        throw new AppError("ERR_USER_NOT_FOUND", 404);
      }
    }

    if (user && ticket.status !== "pending") {
      if (user.profile !== "admin" && ticket.userId !== user.id) {
        throw new AppError("ERR_FORBIDDEN", 403);
      }
    }

    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId,
      companyId,
      whatsappId: ticket.whatsappId
    });

    if (ticket.channel === "whatsapp" && status === "open") {
      try {
        await SetTicketMessagesAsRead(ticket);
      } catch (err) {
        logger.error(
          { ticketId, message: err?.message },
          "Could not set messages as read."
        );
      }
    }

    const oldStatus = ticket.status;
    const oldUserId = ticket.user?.id;
    const oldQueueId = ticket.queueId;

    // only admin can accept pending tickets that have no queue
    if (!oldQueueId && userId && oldStatus === "pending" && status === "open") {
      const acceptUser = await User.findByPk(userId);
      if (acceptUser.profile !== "admin") {
        throw new AppError("ERR_NO_PERMISSION", 403);
      }
    }

    // only admin can reopen closed tickets
    if (
      status &&
      oldStatus === "closed" &&
      status !== "closed" &&
      user &&
      user.profile !== "admin"
    ) {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }

    if (oldStatus === "closed") {
      await CheckContactOpenTickets(ticket.contactId, ticket.whatsappId);
      chatbot = null;
      queueOptionId = null;
    }

    if (status !== undefined && ["closed"].indexOf(status) > -1) {
      if (!ticketTraking.finishedAt) {
        ticketTraking.finishedAt = moment().toDate();
        ticketTraking.whatsappId = ticket.whatsappId;
        ticketTraking.userId = ticket.userId;
      }

      if (
        userRatingSetting === "enabled" &&
        ticket.whatsapp?.status === "CONNECTED" &&
        ticket.userId &&
        !isGroup &&
        !ticket.contact.disableBot
      ) {
        if (!ticketTraking.ratingAt && !justClose) {
          if (ticket.channel === "whatsapp") {
            const ratingTxt =
              ticket.whatsapp.ratingMessage?.trim() ||
              _t("Please rate our service", ticket);
            const rateInstructions = _t("Send a rating from 1 to 5", ticket);
            const rateReturn = _t(
              "Send *`!`* to return to the service",
              ticket
            );
            const bodyRatingMessage = `${ratingTxt}\n\n*${rateInstructions}*\n\n${rateReturn}`;

            await SendWhatsAppMessage({ body: bodyRatingMessage, ticket });
          }

          ticketTraking.ratingAt = moment().toDate();
          await ticketTraking.save();

          await ticket.update({
            chatbot: null,
            queueOptionId: null,
            status: "closed"
          });

          await ticket.reload();

          io.to(`company-${ticket.companyId}-open`)
            .to(`queue-${ticket.queueId}-open`)
            .to(ticketId.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
              action: "delete",
              ticketId: ticket.id
            });

          io.to(`company-${ticket.companyId}-closed`)
            .to(`queue-${ticket.queueId}-closed`)
            .to(ticket.id.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
              action: "update",
              ticket,
              ticketId: ticket.id
            });

          return { ticket, oldStatus, oldUserId };
        }
      }

      if (
        !isGroup &&
        !ticket.contact.disableBot &&
        !justClose &&
        ticket.whatsapp?.complationMessage.trim() &&
        ticket.whatsapp.status === "CONNECTED"
      ) {
        const body = formatBody(
          `${ticket.whatsapp.complationMessage.trim()}`,
          ticket
        );

        if (ticket.channel === "whatsapp" && !isGroup) {
          const sentMessage = await SendWhatsAppMessage({ body, ticket });

          await verifyMessage(sentMessage, ticket, ticket.contact);
        }
      }

      const keepUserAndQueue = await GetCompanySetting(
        companyId,
        "keepUserAndQueue",
        "enabled"
      );

      if (keepUserAndQueue === "disabled") {
        queueId = null;
        userId = null;
      }
    }

    if (queueId !== undefined && queueId !== null && !ticketTraking.startedAt) {
      ticketTraking.queuedAt = moment().toDate();
    }

    // Only stamp chatbotendAt on the first chatbot→human hand-off, i.e. before
    // the ticket has ever been accepted (startedAt not yet set). Subsequent
    // transfers that go through a chatbot queue and then back should not
    // overwrite this field; they belong to serviceTime, not waitTime.
    if (ticket.chatbot && !chatbot && !ticketTraking.startedAt) {
      ticketTraking.chatbotendAt = moment().toDate();
    }

    await ticket.update({
      status,
      queueId,
      userId,
      companyId: targetCompanyId,
      contactId: targetContactId,
      whatsappId: targetWhatsappId,
      chatbot,
      queueOptionId
    });

    if (changingCompany) {
      ticketTraking.companyId = targetCompanyId;
      ticketTraking.userId = null;
    }
    if (changingWhatsapp || changingCompany) {
      ticketTraking.whatsappId = targetWhatsappId;
    }

    if (oldStatus !== status) {
      if (oldStatus === "closed" && status === "open") {
        await incrementCounter(companyId, "ticket-reopen");
      } else if (status === "open") {
        await incrementCounter(companyId, "ticket-accept");
      } else if (status === "closed") {
        await incrementCounter(companyId, "ticket-close");
      } else if (status === "pending" && oldQueueId !== queueId) {
        await incrementCounter(companyId, "ticket-transfer");
      }
    }

    await ticket.reload();

    const queueChanged = sourceQueueId !== ticket.queueId;
    const transferChanged = changingCompany || changingWhatsapp || queueChanged;
    if (transferChanged) {
      try {
        await TicketTransferLog.create({
          ticketId: ticket.id,
          userId: reqUserId ? Number(reqUserId) : null,
          sourceCompanyId: Number(sourceCompanyId),
          targetCompanyId: Number(ticket.companyId),
          sourceWhatsappId,
          targetWhatsappId: ticket.whatsappId,
          sourceQueueId,
          targetQueueId: ticket.queueId,
          transferType: changingCompany
            ? "company"
            : changingWhatsapp
              ? "connection"
              : "queue"
        });
      } catch (auditError) {
        logger.error(
          { ticketId: ticket.id, error: auditError?.message },
          "Could not write ticket transfer audit log"
        );
      }
    }

    status = ticket.status;

    if (status !== undefined && ["pending"].indexOf(status) > -1) {
      if (!ticketTraking.startedAt) {
        ticketTraking.whatsappId = ticket.whatsappId;
        ticketTraking.queuedAt = moment().toDate();
        ticketTraking.startedAt = null;
        ticketTraking.userId = null;
      }
      io.to(`company-${companyId}-mainchannel`).emit(
        `company-${companyId}-ticket`,
        {
          action: "removeFromList",
          ticketId: ticket?.id
        }
      );
    }

    if (status !== undefined && ["open"].indexOf(status) > -1) {
      if (!ticketTraking.startedAt) {
        ticketTraking.startedAt = moment().toDate();
        ticketTraking.ratingAt = null;
        ticketTraking.rated = false;
        ticketTraking.whatsappId = ticket.whatsappId;
        ticketTraking.userId = ticket.userId;
      }
      io.to(`company-${companyId}-mainchannel`).emit(
        `company-${companyId}-ticket`,
        {
          action: "removeFromList",
          ticketId: ticket?.id
        }
      );

      io.to(`company-${companyId}-mainchannel`).emit(
        `company-${companyId}-ticket`,
        {
          action: "updateUnread",
          ticketId: ticket?.id
        }
      );
    }

    await ticketTraking.save();

    if (
      !dontRunChatbot &&
      !ticket.userId &&
      ticket.queueId &&
      ticket.queueId !== oldQueueId
    ) {
      const wbot = await GetTicketWbot(ticket);
      if (wbot) {
        await startQueue(wbot, ticket);
        await ticket.reload();
      }
    }

    if (
      !isGroup &&
      !ticket.chatbot &&
      !ticket.contact.disableBot &&
      !fromChatbot &&
      !dontRunChatbot
    ) {
      let accepted = false;
      if (
        ticket.userId &&
        ticket.status === "open" &&
        ticket.userId !== oldUserId
      ) {
        const acceptedMessage = await GetCompanySetting(
          companyId,
          "ticketAcceptedMessage",
          ""
        );

        if (acceptedMessage && ticket.whatsapp?.status === "CONNECTED") {
          const acceptUser = await User.findByPk(userId);
          await sendFormattedMessage(acceptedMessage, ticket, acceptUser);
          accepted = true;
        }
      }

      if (
        !accepted &&
        oldQueueId &&
        ticket.queueId &&
        oldQueueId !== ticket.queueId &&
        ticket.whatsapp?.status === "CONNECTED"
      ) {
        const systemTransferMessage = await GetCompanySetting(
          companyId,
          "transferMessage",
          ""
        );
        const transferMessage =
          ticket.whatsapp.transferMessage || systemTransferMessage;

        if (transferMessage) {
          await sendFormattedMessage(transferMessage, ticket);
        }
      }
    }

    if (justClose && status === "closed") {
      io.to(`company-${companyId}-mainchannel`).emit(
        `company-${companyId}-ticket`,
        {
          action: "removeFromList",
          ticketId: ticket?.id
        }
      );
    } else if (ticket.status === "closed" && ticket.status !== oldStatus) {
      io.to(`company-${companyId}-${oldStatus}`)
        .to(`queue-${ticket.queueId}-${oldStatus}`)
        .to(`user-${oldUserId}`)
        .emit(`company-${companyId}-ticket`, {
          action: "removeFromList",
          ticketId: ticket.id
        });
    }

    const ticketForSocket = changingCompany
      ? await ShowTicketService(ticket.id, targetCompanyId)
      : ticket;
    websocketUpdateTicket(ticketForSocket, [`user-${oldUserId}`]);

    if (changingCompany) {
      io.to(`company-${sourceCompanyId}-ticket`).emit(
        `company-${sourceCompanyId}-ticket`,
        { action: "delete", ticketId: ticket.id }
      );
    }

    return { ticket, oldStatus, oldUserId };
  } catch (err) {
    logger.error(
      { error: err?.name, message: err?.message, stack: err?.stack },
      "UpdateTicketService"
    );
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError("Error updating ticket", 500);
  }
};

export default UpdateTicketService;
