/* Browser voice helpers: speech recognition (listening) and speech synthesis (speaking). */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

export function getRecognitionCtor(): (new () => AnyRecognition) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function stripMarkdown(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>~|-]{1,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function speak(
  text: string,
  opts: { voiceURI?: string; rate: number; pitch: number; lang: string },
  onEnd?: () => void,
) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(stripMarkdown(text));
  const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === opts.voiceURI);
  if (voice) u.voice = voice;
  u.lang = voice?.lang || opts.lang;
  u.rate = opts.rate;
  u.pitch = opts.pitch;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}
