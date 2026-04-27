import dotenv from "dotenv";

dotenv.config();

const llmProvider = (process.env.LLM_PROVIDER || "auto").trim().toLowerCase();
const erpWriteEnabled = ["1", "true", "yes", "on"].includes(
  (process.env.ERP_WRITE_ENABLED || "false").trim().toLowerCase()
);
const erpDirectFastpath = ["1", "true", "yes", "on"].includes(
  (process.env.ERP_DIRECT_FASTPATH || "true").trim().toLowerCase()
);
const maxGlobalContextChars = Number(process.env.MAX_GLOBAL_CONTEXT_CHARS || 4000);
const ollamaTimeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 180000);
const ollamaNumCtx = Number(process.env.OLLAMA_NUM_CTX || 2048);
const ollamaNumPredict = Number(process.env.OLLAMA_NUM_PREDICT || 256);
const waQueryTimeoutMs = Number(process.env.WA_QUERY_TIMEOUT_MS || 180000);
const waConnectTimeoutMs = Number(process.env.WA_CONNECT_TIMEOUT_MS || 60000);
const waKeepAliveIntervalMs = Number(process.env.WA_KEEPALIVE_INTERVAL_MS || 15000);
const waReconnectBaseDelayMs = Number(process.env.WA_RECONNECT_BASE_DELAY_MS || 2000);
const waReconnectMaxDelayMs = Number(process.env.WA_RECONNECT_MAX_DELAY_MS || 30000);
const waFireInitQueries = ["1", "true", "yes", "on"].includes(
  (process.env.WA_FIRE_INIT_QUERIES || "false").trim().toLowerCase()
);

export const config = {
  companyName: process.env.COMPANY_NAME || "GTM Alimentos, Q'Pescado e Bem Fresco",
  agentName: process.env.AGENT_NAME || "GTM Assistente",
  salesUrl: process.env.SALES_URL || "https://sualoja.com.br",
  employeePortalUrl: process.env.EMPLOYEE_PORTAL_URL || "https://gtmalimentos.intranet",
  partnerRegistrationUrl: process.env.PARTNER_REGISTRATION_URL || "https://gtmalimentos.com.br/parceiros",
  supplierContact: (process.env.SUPPLIER_CONTACT || "vendas1@gtmdistribuidora.com.br").trim(),
  directorPin: (process.env.DIRECTOR_PIN || "1234").trim(),
  geminiApiKey: (process.env.GEMINI_API_KEY || "").trim(),
  geminiModel: (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim(),
  llmProvider: ["auto", "gemini", "ollama"].includes(llmProvider) ? llmProvider : "auto",
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").trim(),
  ollamaModel: (process.env.OLLAMA_MODEL || "llama3.2").trim(),
  ollamaTimeoutMs: Number.isFinite(ollamaTimeoutMs) ? ollamaTimeoutMs : 180000,
  ollamaNumCtx: Number.isFinite(ollamaNumCtx) ? ollamaNumCtx : 2048,
  ollamaNumPredict: Number.isFinite(ollamaNumPredict) ? ollamaNumPredict : 256,
  erpWriteEnabled,
  erpDirectFastpath,
  waQueryTimeoutMs: Number.isFinite(waQueryTimeoutMs) ? waQueryTimeoutMs : 180000,
  waConnectTimeoutMs: Number.isFinite(waConnectTimeoutMs) ? waConnectTimeoutMs : 60000,
  waKeepAliveIntervalMs: Number.isFinite(waKeepAliveIntervalMs) ? waKeepAliveIntervalMs : 15000,
  waReconnectBaseDelayMs: Number.isFinite(waReconnectBaseDelayMs) ? waReconnectBaseDelayMs : 2000,
  waReconnectMaxDelayMs: Number.isFinite(waReconnectMaxDelayMs) ? waReconnectMaxDelayMs : 30000,
  waFireInitQueries,
  maxGlobalContextChars: Number.isFinite(maxGlobalContextChars) ? maxGlobalContextChars : 4000,
  welcomeMessage:
    process.env.WELCOME_MESSAGE ||
    "Bem-vindo(a) a GTM Alimentos, Q'Pescado e Bem Fresco!",
  humanHandoffPhone: process.env.HUMAN_HANDOFF_PHONE || ""
};
