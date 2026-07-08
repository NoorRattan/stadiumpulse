import { memo, useId, useState, type FormEvent } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  ConciergeMessage,
  type ConciergeMessageRole,
} from "./ConciergeMessage";
import { LanguageSelector } from "./LanguageSelector";

/** Chat message record rendered by ConciergeChat. */
export interface ConciergeThreadMessage {
  id: string;
  role: ConciergeMessageRole;
  text: string;
}

/** Props for the concierge chat composer and message thread. */
export interface ConciergeChatProps {
  initialMessages?: ConciergeThreadMessage[];
  onSendMessage?: (message: string) => Promise<string>;
}

const defaultMessages: ConciergeThreadMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Ask about gates, seats, accessibility routes, or match-day travel.",
  },
];

/** Concierge chat thread with visible language-change system notes. */
export const ConciergeChat = memo(function ConciergeChat({
  initialMessages = defaultMessages,
  onSendMessage,
}: ConciergeChatProps) {
  const [messages, setMessages] =
    useState<ConciergeThreadMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const messageId = useId();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    const userMessage: ConciergeThreadMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setSending(true);
    try {
      const reply = onSendMessage
        ? await onSendMessage(trimmed)
        : "A StadiumPulse concierge response will appear here once this is connected to the page.";
      setMessages((current) => [
        ...current,
        { id: `assistant-${Date.now()}`, role: "assistant", text: reply },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="grid gap-4" aria-label="Concierge chat">
      <LanguageSelector
        onLanguageChange={(_, label) =>
          setMessages((current) => [
            ...current,
            {
              id: `language-${Date.now()}`,
              role: "system",
              text: `Switched to ${label}.`,
            },
          ])
        }
      />
      <div
        aria-live="polite"
        className="grid max-h-[32rem] gap-3 overflow-y-auto rounded-lg border border-border bg-background p-4"
      >
        {messages.map((message) => (
          <ConciergeMessage
            key={message.id}
            role={message.role}
            text={message.text}
          />
        ))}
        {sending && (
          <p className="text-sm text-accent" role="status">
            StadiumPulse is thinking...
          </p>
        )}
      </div>
      <form
        className="grid gap-3"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <label
          className="grid gap-2 text-sm font-medium text-foreground"
          htmlFor={messageId}
        >
          Message
          <Textarea
            id={messageId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask for the least-congested route to your seat."
          />
        </label>
        <Button className="min-h-11 justify-self-start" disabled={sending}>
          <Send aria-hidden="true" className="size-4" />
          Send message
        </Button>
      </form>
    </section>
  );
});
