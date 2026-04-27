import dotenv from "dotenv";
import { config as botConfig } from "./src/config.js";
import { askGemini } from "./src/gemini.js";

async function test() {
  console.log("Testing with key:", botConfig.geminiApiKey ? "SET" : "EMPTY");
  console.log("Model:", botConfig.geminiModel);
  const prompt = "Me diga mais sobre salmao";
  try {
     const reply = await askGemini({ prompt, history: []});
     console.log("REPLY:", reply);
  } catch(e) {
     if (e.response) {
       console.log("ERROR STATUS:", e.response.status);
       console.log("ERROR DATA:", JSON.stringify(e.response.data));
     } else {
       console.log("ERROR EXCEPTION:", e.message);
     }
  }
}
test();
