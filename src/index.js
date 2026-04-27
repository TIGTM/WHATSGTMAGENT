import { config } from "./config.js";
import { startWhatsAppBot } from "./whatsapp.js";

async function bootstrap() {
  console.log(`[Boot] Iniciando ${config.agentName} da ${config.companyName}... V3 (Com Diretoria e ERP)`);
  await startWhatsAppBot();
}

bootstrap().catch((error) => {
  console.error("[Boot] Falha fatal ao iniciar o bot:", error);
  process.exit(1);
});
