import dotenv from "dotenv";
dotenv.config();

import { replyToUser } from "./src/agent.js";

async function runTest() {
  console.log("== TESTANDO HOJE ==");
  try {
     // Autenticar primeiro
     await replyToUser({ userId: "123", userName: "Teste", text: "5" });
     await replyToUser({ userId: "123", userName: "Teste", text: "1234" });
     // Perguntar
     const reply = await replyToUser({ userId: "123", userName: "Teste", text: "resumo vendas hoje top 1100" });
     console.log("\\nRESPOSTA FINAL WHATSAPP:", reply);
  } catch(e) {
     console.error("ERRO DIRETO:", e.message);
  }
}
runTest();
