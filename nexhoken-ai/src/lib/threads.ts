import type { UIMessage } from "ai";

export interface Thread {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
}

const KEY = "ken.threads.v1";
const EVENT = "ken-threads-changed";

export function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Thread[]) : [];
  } catch {
    return [];
  }
}

function save(threads: Thread[]) {
  localStorage.setItem(KEY, JSON.stringify(threads));
  window.dispatchEvent(new Event(EVENT));
}

export function createThread(): Thread {
  const t: Thread = { id: crypto.randomUUID().slice(0, 8), title: "New chat", updatedAt: Date.now(), messages: [] };
  save([t, ...loadThreads()]);
  return t;
}

/** Returns the most recent thread, creating one only if none exist. Idempotent. */
export function ensureThread(): Thread {
  const threads = loadThreads();
  const latest = [...threads].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  if (latest) return latest;
  return createThread();
}

export function getThread(id: string) {
  return loadThreads().find((t) => t.id === id);
}

export function ensureThreadWithId(id: string): Thread {
  const existing = getThread(id);
  if (existing) return existing;
  const t: Thread = { id, title: "New chat", updatedAt: Date.now(), messages: [] };
  save([t, ...loadThreads()]);
  return t;
}

function titleFrom(messages: UIMessage[]) {
  const first = messages.find((m) => m.role === "user");
  const text = first?.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim();
  return text ? text.slice(0, 48) : "New chat";
}

export function saveMessages(id: string, messages: UIMessage[]) {
  const threads = loadThreads();
  const idx = threads.findIndex((t) => t.id === id);
  const t: Thread = { id, title: titleFrom(messages), updatedAt: Date.now(), messages };
  if (idx >= 0) threads[idx] = t;
  else threads.unshift(t);
  save(threads);
}

export function deleteThread(id: string) {
  save(loadThreads().filter((t) => t.id !== id));
}

export function onThreadsChange(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
