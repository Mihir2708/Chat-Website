import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function listModels() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  
  if (data.error) {
    console.error('API Error:', data.error.message);
    return;
  }

  console.log("Available models supporting embedContent:");
  data.models.forEach((m: any) => {
    if (m.supportedGenerationMethods.includes("embedContent")) {
      console.log(`- ${m.name.replace('models/', '')}`);
    }
  });
}
listModels();
