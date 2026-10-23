import axios from "axios";
import { logger } from "../../utils/logger";
import Company from "../../models/Company";
import Setting from "../../models/Setting";
import Queue from "../../models/Queue";

type TributaryMode = "divida_ativa" | "iptu";
type TributaryRecord = Record<string, any>;

interface LookupResult {
  mode: TributaryMode;
  document: string;
  name: string;
  records: TributaryRecord[];
  total: number;
  totalValue: number;
}

const MAX_DOCUMENT_DIGITS = 14;
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; data: TributaryRecord[] }>();

const env = (name: string): string => process.env[name]?.trim() || "";

const enabled = (): boolean =>
  env("TRIBUTARY_ENABLED").toLowerCase() === "true";

const activationKey = (mode: TributaryMode): string =>
  mode === "iptu" ? "tributaryIptuEnabled" : "tributaryDividaAtivaEnabled";

const humanQueueKey = (mode: TributaryMode): string =>
  mode === "iptu" ? "tributaryIptuQueueId" : "tributaryDividaAtivaQueueId";

export const getTributaryHumanQueue = async (
  companyId: number,
  mode: TributaryMode
): Promise<Queue | null> => {
  const setting = await Setting.findOne({
    where: { companyId, key: humanQueueKey(mode) }
  });
  const queueId = Number(setting?.value);
  if (!Number.isInteger(queueId) || queueId <= 0) return null;
  return Queue.findOne({ where: { id: queueId, companyId } });
};

export const isTributaryAllowed = async (
  companyId: number,
  mode: TributaryMode
): Promise<boolean> => {
  if (!enabled() || !companyId) return false;

  const company = await Company.findByPk(companyId, {
    attributes: ["allowTributaryDividaAtiva", "allowTributaryIptu"]
  });
  if (!company) return false;

  const licensed =
    mode === "iptu"
      ? company.allowTributaryIptu
      : company.allowTributaryDividaAtiva;
  if (!licensed) return false;

  const setting = await Setting.findOne({
    where: { companyId, key: activationKey(mode) }
  });
  return ["enabled", "true", "1"].includes(
    String(setting?.value || "").toLowerCase()
  );
};

const apiUrl = (): string =>
  env("TRIBUTARY_API_URL") ||
  "https://transparencia.camponovo.ro.gov.br/transparencia/api/api.php";

const cleanDigits = (value: string): string =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, MAX_DOCUMENT_DIGITS);

const normalizeDocumentForComparison = (value: string): string => {
  const digits = cleanDigits(value);
  if (digits.length === 10) return digits.padStart(11, "0");
  if (digits.length === 13) return digits.padStart(14, "0");
  return digits;
};

const isValidCpf = (cpf: string): boolean => {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return digit === Number(cpf[10]);
};

const isValidCnpj = (cnpj: string): boolean => {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calculate = (length: number): number => {
    let sum = 0;
    let weight = length - 7;
    for (let i = 0; i < length; i += 1) {
      sum += Number(cnpj[i]) * weight;
      weight -= 1;
      if (weight === 1) weight = 9;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return (
    calculate(12) === Number(cnpj[12]) && calculate(13) === Number(cnpj[13])
  );
};

export const normalizeDocument = (value: string): string => {
  const document = cleanDigits(value);
  if (!isValidCpf(document) && !isValidCnpj(document)) {
    throw new Error("Informe um CPF ou CNPJ válido para consultar.");
  }
  return document;
};

const requestApi = async (apiId: string, token: string, params = {}) => {
  if (!apiId || !token) {
    throw new Error("Consulta tributária não configurada no servidor.");
  }
  const response = await axios.get(apiUrl(), {
    params: { api: apiId, token, ...params },
    timeout: Number(env("TRIBUTARY_API_TIMEOUT_MS")) || 30000,
    headers: { Accept: "application/json" }
  });
  if (!Array.isArray(response.data) && typeof response.data !== "object") {
    throw new Error("A prefeitura retornou uma resposta inválida.");
  }
  return response.data;
};

const asList = (payload: any): TributaryRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter(item => item && typeof item === "object");
  }

  if (payload && typeof payload === "object") {
    for (const key of [
      "dados",
      "data",
      "rows",
      "results",
      "registros",
      "records",
      "resultado",
      "result",
      "items"
    ]) {
      if (Array.isArray(payload[key])) return asList(payload[key]);
    }

    const nestedArray = Object.values(payload).find(value =>
      Array.isArray(value)
    );
    if (Array.isArray(nestedArray)) return asList(nestedArray);
  }

  return payload && typeof payload === "object" ? [payload] : [];
};

const valueOf = (record: TributaryRecord, ...keys: string[]): string => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null)
      return String(record[key]);
  }

  const entries = Object.entries(record || {});
  for (const key of keys) {
    const entry = entries.find(
      ([recordKey]) => recordKey.toLowerCase() === key.toLowerCase()
    );
    if (entry && entry[1] !== undefined && entry[1] !== null) {
      return String(entry[1]);
    }
  }
  return "";
};

