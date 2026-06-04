/** Client-safe SHA-256 text hash matching server-side lib/tts/textHash.ts */
export function normalizeTtsText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export async function getTextHash8(text: string): Promise<string> {
  const normalized = normalizeTtsText(text);
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 8);
}
