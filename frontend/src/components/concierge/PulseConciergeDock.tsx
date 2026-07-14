import { useContext, useRef, useState, type FormEvent } from "react";
import { Bot, Languages, Send, Sparkles, X } from "lucide-react";

import { LanguageContext } from "@/contexts/LanguageContext";
import { apiRequest } from "@/services/apiClient";
import type { ChatRequest, ChatResponse } from "@/types/api";

const prompts = [
  "Where's the shortest queue at Gate B?",
  "Nearest parking with EV charging?",
  "Halal food options in Zone C?",
  "Accessible route to Section 118?",
] as const;

const languages = ["EN", "ES", "FR", "AR", "PT", "JP"] as const;

/** Floating reference-style concierge backed by the real public chat API. */
export function PulseConciergeDock(): JSX.Element {
  const languageContext = useContext(LanguageContext);
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState("EN");
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState(
    "Hola / Hello — I'm PulseAI, your multilingual match-day concierge. Ask about tickets, gates, parking, food, or accessibility.",
  );
  const [sending, setSending] = useState(false);
  const sessionId = useRef<string>();

  const send = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setDraft("");
    setSending(true);
    try {
      const response = await apiRequest<ChatResponse, ChatRequest>(
        "/api/concierge/chat",
        {
          method: "POST",
          body: {
            sessionId: sessionId.current,
            message: trimmed,
            language: languageContext?.language ?? language.toLowerCase(),
          },
        },
      );
      sessionId.current = response.sessionId;
      setReply(response.reply);
    } catch {
      setReply(
        "PulseAI is temporarily unavailable. For urgent help, contact on-site venue staff.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send(draft);
  };

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:bottom-7 sm:right-7">
      {open && (
        <section
          aria-label="PulseAI Concierge"
          className="mb-3 w-[min(22.5rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-popover shadow-[var(--shadow-popover)]"
        >
          <div className="flex items-start justify-between border-b border-border px-4 py-4">
            <div className="flex gap-2.5">
              <span className="mt-1 size-3 rounded-full bg-primary shadow-[0_0_14px_var(--primary)]" />
              <div>
                <h2 className="font-display text-sm font-bold">
                  PulseAI Concierge
                </h2>
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Multilingual · Live
                </p>
              </div>
            </div>
            <button
              aria-label="Close concierge"
              className="grid size-9 place-content-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 border-b border-border px-4 py-2.5">
            <Languages
              aria-hidden="true"
              className="mr-1 size-4 text-muted-foreground"
            />
            {languages.map((item) => (
              <button
                aria-pressed={language === item}
                className={`min-h-8 rounded-md px-2.5 font-mono text-[0.65rem] ${language === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                key={item}
                onClick={() => setLanguage(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="grid gap-3 p-4">
            <p
              aria-live="polite"
              className="rounded-xl border border-border bg-muted/70 p-3 text-sm leading-6"
            >
              {sending ? "PulseAI is thinking…" : reply}
            </p>
            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  className="rounded-full border border-border px-2.5 py-1.5 text-left text-[0.68rem] text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  disabled={sending}
                  key={prompt}
                  onClick={() => void send(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form className="flex gap-2" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="pulse-ai-draft">
                Ask about your match day
              </label>
              <input
                className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                id="pulse-ai-draft"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about your match day…"
                value={draft}
              />
              <button
                aria-label="Send"
                className="grid size-11 shrink-0 place-content-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                disabled={sending || !draft.trim()}
                type="submit"
              >
                <Send aria-hidden="true" className="size-4" />
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        aria-expanded={open}
        aria-label="Open AI Concierge"
        className="ml-auto flex min-h-14 items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--brand-cyan),var(--brand-magenta))] px-4 font-extrabold text-[var(--brand-deep)] shadow-[0_0_32px_var(--glow-accent)] transition-transform hover:scale-[1.03]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? (
          <Bot aria-hidden="true" className="size-5" />
        ) : (
          <Sparkles aria-hidden="true" className="size-5" />
        )}
        <span className="hidden sm:inline">Ask PulseAI</span>
      </button>
    </div>
  );
}
