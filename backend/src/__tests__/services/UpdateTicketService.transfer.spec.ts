jest.mock("../../helpers/CheckContactOpenTickets", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(null)
}));
jest.mock("../../helpers/SetTicketMessagesAsRead", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("../../libs/socket", () => ({
  getIO: jest.fn(() => ({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn()
  }))
}));
jest.mock("../../models/Ticket", () => ({ __esModule: true, default: {} }));
jest.mock("../../models/Contact", () => ({
  __esModule: true,
  default: { findOne: jest.fn(), create: jest.fn() }
}));
jest.mock("../../models/Company", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../models/Message", () => ({
  __esModule: true,
  default: { update: jest.fn().mockResolvedValue([1]) }
}));
jest.mock("../../models/TicketNote", () => ({
  __esModule: true,
  default: { update: jest.fn().mockResolvedValue([1]) }
}));
jest.mock("../../models/User", () => ({
  __esModule: true,
  default: { findByPk: jest.fn(), findOne: jest.fn() }
}));
jest.mock("../../models/Queue", () => ({
  __esModule: true,
  default: { findByPk: jest.fn(), findOne: jest.fn() }
}));
jest.mock("../../models/Whatsapp", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../models/TicketTransferLog", () => ({
  __esModule: true,
  default: { create: jest.fn().mockResolvedValue({ id: 900 }) }
}));
jest.mock("../../services/TicketServices/ShowTicketService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock(
  "../../services/TicketServices/FindOrCreateATicketTrakingService",
  () => ({
    __esModule: true,
    default: jest.fn()
  })
);
jest.mock("../../helpers/CheckSettings", () => ({
  GetCompanySetting: jest.fn().mockResolvedValue("disabled")
}));
jest.mock("../../helpers/GetTicketWbot", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../services/WbotServices/wbotMessageListener", () => ({
  startQueue: jest.fn(),
  verifyMessage: jest.fn()
}));
jest.mock("../../services/WbotServices/SendWhatsAppMessage", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../services/CounterServices/IncrementCounter", () => ({
  incrementCounter: jest.fn()
}));
jest.mock("../../services/WbotServices/getJidOf", () => ({
  getJidOf: jest.fn()
}));
jest.mock("../../services/TranslationServices/i18nService", () => ({
  _t: jest.fn(value => value)
}));

import UpdateTicketService from "../../services/TicketServices/UpdateTicketService";
import ShowTicketService from "../../services/TicketServices/ShowTicketService";
import FindOrCreateATicketTrakingService from "../../services/TicketServices/FindOrCreateATicketTrakingService";
import User from "../../models/User";
import Company from "../../models/Company";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import TicketNote from "../../models/TicketNote";
import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";
import TicketTransferLog from "../../models/TicketTransferLog";

const makeTicket = () => {
  const ticket: any = {
    id: 100,
    status: "pending",
    channel: "whatsapp",
    companyId: 1,
    contactId: 10,
    whatsappId: 11,
    queueId: 12,
    userId: null,
    chatbot: false,
    isGroup: false,
    contact: {
      id: 10,
      name: "Contato de teste",
      number: "5511999999999",
      email: "contato@example.com",
      disableBot: true,
      isGroup: false
    },
    whatsapp: { id: 11, status: "DISCONNECTED", transferMessage: "" },
    user: null,
    update: jest.fn(async values => {
      Object.assign(ticket, values);
    }),
    reload: jest.fn(async () => ticket)
  };
  return ticket;
};

