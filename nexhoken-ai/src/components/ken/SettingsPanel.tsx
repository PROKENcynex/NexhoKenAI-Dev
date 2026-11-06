import { CheckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ACCENTS, LANGUAGES, PERSONALITIES, useKenSettings } from "@/lib/ken-settings";
import { speak } from "@/lib/speech";
import { cn } from "@/lib/utils";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t pt-5 first:border-t-0 first:pt-2">
      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function SettingsPanel() {
  const { settings, update, reset } = useKenSettings();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const langPrefix = settings.speechLang.split("-")[0] ?? "en";
  const matching = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
  const voiceList = matching.length ? matching : voices;

  return (
    <div className="space-y-5 px-1 pb-8">
      <Section title="Identity">
        <div className="space-y-1.5">
          <Label htmlFor="ken-name">Assistant name</Label>
          <Input id="ken-name" maxLength={40} value={settings.name} onChange={(e) => update({ name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ken-personality">Personality & instructions</Label>
          <Textarea
            id="ken-personality"
            rows={4}
            maxLength={1500}
            value={settings.personality}
            onChange={(e) => update({ personality: e.target.value })}
            placeholder="e.g. Professional support agent for my bakery. Short answers."
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {PERSONALITIES.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => update({ personality: p.text })}
                className={cn("rounded-full border px-3 py-1 text-xs hover:bg-accent", settings.personality === p.text && "bg-primary text-primary-foreground")}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Privacy">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="ken-incog">Incognito mode</Label>
            <p className="text-xs text-muted-foreground">New messages aren't saved to your chat history.</p>
          </div>
          <Switch id="ken-incog" checked={settings.incognito} onCheckedChange={(v) => update({ incognito: v })} />
        </div>
      </Section>

      <Section title="Language">
        <Select
          value={settings.speechLang}
          onValueChange={(code) => {
            const l = LANGUAGES.find((x) => x.code === code);
            if (l) update({ speechLang: l.code, language: l.label, voiceURI: "" });
          }}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Used for replies, listening and speaking.</p>
      </Section>

      <Section title="Look">
        <div className="flex items-center justify-between">
          <Label htmlFor="ken-dark">Dark mode</Label>
          <Switch id="ken-dark" checked={settings.theme === "dark"} onCheckedChange={(v) => update({ theme: v ? "dark" : "light" })} />
        </div>
        <div className="space-y-2">
          <Label>Accent color</Label>
          <div className="flex flex-wrap gap-2.5">
            {ACCENTS.map((a) => (
              <button
                key={a.hue}
                type="button"
                aria-label={a.label}
                title={a.label}
                onClick={() => update({ hue: a.hue })}
                style={{ backgroundColor: `oklch(0.72 0.17 ${a.hue})` }}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110",
                  settings.hue === a.hue && "ring-2 ring-foreground",
                )}
              >
                {settings.hue === a.hue && <CheckIcon className="size-4 text-primary-foreground" />}
              </button>
            ))}
          </div>
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs text-muted-foreground">Custom hue</Label>
            <Slider min={0} max={360} step={1} value={[settings.hue]} onValueChange={([v]) => update({ hue: v ?? settings.hue })} />
          </div>
        </div>
      </Section>

      <Section title="Voice">
        <div className="flex items-center justify-between">
          <Label htmlFor="ken-autospeak">Read replies aloud</Label>
          <Switch id="ken-autospeak" checked={settings.autoSpeak} onCheckedChange={(v) => update({ autoSpeak: v })} />
        </div>
        <div className="space-y-1.5">
          <Label>Voice</Label>
          <Select value={settings.voiceURI || "default"} onValueChange={(v) => update({ voiceURI: v === "default" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder="Default voice" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default voice</SelectItem>
              {voiceList.map((v) => (
                <SelectItem key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm"><Label>Speed</Label><span className="text-muted-foreground">{settings.rate.toFixed(1)}×</span></div>
          <Slider min={0.5} max={2} step={0.1} value={[settings.rate]} onValueChange={([v]) => update({ rate: v ?? 1 })} />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm"><Label>Pitch</Label><span className="text-muted-foreground">{settings.pitch.toFixed(1)}</span></div>
          <Slider min={0.5} max={2} step={0.1} value={[settings.pitch]} onValueChange={([v]) => update({ pitch: v ?? 1 })} />
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() =>
            speak(`Hi, I'm ${settings.name}. This is how I sound.`, {
              voiceURI: settings.voiceURI,
              rate: settings.rate,
              pitch: settings.pitch,
              lang: settings.speechLang,
            })
          }
        >
          Test voice
        </Button>
      </Section>

      <div className="border-t pt-5">
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={reset}>Reset to defaults</Button>
        <p className="pt-4 text-center text-xs text-muted-foreground">Created by <span className="font-semibold text-foreground">Muhammad Ashik</span> · known online as <span className="font-semibold text-foreground">KenXeo</span></p>
      </div>
    </div>
  );
}
