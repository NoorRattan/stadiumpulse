import { useContext, useRef } from "react";
import { toast } from "sonner";
import { BotMessageSquare } from "lucide-react";

import { ConciergeChat } from "@/components/concierge";
import { AppShell } from "@/components/layout";
import { FadeInView } from "@/components/motion/FadeInView";
import { LanguageContext } from "@/contexts/LanguageContext";
import { apiRequest } from "@/services/apiClient";
import type { ChatRequest, ChatResponse } from "@/types/api";

/** Full concierge chat page - terminal-aesthetic, wired to the backend chat endpoint. */
export default function ConciergePage(): JSX.Element {
  const languageContext = useContext(LanguageContext);
  const sessionId = useRef<string | undefined>(undefined);

  return (
    <AppShell shader="subtle">
      <div className="grid gap-8">
        {/* Header */}
        <div className="border-b border-white/[0.06] pb-8">
          <span className="inline-flex items-center gap-2 border border-accent/25 bg-accent/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
            Multilingual assistant
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-none tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Ask StadiumPulse.
          </h1>
          <p className="mt-4 max-w-lg text-base text-muted-foreground">
            Ask about seats, accessible amenities, route choices, or translated
            announcements in the language you choose.
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <BotMessageSquare
                aria-hidden="true"
                className="size-3.5 text-accent"
              />
              Powered by Gemini
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary" />
              12+ languages
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-secondary" />
              Accessibility-aware
            </span>
          </div>
        </div>

        <FadeInView>
          <ConciergeChat
            onSendMessage={async (message) => {
              try {
                const response = await apiRequest<ChatResponse, ChatRequest>(
                  "/api/concierge/chat",
                  {
                    method: "POST",
                    body: {
                      sessionId: sessionId.current,
                      message,
                      language: languageContext?.language ?? "en",
                    },
                  },
                );
                sessionId.current = response.sessionId;
                return response.reply;
              } catch (caught) {
                const messageText =
                  caught instanceof Error
                    ? caught.message
                    : "The concierge could not answer right now.";
                toast.error(messageText);
                return "The concierge could not answer right now. Please try again.";
              }
            }}
          />
        </FadeInView>
      </div>
    </AppShell>
  );
}
