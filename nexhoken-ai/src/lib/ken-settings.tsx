import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark";

export interface KenSettings {
  name: string;
  personality: string;
  language: string; // display name for the AI, e.g. "English"
  speechLang: string; // BCP-47 code for voice, e.g. "en-US"
  hue: number;
  theme: ThemeMode;
  voiceURI: string;
  rate: number;
  pitch: number;
  autoSpeak: boolean;
  incognito: boolean;
}

export const DEFAULT_SETTINGS: KenSettings = {
  name: "Ken",
  personality: "Friendly, warm and upbeat. Gives clear, concise answers and a touch of humor.",
  language: "English",
  speechLang: "en-US",
  hue: 65,
  theme: "dark",
  voiceURI: "",
  rate: 1,
  pitch: 1,
  autoSpeak: true,
  incognito: false,
};

export const PERSONALITIES = [
  { label: "Friendly", text: DEFAULT_PERSONALITY() },
  { label: "Teacher", text: "Patient tutor. Explains homework step by step with simple examples and checks understanding." },
  { label: "Coder", text: "Senior software engineer. Precise, gives working code with short explanations and best practices." },
  { label: "Planner", text: "Organized coach. Turns goals into clear plans, checklists and schedules." },
  { label: "Funny", text: "Playful and witty. Jokes a lot but still gives helpful answers." },
  { label: "Calm", text: "Calm, kind and supportive. Speaks gently and encourages." },
];

function DEFAULT_PERSONALITY() {
  return "Friendly, warm and upbeat. Gives clear, concise answers and a touch of humor.";
}

export const LANGUAGES = [
  { label: "English", code: "en-US" },
  { label: "Hindi", code: "hi-IN" },
  { label: "Malayalam", code: "ml-IN" },
  { label: "Tamil", code: "ta-IN" },
  { label: "Arabic", code: "ar-SA" },
  { label: "Spanish", code: "es-ES" },
  { label: "French", code: "fr-FR" },
  { label: "German", code: "de-DE" },
  { label: "Portuguese", code: "pt-BR" },
  { label: "Japanese", code: "ja-JP" },
  { label: "Chinese", code: "zh-CN" },
  { label: "Korean", code: "ko-KR" },
];

export const ACCENTS = [
  { label: "Amber", hue: 65 },
  { label: "Coral", hue: 25 },
  { label: "Rose", hue: 0 },
  { label: "Emerald", hue: 155 },
  { label: "Teal", hue: 195 },
  { label: "Ocean", hue: 240 },
];

const KEY = "ken.settings.v1";

const Ctx = createContext<{
  settings: KenSettings;
  update: (patch: Partial<KenSettings>) => void;
  reset: () => void;
} | null>(null);

export function KenSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<KenSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "dark");
    root.style.setProperty("--hue", String(settings.hue));
  }, [settings.theme, settings.hue]);

  const update = useCallback((patch: Partial<KenSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.setItem(KEY, JSON.stringify(DEFAULT_SETTINGS));
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return <Ctx.Provider value={{ settings, update, reset }}>{children}</Ctx.Provider>;
}

export function useKenSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useKenSettings must be used inside KenSettingsProvider");
  return ctx;
}
