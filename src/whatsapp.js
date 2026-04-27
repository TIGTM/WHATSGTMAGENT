import pino from "pino";
import qrcode from "qrcode-terminal";
import {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState
} from "baileys";
import { Boom } from "@hapi/boom";
import { config } from "./config.js";
import { replyToUser } from "./agent.js";

const processingByUser = new Map();
let reconnectTimer = null;
let reconnectAttempts = 0;

function getTextFromMessage(message) {
  return (
    message?.conversation ||
    message?.extendedTextMessage?.text ||
    message?.imageMessage?.caption ||
    message?.videoMessage?.caption ||
    ""
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function queueByUser(userId, taskFactory) {
  const previous = processingByUser.get(userId) || Promise.resolve();
  const task = previous
    .catch(() => {})
    .then(taskFactory)
    .catch((error) => {
      console.error(`[Queue] Erro ao processar fila de ${userId}:`, error.message);
    })
    .finally(() => {
      if (processingByUser.get(userId) === task) {
        processingByUser.delete(userId);
      }
    });

  processingByUser.set(userId, task);
  return task;
}

async function sendTextWithRetry(sock, remoteJid, text, retries = 2) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      await sock.sendMessage(remoteJid, { text });
      return true;
    } catch (error) {
      const isLast = attempt === retries + 1;
      console.error(`[WhatsApp] Falha ao enviar mensagem (tentativa ${attempt}/${retries + 1}):`, error.message);
      if (isLast) return false;
      await wait(800 * attempt);
    }
  }
  return false;
}

function scheduleReconnect() {
  if (reconnectTimer) return;

  const base = Math.max(500, config.waReconnectBaseDelayMs || 2000);
  const max = Math.max(base, config.waReconnectMaxDelayMs || 30000);
  const delay = Math.min(max, base * (2 ** Math.min(reconnectAttempts, 5)));
  reconnectAttempts += 1;

  console.log(`[WhatsApp] Reagendando reconexão em ${delay}ms (tentativa ${reconnectAttempts}).`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startWhatsAppBot().catch((error) => {
      console.error("[WhatsApp] Erro ao reconectar:", error.message);
      scheduleReconnect();
    });
  }, delay);
}

async function handleIncomingMessage(sock, msg, type) {
  const remoteJid = msg.key.remoteJid;
  const text = getTextFromMessage(msg.message);

  console.log(`[Nova Mensagem] Recebida de: ${remoteJid} | Texto: "${text}" | Tipo: ${type}`);

  if (!text) {
    console.log("[Aviso] Mensagem sem texto ignorada.");
    return;
  }

  const userName = msg.pushName || "Cliente";

  try {
    console.log("[Processando] Enviando para replyToUser...");
    const answer = await replyToUser({
      userId: remoteJid,
      userName,
      text
    });

    if (answer) {
      console.log(`[Agente] Respondendo para ${remoteJid}...`);
      const ok = await sendTextWithRetry(sock, remoteJid, answer, 2);
      if (!ok) {
        console.error(`[WhatsApp] Não foi possível enviar resposta para ${remoteJid}.`);
      }
    } else {
      console.log(`[Agente] Bot pausado para ${remoteJid}, não enviou resposta.`);
    }
  } catch (error) {
    console.error("[Agent] Erro ao processar mensagem:", error.message);
    const fallback = "Tive uma instabilidade agora. Pode tentar novamente em alguns segundos?";
    await sendTextWithRetry(sock, remoteJid, fallback, 1);
  }
}

export async function startWhatsAppBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "error" }),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    fireInitQueries: config.waFireInitQueries,
    defaultQueryTimeoutMs: config.waQueryTimeoutMs,
    connectTimeoutMs: config.waConnectTimeoutMs,
    keepAliveIntervalMs: config.waKeepAliveIntervalMs,
    retryRequestDelayMs: 2000,
    maxMsgRetryCount: 3
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log("[WhatsApp] Escaneie o QR code acima para autenticar.");
    }

    if (connection === "open") {
      reconnectAttempts = 0;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      console.log("[WhatsApp] Conexao estabelecida com sucesso.");
    }

    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;

      console.log("[WhatsApp] Conexao encerrada.", { code, shouldReconnect });

      if (shouldReconnect) {
        scheduleReconnect();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") continue;
      queueByUser(remoteJid, () => handleIncomingMessage(sock, msg, type));
    }
  });

  return sock;
}