const filterByDocument = (records: TributaryRecord[], document: string) =>
  records.filter(record =>
    [
      "INSMF_CONTRIBUINTE",
      "CNPJ_CNT",
      "CPF_CNT",
      "DOCUMENTO",
      "CPF_CNPJ",
      "INSC_MUNICIPAL",
      "CNPJ_CPF"
    ].some(
      key => normalizeDocumentForComparison(valueOf(record, key)) === document
    )
  );

const getCached = async (
  key: string,
  loader: () => Promise<TributaryRecord[]>
): Promise<TributaryRecord[]> => {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const data = await loader();
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
};

const loadDividaAtivaRecords = async (): Promise<TributaryRecord[]> =>
  getCached("divida-ativa", async () =>
    asList(
      await requestApi(
        env("TRIBUTARY_DIVIDA_API_ID"),
        env("TRIBUTARY_DIVIDA_API_TOKEN")
      )
    )
  );

const lookupDividaAtiva = async (
  document: string
): Promise<TributaryRecord[]> => {
  const records = await loadDividaAtivaRecords();
  return filterByDocument(records, document);
};

const lookupIptu = async (
  document: string
): Promise<{
  records: TributaryRecord[];
  contributor: TributaryRecord | null;
}> => {
  const mapping = await getCached("iptu-mapping", async () =>
    asList(
      await requestApi(
        env("TRIBUTARY_IPTU_MAPPING_API_ID"),
        env("TRIBUTARY_IPTU_MAPPING_API_TOKEN")
      )
    )
  );
  const contributor = mapping.find(
    item =>
      normalizeDocumentForComparison(valueOf(item, "INSMF_CONTRIBUINTE")) ===
      document
  );
  if (!contributor) return { records: [], contributor: null };
  const code = valueOf(contributor, "COD_CONTRIBUINTE");
  if (!code) return { records: [], contributor };
  const futureRecords = asList(
    await requestApi(
      env("TRIBUTARY_IPTU_API_ID"),
      env("TRIBUTARY_IPTU_API_TOKEN"),
      { COD_CNT: code }
    )
  );

  // A API de parcelas futuras não retorna vencidos. A API geral da
  // Dívida Ativa contém os IPTUs em aberto, inclusive os vencidos.
  const activeDebtRecords = (await loadDividaAtivaRecords()).filter(item => {
    const sameContributor =
      normalizeDocumentForComparison(valueOf(item, "INSMF_CONTRIBUINTE")) ===
        document ||
      valueOf(item, "COD_CONTRIBUINTE").replace(/^0+/, "") ===
        code.replace(/^0+/, "");
    const revenue = `${valueOf(
      item,
      "DESC_RECEITA",
      "DESC_RECEITA_PRINCIPAL",
      "RECEITA"
    )}`.toUpperCase();
    const isIptu =
      revenue.includes("IPTU") ||
      revenue.includes("IMPOSTO PREDIAL") ||
      revenue.includes("TERRITORIAL URBANO");
    return sameContributor && isIptu;
  });

  const records = [...futureRecords, ...activeDebtRecords].filter(
    (item, index, list) => {
      const key = [
        valueOf(item, "COD_DIV_PAR", "COD_DIVIDA", "COD_DIV"),
        valueOf(item, "PARCELA_PAR", "NRO_PARCELA", "PARCELA"),
        valueOf(item, "TP_PAR", "COD_RECEITA", "COD_REC_FRC"),
        valueOf(item, "ANO", "ANO_DIVIDA", "ANO_RECEITA"),
        valueOf(item, "DATAVENCI", "DATA_VENCIMENTO")
      ].join("|");
      return (
        list.findIndex(candidate => {
          const candidateKey = [
            valueOf(candidate, "COD_DIV_PAR", "COD_DIVIDA", "COD_DIV"),
            valueOf(candidate, "PARCELA_PAR", "NRO_PARCELA", "PARCELA"),
            valueOf(candidate, "TP_PAR", "COD_RECEITA", "COD_REC_FRC"),
            valueOf(candidate, "ANO", "ANO_DIVIDA", "ANO_RECEITA"),
            valueOf(candidate, "DATAVENCI", "DATA_VENCIMENTO")
          ].join("|");
          return candidateKey === key;
        }) === index
      );
    }
  );

  return { contributor, records };
};

