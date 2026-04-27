import dotenv from "dotenv";
import { config as botConfig } from "./src/config.js";

async function runFullTest() {
  try {
     const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${botConfig.geminiApiKey}`;
     
     const response = await fetch(url, {
       method: "GET",
       headers: { "Content-Type": "application/json" }
     });
     
     const data = await response.json();
     if (!response.ok) {
        console.log("ERROR DATA GET:", JSON.stringify(data, null, 2));
     } else {
        const flashes = data.models.filter(m => m.name.includes("flash")).map(m => `${m.name}: ${m.supportedGenerationMethods.join(',')}`);
        console.log("SUCCESS GET. Flashes:", flashes.join(" | "));
     }
  } catch(e) {
     console.error("ERROR MSG:", e.message);
  }
}
runFullTest();
