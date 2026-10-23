import { Op, fn, where, col, Filterable, Includeable } from "sequelize";
import { startOfDay, endOfDay, parseISO } from "date-fns";

import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import User from "../../models/User";
import ShowUserService from "../UserServices/ShowUserService";
import Tag from "../../models/Tag";
import TicketTag from "../../models/TicketTag";
import Whatsapp from "../../models/Whatsapp";
import Company from "../../models/Company";
import AppError from "../../errors/AppError";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  nextUpdatedAt?: string;
  nextTicketId?: string;
  status?: string;
  date?: string;
  updatedAt?: string;
  showAll?: string;
  userId: string;
  withUnreadMessages?: string;
  queueIds: number[];
  tags: number[];
  users: number[];
  companyId: number;
  isSuper?: boolean;
}

interface Response {
  tickets: Ticket[];
  count: number | null;
  hasMore: boolean;
}

const ListTicketsServiceKanban = async ({
  searchParam = "",
  pageNumber = "1",
  nextUpdatedAt,
  nextTicketId,
  queueIds,
  tags,
  users,
  status,
  date,
  updatedAt,
  showAll,
  userId,
  withUnreadMessages,
  companyId,
  isSuper = false
}: Request): Promise<Response> => {
  const globalScope = isSuper && showAll === "true";
  const globalCompanyIds = globalScope
    ? (
        await Company.findAll({ where: { status: true }, attributes: ["id"] })
      ).map(company => company.id)
    : [companyId];
  let whereCondition: Filterable["where"] = {
    [Op.or]: [{ userId }, { status: "pending" }],
    queueId: { [Op.or]: [queueIds, null] }
  };
  let includeCondition: Includeable[];

  includeCondition = [
    {
      model: Contact,
      as: "contact",
      attributes: ["id", "name", "number", "email", "presence"]
    },
    {
      model: Queue,
      as: "queue",
      attributes: ["id", "name", "color"]
    },
    {
      model: User,
      as: "user",
      attributes: ["id", "name"]
    },
    {
      model: Tag,
      as: "tags",
      attributes: ["id", "name", "color"]
    },
    {
      model: Whatsapp,
      as: "whatsapp",
      attributes: ["name"]
    }
  ];

  if (showAll === "true") {
    whereCondition = globalScope
      ? {}
      : { queueId: { [Op.or]: [queueIds, null] } };
  }

  whereCondition = {
    ...whereCondition,
    status: { [Op.or]: ["pending", "open"] }
  };

  if (searchParam) {
    const sanitizedSearchParam = searchParam.toLocaleLowerCase().trim();

    includeCondition = [
      ...includeCondition,
      {
        model: Message,
        as: "messages",
        attributes: ["id", "body"],
        where: {
          body: where(
            fn("LOWER", col("body")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        },
        required: false,
        duplicating: false
      }
    ];

    whereCondition = {
      ...whereCondition,
      [Op.or]: [
        {
          "$contact.name$": where(
            fn("LOWER", col("contact.name")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        },
        { "$contact.number$": { [Op.like]: `%${sanitizedSearchParam}%` } },
        {
          "$message.body$": where(
            fn("LOWER", col("body")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        }
      ]
    };
  }

  if (date) {
    whereCondition = {
      createdAt: {
        [Op.between]: [+startOfDay(parseISO(date)), +endOfDay(parseISO(date))]
      }
    };
  }

  if (updatedAt) {
    whereCondition = {
      updatedAt: {
        [Op.between]: [
          +startOfDay(parseISO(updatedAt)),
          +endOfDay(parseISO(updatedAt))
        ]
      }
    };
  }

  if (withUnreadMessages === "true") {
    const user = await ShowUserService(userId);
    const userQueueIds = user.queues.map(queue => queue.id);

    whereCondition = {
      [Op.or]: [{ userId }, { status: "pending" }],
      queueId: { [Op.or]: [userQueueIds, null] },
      unreadMessages: { [Op.gt]: 0 }
    };
  }

  if (Array.isArray(tags) && tags.length > 0) {
    const ticketTags = await TicketTag.findAll({
      where: { tagId: { [Op.in]: tags } },
      attributes: ["tagId", "ticketId"]
    });
    const ticketIdsByTag = new Map<number, Set<number>>();

    ticketTags.forEach(ticketTag => {
      if (!ticketIdsByTag.has(ticketTag.tagId)) {
        ticketIdsByTag.set(ticketTag.tagId, new Set<number>());
      }
      ticketIdsByTag.get(ticketTag.tagId).add(ticketTag.ticketId);
    });

    const ticketsIntersection = tags
      .map(tagId => [...(ticketIdsByTag.get(tagId) || [])])
      .reduce((result, values) =>
        result.filter(value => values.includes(value))
      );

    whereCondition = {
      ...whereCondition,
      id: {
        [Op.in]: ticketsIntersection
      }
    };
  }

  if (Array.isArray(users) && users.length > 0) {
    const ticketUsers = await Ticket.findAll({
      where: { userId: { [Op.in]: users } },
      attributes: ["id"]
    });

    whereCondition = {
      ...whereCondition,
      id: {
        [Op.in]: ticketUsers.map(ticket => ticket.id)
      }
    };
  }

  const limit = 40;
  const offset = limit * (+pageNumber - 1);

  whereCondition = {
    ...whereCondition,
    companyId: { [Op.in]: globalCompanyIds }
  };

  const cursorMode = Boolean(nextUpdatedAt && nextTicketId);
  if (cursorMode) {
    const parsedNextUpdatedAt = new Date(nextUpdatedAt);
    const parsedNextTicketId = Number(nextTicketId);

    if (
      Number.isNaN(parsedNextUpdatedAt.getTime()) ||
      !Number.isInteger(parsedNextTicketId)
    ) {
      throw new AppError("ERR_INVALID_NEXT_UPDATED_AT", 400);
    }

    whereCondition = {
      [Op.and]: [
        whereCondition,
        {
          [Op.or]: [
            { updatedAt: { [Op.lt]: parsedNextUpdatedAt } },
            {
              updatedAt: parsedNextUpdatedAt,
              id: { [Op.lt]: parsedNextTicketId }
            }
          ]
        }
      ]
    };
  }

  let count: number | null = null;
  let tickets: Ticket[];

  if (cursorMode) {
    tickets = await Ticket.findAll({
      where: whereCondition,
      include: includeCondition,
      limit: limit + 1,
      order: [
        ["updatedAt", "DESC"],
        ["id", "DESC"]
      ],
      subQuery: false
    });
  } else {
    const result = await Ticket.findAndCountAll({
      where: whereCondition,
      include: includeCondition,
      distinct: true,
      limit,
      offset,
      order: [
        ["updatedAt", "DESC"],
        ["id", "DESC"]
      ],
      subQuery: false
    });
    count = result.count;
    tickets = result.rows;
  }
  const visibleTickets = cursorMode ? tickets.slice(0, limit) : tickets;
  const hasMore = cursorMode
    ? tickets.length > limit
    : count > offset + tickets.length;

  return {
    tickets: visibleTickets,
    count: cursorMode ? null : count,
    hasMore
  };
};

export default ListTicketsServiceKanban;
