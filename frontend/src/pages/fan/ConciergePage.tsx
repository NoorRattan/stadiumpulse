import { useContext, useRef } from "react";
import { toast } from "sonner";

import { ConciergeChat } from "@/components/concierge";
import { AppShell } from "@/components/layout";
import { LanguageContext } from "@/contexts/LanguageContext";
import { apiRequest } from "@/services/apiClient";
import type { ChatRequest, ChatResponse } from "@/types/api";

/** Full concierge chat page wired to the backend chat endpoint. */
export default function ConciergePage(): JSX.Element {
  const languageContext = useContext(LanguageContext);
  const sessionId = useRef<string | undefined>(undefined);

  return (
    <AppShell>
      <div className="grid gap-6">
        <section className="grid gap-3">
          <p className="w-fit rounded-md border border-border bg-card px-3 py-1 text-xs font-black uppercase text-primary">
            Multilingual assistant
          </p>
          <h1 className="font-display text-5xl font-black uppercase leading-none text-foreground">
            Ask StadiumPulse
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Ask about seats, accessible amenities, route choices, or translated
            announcements in the language you choose.
          </p>
        </section>
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
      </div>
    </AppShell>
  );
}