const parseMoney = (value: string): number => {
  const normalized = String(value || "")
    .trim()
    .replace(/[^\d,.-]/g, "");
  if (!normalized) return 0;
  const br = normalized.includes(",")
    ? normalized.replace(/\./g, "").replace(",", ".")
    : normalized;
  const parsed = Number(br);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const lookupTributary = async (
  mode: TributaryMode,
  rawDocument: string,
  companyId: number
): Promise<LookupResult> => {
  if (!enabled()) {
    throw new Error(
      "A integração tributária global está desativada no backend. Configure TRIBUTARY_ENABLED=true."
    );
  }
  if (!companyId) {
    throw new Error("Não foi possível identificar a empresa do atendimento.");
  }
  const company = await Company.findByPk(companyId, {
    attributes: ["allowTributaryDividaAtiva", "allowTributaryIptu"]
  });
  const licensed =
    mode === "iptu"
      ? company?.allowTributaryIptu
      : company?.allowTributaryDividaAtiva;
  const setting = await Setting.findOne({
    where: { companyId, key: activationKey(mode) }
  });
  const activated = ["enabled", "true", "1"].includes(
    String(setting?.value || "").toLowerCase()
  );
  if (!licensed) {
    logger.warn({ companyId, mode }, "tributary feature is not licensed");
    throw new Error(
      "Esta consulta ainda não foi liberada pelo superadmin para esta empresa."
    );
  }
  if (!activated) {
    logger.warn(
      { companyId, mode, settingValue: setting?.value || "missing" },
      "tributary feature is not activated for company"
    );
    throw new Error(
      "Esta consulta está liberada, mas ainda está desativada nas configurações da empresa."
    );
  }
  const document = normalizeDocument(rawDocument);
  try {
    let records: TributaryRecord[];
    let contributor: TributaryRecord | null = null;
    if (mode === "iptu") {
      const iptuResult = await lookupIptu(document);
      records = iptuResult.records;
      contributor = iptuResult.contributor;
    } else {
      records = await lookupDividaAtiva(document);
    }
    const name =
      valueOf(
        contributor || records[0] || {},
        "NOME_CONTRIBUINTE",
        "NOME_CONTRIBUINTE_CADASTRO",
        "NOME",
        "NOME_CLIENTE",
        "RAZAO_SOCIAL"
      ) || "Contribuinte";
    return {
      mode,
      document,
      name,
      records,
      total: records.length,
      totalValue: records.reduce(
        (sum, item) =>
          sum + parseMoney(valueOf(item, "VLTOTAL", "VLPRINCIPAL")),
        0
      )
    };
  } catch (error: any) {
    logger.error({ error: error?.message, mode }, "tributary lookup failed");
    throw new Error("Não foi possível consultar a base tributária agora.");
  }
};

export const detectTributaryMode = (
  title = "",
  message = ""
): TributaryMode | null => {
  const text = `${title} ${message}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (text.includes("[ticketz:iptu]") || text.includes("iptu")) return "iptu";
  if (
    text.includes("[ticketz:divida-ativa]") ||
    text.includes("divida ativa") ||
    text.includes("divida_ativa")
  ) {
    return "divida_ativa";
  }
  return null;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
  );

const formatDateBR = (value: unknown): string => {
  const text = String(value || "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/.exec(text);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : text;
};

export const formatTributaryResult = (
  result: LookupResult,
  hasHumanQueue = false
): string => {
  const label = result.mode === "iptu" ? "IPTU" : "Dívida Ativa";
  if (!result.total) {
    return `Não localizamos registros de ${label} para este CPF/CNPJ.\n\n${
      hasHumanQueue
        ? "Para atendimento detalhado, responda *3*."
        : "Se precisar de ajuda, responda *3* para falar com um atendente."
    }`;
  }
  const details = result.records
    .slice(0, 8)
    .map(item => {
      const year = valueOf(item, "ANO", "ANO_DIVIDA", "ANO_RECEITA") || "-";
      const due = formatDateBR(
        valueOf(item, "DATAVENCI", "DATA_VENCIMENTO") || "-"
      );
      const total = formatMoney(
        parseMoney(valueOf(item, "VLTOTAL", "VLPRINCIPAL"))
      );
      const description = valueOf(item, "DESC_RECEITA", "RECEITA") || label;
      return `• ${year} — ${description} — ${total}${due !== "-" ? ` — vencimento: ${due}` : ""}`;
    })
    .join("\n");
  const remaining =
    result.total > 8 ? `\n… e mais ${result.total - 8} registro(s).` : "";
  return `*Consulta de ${label}*\n\nContribuinte: *${result.name}*\nRegistros encontrados: *${result.total}*\nValor total informado: *${formatMoney(result.totalValue)}*\n\n${details}${remaining}\n\n${
    hasHumanQueue
      ? "Para atendimento detalhado, responda *3*."
      : "Para atendimento detalhado, responda *3* para falar com um atendente."
  }`;
};

export const tributaryPrompt = (mode: TributaryMode): string =>
  `Informe o CPF ou CNPJ para consultar ${mode === "iptu" ? "o IPTU" : "a Dívida Ativa"}.`;

export type { TributaryMode, LookupResult };
