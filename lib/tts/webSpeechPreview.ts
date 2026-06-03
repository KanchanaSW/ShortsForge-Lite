export function previewTextWithWebSpeech(text: string): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return false;
  }

  const trimmed = text.trim();
  if (!trimmed) return false;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
  return true;
}
