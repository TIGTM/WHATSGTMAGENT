import pino from "pino";
import qrcode from "qrcode-terminal";
import {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState
} from "baileys";
import { Boom } from "@hapi/boom";
import { replyToUser } from "./agent.js";

function getTextFromMessage(message) {
  return (
    message?.conversation ||
    message?.extendedTextMessage?.text ||
    message?.imageMessage?.caption ||
    message?.videoMessage?.caption ||
    ""
  );
}

export async function startWhatsAppBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "error" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log("[WhatsApp] Escaneie o QR code acima para autenticar.");
    }

    if (connection === "open") {
      console.log("[WhatsApp] Conexao estabelecida com sucesso.");
    }

    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;

      console.log("[WhatsApp] Conexao encerrada.", { code, shouldReconnect });

      if (shouldReconnect) {
        startWhatsAppBot().catch((error) => {
          console.error("[WhatsApp] Erro ao reconectar:", error.message);
        });
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") continue;

      const text = getTextFromMessage(msg.message);
      
      console.log(`[Nova Mensagem] Recebida de: ${remoteJid} | Texto: "${text}" | Tipo: ${type}`);

      if (!text) {
        console.log(`[Aviso] Mensagem sem texto ignorada.`);
        continue;
      }

      const userName = msg.pushName || "Cliente";

      try {
        console.log(`[Processando] Enviando para replayToUser...`);
        const answer = await replyToUser({
          userId: remoteJid,
          userName,
          text
        });

        if (answer) {
          console.log(`[Agente] Respondendo para ${remoteJid}...`);
          await sock.sendMessage(remoteJid, { text: answer });
        } else {
          console.log(`[Agente] Bot pausado para ${remoteJid}, não enviou resposta.`);
        }
      } catch (error) {
        console.error("[Agent] Erro ao processar mensagem:", error.message);
        await sock.sendMessage(remoteJid, {
          text: "Tive uma instabilidade agora. Pode tentar novamente em alguns segundos?"
        });
      }
    }
  });

  return sock;
}
