import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { CopyIcon, ImageIcon, MicIcon, SquareIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import kenFace from "@/assets/ken-logo.png";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useKenSettings } from "@/lib/ken-settings";
import { getRecognitionCtor, speak, stopSpeaking } from "@/lib/speech";
import { saveMessages } from "@/lib/threads";
import { cn } from "@/lib/utils";

const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

const SUGGESTIONS = ["Help me with my homework", "Debug my code", "Plan my week", "Explain a concept simply", "Write a short poem"];

export function ChatWindow({ threadId, initialMessages }: { threadId: string; initialMessages: UIMessage[] }) {
  const { settings } = useKenSettings();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          threadId,
          persona: {
            name: settingsRef.current.name,
            personality: settingsRef.current.personality,
            language: settingsRef.current.language,
          },
        }),
      }),
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message || "Ken couldn't reply. Please try again."),
  });

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevStatus = useRef(status);
  const busy = status === "submitted" || status === "streaming";

  // Persist messages for this thread
  useEffect(() => {
    if (settingsRef.current.incognito) return;
    if (status === "ready" || status === "error") saveMessages(threadId, messages);
  }, [messages, status, threadId]);

  const speakMessage = useCallback((m: UIMessage) => {
    const s = settingsRef.current;
    setSpeakingId(m.id);
    speak(textOf(m), { voiceURI: s.voiceURI, rate: s.rate, pitch: s.pitch, lang: s.speechLang }, () => setSpeakingId(null));
  }, []);

  // Auto-speak when a reply finishes; refocus composer
  useEffect(() => {
    if (prevStatus.current === "streaming" && status === "ready") {
      const last = messages[messages.length - 1];
      if (last?.role === "assistant" && settingsRef.current.autoSpeak) speakMessage(last);
      textareaRef.current?.focus();
    }
    prevStatus.current = status;
  }, [status, messages, speakMessage]);

  useEffect(() => {
    textareaRef.current?.focus();
    return () => {
      stopSpeaking();
      recRef.current?.abort?.();
    };
  }, []);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    stopSpeaking();
    setSpeakingId(null);
    sendMessage({ text: t });
    setInput("");
    textareaRef.current?.focus();
  };

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      toast.error("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    stopSpeaking();
    const rec = new Ctor();
    rec.lang = settingsRef.current.speechLang;
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInput(finalText + interim);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed") toast.error("Please allow microphone access to talk to Ken.");
      else if (e.error !== "aborted" && e.error !== "no-speech") toast.error("Couldn't hear you. Please try again.");
    };
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) send(finalText);
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
              <img src={kenFace} alt="" width={112} height={112} className="size-28" />
              <div>
                <h2 className="font-display text-3xl font-bold">Hi, I'm {settings.name}.</h2>
                <p className="mt-2 text-muted-foreground">Ask anything — coding, homework, planning — tap the mic to talk or the image button to draw.</p>
                {settings.incognito && <p className="mt-2 text-sm font-medium text-primary">Incognito on — this chat won't be saved.</p>}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent
                className={cn(
                  m.role === "user"
                    ? "group-[.is-user]:bg-chat-user group-[.is-user]:text-chat-user-foreground"
                    : "bg-transparent",
                )}
              >
                {m.parts.map((p, i) =>
                  p.type === "text" ? (
                    m.role === "assistant" ? (
                      <MessageResponse key={i}>{p.text}</MessageResponse>
                    ) : (
                      <p key={i} className="whitespace-pre-wrap">{p.text}</p>
                    )
                  ) : p.type === "file" && p.mediaType.startsWith("image/") ? (
                    <div key={i} className="space-y-2">
                      <img src={p.url} alt="Generated" className="w-full max-w-md rounded-xl border" />
                      <a href={p.url} download="nexhoken-image.jpg" className="text-xs text-muted-foreground underline">Download</a>
                    </div>
                  ) : null,
                )}
              </MessageContent>
              {m.role === "assistant" && textOf(m) && !(busy && m.id === messages[messages.length - 1]?.id) && (
                <MessageActions>
                  <MessageAction
                    tooltip={speakingId === m.id ? "Stop" : "Read aloud"}
                    onClick={() => {
                      if (speakingId === m.id) {
                        stopSpeaking();
                        setSpeakingId(null);
                      } else speakMessage(m);
                    }}
                  >
                    {speakingId === m.id ? <VolumeXIcon className="size-4" /> : <Volume2Icon className="size-4" />}
                  </MessageAction>
                  <MessageAction
                    tooltip="Copy"
                    onClick={() => {
                      navigator.clipboard.writeText(textOf(m));
                      toast.success("Copied");
                    }}
                  >
                    <CopyIcon className="size-4" />
                  </MessageAction>
                </MessageActions>
              )}
            </Message>
          ))}

          {status === "submitted" && (
            <div className="flex items-center gap-3 text-sm">
              <img src={kenFace} alt="" width={24} height={24} className="size-6" />
              <Shimmer>{`${settings.name} is thinking...`}</Shimmer>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl px-3 pb-4 md:px-4">
        <PromptInput onSubmit={(msg) => send(msg.text ?? input)}>
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening..." : `Message ${settings.name}...`}
          />
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputButton
                aria-label={listening ? "Stop listening" : "Talk to Ken"}
                onClick={toggleMic}
                className={cn(listening && "animate-ken-pulse bg-primary text-primary-foreground hover:bg-primary")}
              >
                {listening ? <SquareIcon className="size-4" /> : <MicIcon className="size-4" />}
              </PromptInputButton>
              <PromptInputButton aria-label="Image generation coming later" title="Image generation coming later" disabled>
                <ImageIcon className="size-4" />
              </PromptInputButton>
              {speakingId && (
                <PromptInputButton
                  aria-label="Stop speaking"
                  onClick={() => {
                    stopSpeaking();
                    setSpeakingId(null);
                  }}
                >
                  <VolumeXIcon className="size-4" />
                </PromptInputButton>
              )}
            </PromptInputTools>
            <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !input.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
