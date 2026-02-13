import Mustache from "mustache";
import Ticket from "../models/Ticket";
import User from "../models/User";
import Contact from "../models/Contact";
import ContactListItem from "../models/ContactListItem";
import { _t } from "../services/TranslationServices/i18nService";
import Company from "../models/Company";

type MustacheFormatProps = {
  body: string;
  ticket?: Ticket;
  contact?: Contact | ContactListItem;
  currentUser?: User;
  customTags?: [string, string];
};

// ===========================================
// FUNÇÃO AUXILIAR: CALCULAR TEMPO DE ESPERA
// ===========================================
const calculateWaitTime = (ticket?: Ticket): string => {
  if (!ticket || !ticket.createdAt) {
    return "00:00:00";
  }
  
  const now = new Date();
  const createdAt = new Date(ticket.createdAt);
  
  // Se o ticket ainda não foi aceito (sem userId) ou está fechado
  // usamos a hora atual como referência
  const acceptedAt = ticket.updatedAt || now;
  
  const diffMs = acceptedAt.getTime() - createdAt.getTime();
  
  // Proteção contra valores negativos
  if (diffMs < 0) {
    return "00:00:00";
  }
  
  const diffSeconds = Math.floor(diffMs / 1000);
  
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// ===========================================
// FUNÇÃO AUXILIAR: CALCULAR TEMPO EM MINUTOS
// ===========================================
const calculateWaitMinutes = (ticket?: Ticket): string => {
  if (!ticket || !ticket.createdAt) {
    return "0";
  }
  
  const now = new Date();
  const createdAt = new Date(ticket.createdAt);
  const acceptedAt = ticket.updatedAt || now;
  
  const diffMs = acceptedAt.getTime() - createdAt.getTime();
  
  if (diffMs < 0) {
    return "0";
  }
  
  const diffMinutes = Math.floor(diffMs / 60000);
  
  return diffMinutes.toString();
};

export const genGreeting = (
  lngSource: Ticket | Contact | Company | string
): string => {
  const greetings = [
    _t("Hello", lngSource),
    _t("Good morning", lngSource),
    _t("Good afternoon", lngSource),
    _t("Good evening", lngSource)
  ];
  const h = new Date().getHours();
  // eslint-disable-next-line no-bitwise
  return greetings[(h / 6) >> 0];
};

export function mustacheValues(
  ticket: Ticket,
  contact: Contact | ContactListItem,
  currentUser: User
): Record<string, any> {
  contact = contact || ticket?.contact;

  const name = contact?.name || contact?.number || "{{name}}";
  const firstname = name.trim().split(" ")[0] || "{{firstname}}";
  const greeting = genGreeting(
    ticket ||
      ((contact as Contact)?.language !== undefined
        ? (contact as Contact)
        : (contact as ContactListItem)?.company)
  );
  const queue = ticket?.queue?.name || "{{queue}}";
  const user = currentUser?.name || ticket?.user?.name || "{{user}}";
  const email = contact?.email || "{{email}}";
  const now = new Date();
  const protocol =
    (ticket &&
      `${now.toISOString().split("T")[0].replace(/-/g, "")}-${ticket.id}`) ||
    "{{protocol}}";
  const time = now.toLocaleTimeString("en-GB", { hour12: false });
  
  // ===========================================
  // VARIÁVEIS DE TEMPO DE ESPERA
  // ===========================================
  const wait_time = calculateWaitTime(ticket);
  const wait_minutes = calculateWaitMinutes(ticket);
  const wait_seconds = ticket?.createdAt 
    ? Math.floor((new Date().getTime() - new Date(ticket.createdAt).getTime()) / 1000).toString() 
    : "0";
  
  // Formatações alternativas
  const wait_time_br = wait_time.replace(/:/g, 'h') + 'm'; // 00h01m30s
  const wait_time_br_complete = wait_time.replace(/:/g, 'h ') + 'm'; // 00h 01m 30s
  
  // Status do ticket
  const ticket_status = ticket?.status || "{{ticket_status}}";
  const is_open = ticket?.status === "open" ? "Sim" : "Não";
  const is_accepted = ticket?.userId ? "Sim" : "Não";

  let extraInfo: any;

  if (contact instanceof ContactListItem) {
    extraInfo = {};
  } else if (contact && contact.extraInfo) {
    extraInfo = contact.extraInfo.reduce((acc, field) => {
      acc[field.name] = field.value;
      return acc;
    }, {});
  }

  const view = {
    ...extraInfo,
    // Informações básicas
    name,
    firstname,
    email,
    greeting,
    queue,
    protocol,
    user,
    time,
    ticket: ticket?.id || "{{ticket}}",
    
    // Variações do greeting
    ms: greeting,
    gretting: greeting,
    
    // Variações em português
    hora: time,
    fila: queue,
    usuario: user,
    
    // ===========================================
    // VARIÁVEIS DE TEMPO DE ESPERA - TODAS AS VERSÕES
    // ===========================================
    // Formato HH:MM:SS
    wait_time,
    waiting_time: wait_time,
    tempo_espera: wait_time,
    
    // Apenas minutos
    wait_minutes,
    minutos_espera: wait_minutes,
    
    // Apenas segundos
    wait_seconds,
    segundos_espera: wait_seconds,
    
    // Formatos alternativos
    wait_time_br,
    wait_time_br_complete,
    
    // ===========================================
    // VARIÁVEIS DE DATA/HORA DO TICKET
    // ===========================================
    ticket_created_at: ticket?.createdAt 
      ? new Date(ticket.createdAt).toLocaleString("pt-BR") 
      : "{{ticket_created_at}}",
    ticket_created_date: ticket?.createdAt 
      ? new Date(ticket.createdAt).toLocaleDateString("pt-BR") 
      : "{{ticket_created_date}}",
    ticket_created_time: ticket?.createdAt 
      ? new Date(ticket.createdAt).toLocaleTimeString("pt-BR", { hour12: false }) 
      : "{{ticket_created_time}}",
    
    ticket_accepted_at: ticket?.updatedAt && ticket?.userId
      ? new Date(ticket.updatedAt).toLocaleString("pt-BR")
      : "Aguardando aceite",
    ticket_accepted_date: ticket?.updatedAt && ticket?.userId
      ? new Date(ticket.updatedAt).toLocaleDateString("pt-BR")
      : "{{ticket_accepted_date}}",
    ticket_accepted_time: ticket?.updatedAt && ticket?.userId
      ? new Date(ticket.updatedAt).toLocaleTimeString("pt-BR", { hour12: false })
      : "{{ticket_accepted_time}}",
    
    // ===========================================
    // STATUS DO TICKET
    // ===========================================
    ticket_status,
    is_open,
    is_accepted,
    
    // Extra info original
    extraInfo
  };

  return view;
}

function placeholderVariables(template: string): Record<string, string> {
  const tokens = Mustache.parse(template);
  const placeholder: Record<string, string> = {};

  tokens.forEach(token => {
    if (token[0] === "name") {
      placeholder[token[1]] = `{{${token[1]}}}`;
    }
  });

  return placeholder;
}

export function mustacheFormat({
  body,
  ticket,
  contact,
  currentUser,
  customTags = null
}: MustacheFormatProps): string {
  if (!body || (!ticket && !contact && !currentUser)) {
    return body;
  }

  const view = mustacheValues(ticket, contact, currentUser);

  return Mustache.render(
    body,
    { ...placeholderVariables(body), ...view },
    null,
    customTags
  );
}

export function formatBody(
  body: string,
  ticket?: Ticket,
  currentUser?: User,
  customTags: [string, string] = null
): string {
  return mustacheFormat({
    body,
    ticket,
    contact: ticket?.contact,
    currentUser,
    customTags
  });
}

export default formatBody;
