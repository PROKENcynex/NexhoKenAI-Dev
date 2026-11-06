import { Link, useNavigate } from "@tanstack/react-router";
import { EyeOffIcon, MenuIcon, MessageSquarePlusIcon, MoonIcon, Settings2Icon, SunIcon, Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import kenFace from "@/assets/ken-logo.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useKenSettings } from "@/lib/ken-settings";
import { createThread, deleteThread, ensureThreadWithId, loadThreads, onThreadsChange, type Thread } from "@/lib/threads";
import { cn } from "@/lib/utils";
import { ChatWindow } from "./ChatWindow";
import { SettingsPanel } from "./SettingsPanel";

export function KenApp({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const { settings, update } = useKenSettings();
  const [initial] = useState(() => ensureThreadWithId(threadId));
  const [threads, setThreads] = useState<Thread[]>(() => loadThreads());
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => onThreadsChange(() => setThreads(loadThreads())), []);

  const sorted = useMemo(() => [...threads].sort((a, b) => b.updatedAt - a.updatedAt), [threads]);

  const newChat = () => {
    const t = createThread();
    setMenuOpen(false);
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  };

  const remove = (id: string) => {
    deleteThread(id);
    if (id === threadId) {
      const rest = loadThreads();
      const next = rest[0] ?? createThread();
      navigate({ to: "/chat/$threadId", params: { threadId: next.id } });
    }
  };

  const threadList = (
    <div className="flex h-full flex-col gap-3">
      <Button onClick={newChat} className="w-full justify-start gap-2">
        <MessageSquarePlusIcon className="size-4" /> New chat
      </Button>
      <nav className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1">
        {sorted.map((t) => (
          <div
            key={t.id}
            className={cn(
              "group flex items-center gap-1 rounded-lg pr-1 text-sm transition-colors hover:bg-sidebar-accent",
              t.id === threadId && "bg-sidebar-accent font-medium",
            )}
          >
            <Link
              to="/chat/$threadId"
              params={{ threadId: t.id }}
              onClick={() => setMenuOpen(false)}
              className="min-w-0 flex-1 truncate px-3 py-2"
            >
              {t.title}
            </Link>
            <button
              type="button"
              aria-label="Delete chat"
              onClick={() => remove(t.id)}
              className="rounded-md p-1.5 text-muted-foreground opacity-60 hover:bg-background hover:text-destructive group-hover:opacity-100"
            >
              <Trash2Icon className="size-3.5" />
            </button>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="flex h-dvh bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <div className="mb-5 flex items-center gap-3 px-1">
          <img src={kenFace} alt="" width={36} height={36} className="size-9 rounded-lg" />
          <div className="leading-tight"><span className="block font-display text-lg font-bold tracking-wide">NEXHOKEN AI</span><span className="block text-xs text-muted-foreground">{settings.name}</span></div>
        </div>
        {threadList}
        <p className="mt-3 border-t pt-3 text-center text-xs text-muted-foreground">Created by Muhammad Ashik · KenXeo</p>
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-4">
          <SheetHeader className="mb-4 p-0">
            <SheetTitle className="font-display">Chats</SheetTitle>
          </SheetHeader>
          {threadList}
        </SheetContent>
      </Sheet>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="p-0 pb-2">
            <SheetTitle className="font-display text-2xl">Customize {settings.name}</SheetTitle>
          </SheetHeader>
          <SettingsPanel />
        </SheetContent>
      </Sheet>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b px-3 py-2.5 md:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open chats" onClick={() => setMenuOpen(true)}>
            <MenuIcon className="size-5" />
          </Button>
          <img src={kenFace} alt="" width={28} height={28} className="size-7 md:hidden" />
          <h1 className="truncate font-display text-lg font-bold">{settings.name}</h1>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant={settings.incognito ? "default" : "ghost"}
              size="icon"
              aria-label={settings.incognito ? "Turn off incognito" : "Turn on incognito"}
              title={settings.incognito ? "Incognito on: history not saved" : "Incognito mode"}
              onClick={() => update({ incognito: !settings.incognito })}
            >
              <EyeOffIcon className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle light and dark mode"
              onClick={() => update({ theme: settings.theme === "dark" ? "light" : "dark" })}
            >
              {settings.theme === "dark" ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Customize" onClick={() => setSettingsOpen(true)}>
              <Settings2Icon className="size-5" />
            </Button>
          </div>
        </header>
        <ChatWindow key={threadId} threadId={threadId} initialMessages={initial.id === threadId ? initial.messages : ensureThreadWithId(threadId).messages} />
      </main>
    </div>
  );
}