describe("UpdateTicketService - transferência entre conexões", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("move o ticket, mantém mensagens e grava usuário/fila da conexão destino", async () => {
    const ticket = makeTicket();
    const tracking: any = {
      startedAt: null,
      save: jest.fn().mockResolvedValue(undefined)
    };
    const destinationContact = {
      id: 20,
      name: "Contato de teste",
      number: ticket.contact.number,
      companyId: 2
    };
    const destinationUser = {
      id: 30,
      name: "Atendente destino",
      companyId: 2,
      profile: "user"
    };
    const destinationQueue = { id: 40, name: "Fila destino", companyId: 2 };
    const destinationWhatsapp = {
      id: 22,
      companyId: 2,
      status: "CONNECTED",
      transferMessage: ""
    };

    (User.findByPk as jest.Mock).mockResolvedValue({
      id: 7,
      companyId: 1,
      profile: "admin"
    });
    (Company.findOne as jest.Mock).mockResolvedValue({ id: 2, status: true });
    (Whatsapp.findOne as jest.Mock).mockResolvedValue(destinationWhatsapp);
    (User.findOne as jest.Mock).mockResolvedValue(destinationUser);
    (Queue.findOne as jest.Mock).mockResolvedValue(destinationQueue);
    (Queue.findByPk as jest.Mock).mockResolvedValue(destinationQueue);
    (Contact.findOne as jest.Mock).mockResolvedValue(destinationContact);
    (ShowTicketService as jest.Mock).mockResolvedValue(ticket);
    (FindOrCreateATicketTrakingService as jest.Mock).mockResolvedValue(
      tracking
    );

    const result = await UpdateTicketService({
      ticketId: ticket.id,
      reqUserId: 7,
      ticketData: {
        targetCompanyId: 2,
        whatsappId: destinationWhatsapp.id,
        userId: destinationUser.id,
        queueId: destinationQueue.id
      }
    });

    expect(result.ticket).toBe(ticket);
    expect(ticket.companyId).toBe(2);
    expect(ticket.contactId).toBe(destinationContact.id);
    expect(ticket.whatsappId).toBe(destinationWhatsapp.id);
    expect(ticket.userId).toBe(destinationUser.id);
    expect(ticket.queueId).toBe(destinationQueue.id);
    expect(ticket.status).toBe("open");

    expect(Message.update).toHaveBeenCalledWith(
      {
        companyId: 2,
        contactId: destinationContact.id,
        queueId: null
      },
      { where: { ticketId: ticket.id } }
    );
    expect(TicketNote.update).toHaveBeenCalledWith(
      { contactId: destinationContact.id },
      { where: { ticketId: ticket.id } }
    );
    expect(TicketTransferLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: ticket.id,
        userId: 7,
        sourceCompanyId: 1,
        targetCompanyId: 2,
        sourceWhatsappId: 11,
        targetWhatsappId: 22,
        sourceQueueId: 12,
        targetQueueId: 40,
        transferType: "company"
      })
    );
  });

  it("não falha a transferência se o log de auditoria estiver indisponível", async () => {
    const ticket = makeTicket();
    const tracking: any = {
      startedAt: null,
      save: jest.fn().mockResolvedValue(undefined)
    };
    (User.findByPk as jest.Mock).mockResolvedValue({
      id: 7,
      companyId: 1,
      profile: "admin"
    });
    (Whatsapp.findOne as jest.Mock).mockResolvedValue({
      id: 22,
      companyId: 2,
      status: "CONNECTED",
      transferMessage: ""
    });
    (Company.findOne as jest.Mock).mockResolvedValue({ id: 2, status: true });
    (Contact.findOne as jest.Mock).mockResolvedValue({
      id: 20,
      number: ticket.contact.number,
      companyId: 2
    });
    (FindOrCreateATicketTrakingService as jest.Mock).mockResolvedValue(
      tracking
    );
    (TicketTransferLog.create as jest.Mock).mockRejectedValue(
      new Error("relation does not exist")
    );
    (ShowTicketService as jest.Mock).mockResolvedValue(ticket);

    await expect(
      UpdateTicketService({
        ticketId: ticket.id,
        reqUserId: 7,
        ticketData: { targetCompanyId: 2, whatsappId: 22 }
      })
    ).resolves.toBeDefined();
  });
});
