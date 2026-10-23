import {
  Op,
  fn,
  where,
  col,
  Filterable,
  Includeable,
  WhereOptions
} from "sequelize";
import { startOfDay, endOfDay, parseISO } from "date-fns";

import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import User from "../../models/User";
import ShowUserService from "../UserServices/ShowUserService";
import Tag from "../../models/Tag";
import TicketTag from "../../models/TicketTag";
import Whatsapp from "../../models/Whatsapp";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import ContactTag from "../../models/ContactTag";
import Company from "../../models/Company";

interface Request {
  isSearch?: boolean;
  searchParam?: string;
  nextUpdatedAt?: string;
  status?: string;
  groups?: string;
  date?: string;
  updatedAt?: string;
  minUpdatedAt?: string;
  showAll?: string;
  userId: string;
  withUnreadMessages?: string;
  notClosed?: boolean;
  all?: boolean;
  queueIds: number[];
  contactId?: number;
  tags: number[];
  users: number[];
  companyId: number;
  isSuper?: boolean;
}

interface Response {
  tickets: Ticket[];
  count: number | null;
}

const ListTicketsService = async ({
  isSearch = false,
  searchParam = "",
  nextUpdatedAt,
  queueIds,
  contactId,
  tags,
  users,
  status,
  groups,
  date,
  updatedAt,
  minUpdatedAt,
  showAll,
  userId,
  withUnreadMessages,
  notClosed,
  all,
  companyId,
  isSuper = false
}: Request): Promise<Response> => {
  let ticketId: number;

  if (/^\d{8}-\d+$/.test(searchParam)) {
    const parts = searchParam.split("-");
    ticketId = parseInt(parts[1], 10);
  }

  if (Number(searchParam)) {
    ticketId = Number(searchParam);
  }

  if (ticketId) {
    searchParam = "";
  }

  if (
    (searchParam.trim().startsWith('"') && searchParam.trim().endsWith('"')) ||
    (searchParam.trim().startsWith("'") && searchParam.trim().endsWith("'"))
  ) {
    searchParam = searchParam.trim().slice(1, -1);
  }

  const globalScope = isSuper && showAll === "true";
  const globalCompanyIds = globalScope
    ? (
        await Company.findAll({ where: { status: true }, attributes: ["id"] })
      ).map(company => company.id)
    : [companyId];

  const groupsTab =
    !globalScope &&
    !isSearch &&
    (await GetCompanySetting(companyId, "groupsTab", "disabled")) === "enabled";

  const user = await ShowUserService(userId);

  const andedOrs: WhereOptions<Ticket>[] = [
    {
      [Op.or]: [{ userId }, { status: "pending" }]
    }
  ];

  let whereCondition: Filterable["where"] = {
    [Op.and]: andedOrs,
    queueId: {
      [Op.or]: user.profile === "admin" ? [queueIds, null] : [queueIds]
    }
  };

  if (groupsTab) {
    whereCondition.isGroup = groups === "true";
  }
  let includeCondition: Includeable[];

  includeCondition = [
    {
      model: Contact,
      as: "contact",
      include: ["tags", "extraInfo"],
      attributes: ["id", "name", "number", "email", "profilePicUrl", "presence"]
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
      attributes: ["id", "name"]
    }
  ];

  if (showAll === "true" && (user.profile === "admin" || globalScope)) {
    andedOrs.length = 0;
    whereCondition = {
      [Op.and]: andedOrs
    };
    if (groupsTab && !globalScope) {
      whereCondition = {
        ...whereCondition,
        isGroup: groups === "true"
      };
    }
  }

  if (status) {
    whereCondition = {
      ...whereCondition,
      status
    };
  }

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

    andedOrs.push({
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
    });
  }

  if (date) {
    whereCondition = {
      [Op.and]: andedOrs,
      createdAt: {
        [Op.between]: [+startOfDay(parseISO(date)), +endOfDay(parseISO(date))]
      }
    };
  }

  if (updatedAt) {
    whereCondition = {
      [Op.and]: andedOrs,
      updatedAt: {
        [Op.between]: [
          +startOfDay(parseISO(updatedAt)),
          +endOfDay(parseISO(updatedAt))
        ]
      }
    };
  }

  if (withUnreadMessages === "true") {
    whereCondition = {
      ...whereCondition,
      unreadMessages: { [Op.gt]: 0 }
    };
  }

  if (Array.isArray(tags) && tags.length > 0) {
    const [ticketTags, contactTags] = await Promise.all([
      TicketTag.findAll({
        where: { tagId: { [Op.in]: tags } },
        attributes: ["tagId", "ticketId"]
      }),
      ContactTag.findAll({
        where: { tagId: { [Op.in]: tags } },
        attributes: ["tagId", "contactId"]
      })
    ]);

    const ticketIdsByTag = new Map<number, Set<number>>();
    const contactIdsByTag = new Map<number, Set<number>>();

    ticketTags.forEach(ticketTag => {
      if (!ticketIdsByTag.has(ticketTag.tagId)) {
        ticketIdsByTag.set(ticketTag.tagId, new Set<number>());
      }
      ticketIdsByTag.get(ticketTag.tagId).add(ticketTag.ticketId);
    });

    contactTags.forEach(contactTag => {
      if (!contactIdsByTag.has(contactTag.tagId)) {
        contactIdsByTag.set(contactTag.tagId, new Set<number>());
      }
      contactIdsByTag.get(contactTag.tagId).add(contactTag.contactId);
    });

    const intersectByTag = <T>(
      tagIds: number[],
      valuesByTag: Map<number, Set<T>>
    ): T[] => {
      if (tagIds.some(tagId => !valuesByTag.has(tagId))) return [];

      return tagIds
        .map(tagId => [...valuesByTag.get(tagId)])
        .reduce((result, values) =>
          result.filter(value => values.includes(value))
        );
    };

    const ticketsIntersection = intersectByTag(tags, ticketIdsByTag);
    const contactsIntersection = intersectByTag(tags, contactIdsByTag);

    andedOrs.push({
      [Op.or]: [
        {
          id: { [Op.in]: ticketsIntersection }
        },
        {
          contactId: { [Op.in]: contactsIntersection }
        }
      ]
    });
  }

  if (contactId) {
    whereCondition = {
      ...whereCondition,
      contactId
    };
  }

  if (ticketId) {
    whereCondition = {
      ...whereCondition,
      id: ticketId
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

  const limit = all ? undefined : 40;

  if (!all && nextUpdatedAt) {
    const parsedNextUpdatedAt = new Date(nextUpdatedAt);

    if (Number.isNaN(parsedNextUpdatedAt.getTime())) {
      throw new AppError("ERR_INVALID_NEXT_UPDATED_AT", 400);
    }

    andedOrs.push({
      updatedAt: { [Op.lt]: parsedNextUpdatedAt }
    });
  }

  if (minUpdatedAt) {
    const parsedMinUpdatedAt = new Date(minUpdatedAt);

    if (Number.isNaN(parsedMinUpdatedAt.getTime())) {
      throw new AppError("ERR_INVALID_MIN_UPDATED_AT", 400);
    }

    andedOrs.push({
      updatedAt: { [Op.gte]: parsedMinUpdatedAt }
    });
  }

  if (notClosed) {
    whereCondition = {
      ...whereCondition,
      status: { [Op.ne]: "closed" }
    };
  }

  whereCondition = {
    ...whereCondition,
    companyId: { [Op.in]: globalCompanyIds }
  };

  const tickets = await Ticket.findAll({
    where: whereCondition,
    include: includeCondition,
    limit,
    order: [
      ["updatedAt", "DESC"],
      ["id", "DESC"]
    ],
    subQuery: false
  });

  return {
    tickets,
    count: null
  };
};

export default ListTicketsService;
