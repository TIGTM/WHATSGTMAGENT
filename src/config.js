import dotenv from "dotenv";

dotenv.config();

const llmProvider = (process.env.LLM_PROVIDER || "auto").trim().toLowerCase();
const erpWriteEnabled = ["1", "true", "yes", "on"].includes(
  (process.env.ERP_WRITE_ENABLED || "false").trim().toLowerCase()
);
const maxGlobalContextChars = Number(process.env.MAX_GLOBAL_CONTEXT_CHARS || 12000);

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
  ollamaModel: (process.env.OLLAMA_MODEL || "llama3.2:3b-instruct").trim(),
  erpWriteEnabled,
  maxGlobalContextChars: Number.isFinite(maxGlobalContextChars) ? maxGlobalContextChars : 12000,
  welcomeMessage:
    process.env.WELCOME_MESSAGE ||
    "Bem-vindo(a) a GTM Alimentos, Q'Pescado e Bem Fresco!",
  humanHandoffPhone: process.env.HUMAN_HANDOFF_PHONE || ""
};
