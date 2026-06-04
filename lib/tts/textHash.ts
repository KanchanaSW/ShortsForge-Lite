import { createHash } from "crypto";

export function normalizeTtsText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function getTextHash8(text: string): string {
  const normalized = normalizeTtsText(text);
  return createHash("sha256").update(normalized).digest("hex").slice(0, 8);
}
