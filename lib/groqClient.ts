import Groq from "groq-sdk";

const CHAT_TIMEOUT_MS = 3 * 60 * 1000;

export function createGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not configured. Add it to .env.local."
    );
  }

  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
    timeout: CHAT_TIMEOUT_MS,
    maxRetries: 1,
  });
}
