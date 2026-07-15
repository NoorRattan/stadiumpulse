import { memo, useContext, useId, type FormEvent } from "react";
import { Mic, Send, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LanguageContext } from "@/contexts/LanguageContext";

import { ConciergeMessage } from "./ConciergeMessage";
import { LanguageSelector } from "./LanguageSelector";
import {
  useConciergeThread,
  useSpeechInput,
  type ConciergeThreadMessage,
} from "./useConciergeChat";

interface ConciergeChatProps {
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

function MessageThread({
  messages,
  sending,
}: {
  messages: ConciergeThreadMessage[];
  sending: boolean;
}) {
  return (
    <div
      aria-live="polite"
      className="grid max-h-[32rem] gap-3 overflow-y-auto rounded-2xl border border-border bg-card p-4 backdrop-blur-xl"
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
  );
}

interface ComposerControlsProps {
  listening: boolean;
  recognitionAvailable: boolean;
  sending: boolean;
  speakReplies: boolean;
  toggleListening: () => void;
  toggleReplies: () => void;
}

function ComposerControls(props: ComposerControlsProps) {
  const voiceLabel = props.listening
    ? "Stop voice input"
    : props.recognitionAvailable
      ? "Start voice input"
      : "Voice input unavailable in this browser";
  return (
    <div className="flex flex-wrap gap-2">
      <Button className="min-h-11" disabled={props.sending}>
        <Send aria-hidden="true" className="size-4" /> Send message
      </Button>
      <Button
        aria-label={voiceLabel}
        disabled={!props.recognitionAvailable || props.sending}
        onClick={props.toggleListening}
        type="button"
        variant="outline"
      >
        <Mic aria-hidden="true" className="size-4" />
        {props.listening ? "Stop listening" : "Speak"}
      </Button>
      <Button
        aria-pressed={props.speakReplies}
        onClick={props.toggleReplies}
        type="button"
        variant="outline"
      >
        {props.speakReplies ? (
          <Volume2 aria-hidden="true" />
        ) : (
          <VolumeX aria-hidden="true" />
        )}
        Read replies aloud
      </Button>
    </div>
  );
}

function ChatComposer({
  draft,
  messageId,
  onDraftChange,
  onSubmit,
  voiceStatus,
  ...controls
}: ComposerControlsProps & {
  draft: string;
  messageId: string;
  onDraftChange: (draft: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  voiceStatus: string | null;
}) {
  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <label
        className="grid gap-2 text-sm font-medium text-foreground"
        htmlFor={messageId}
      >
        Message
        <Textarea
          id={messageId}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Ask for the least-congested route to your seat."
        />
      </label>
      <ComposerControls {...controls} />
      {voiceStatus && (
        <p
          aria-live="polite"
          className="text-sm text-muted-foreground"
          role="status"
        >
          {voiceStatus}
        </p>
      )}
    </form>
  );
}

/** Concierge chat thread with visible language-change system notes. */
export const ConciergeChat = memo(function ConciergeChat({
  initialMessages = defaultMessages,
  onSendMessage,
}: ConciergeChatProps) {
  const messageId = useId();
  const language = useContext(LanguageContext)?.language ?? "en";
  const thread = useConciergeThread(initialMessages, language, onSendMessage);
  const speech = useSpeechInput(language, thread.setDraft);
  return (
    <section className="grid gap-4" aria-label="Concierge chat">
      <LanguageSelector
        onLanguageChange={(_, label) => thread.noteLanguage(label)}
      />
      <MessageThread messages={thread.messages} sending={thread.sending} />
      <ChatComposer
        draft={thread.draft}
        listening={speech.listening}
        messageId={messageId}
        onDraftChange={thread.setDraft}
        onSubmit={(event) => void thread.handleSubmit(event)}
        recognitionAvailable={speech.available}
        sending={thread.sending}
        speakReplies={thread.speakReplies}
        toggleListening={speech.toggleListening}
        toggleReplies={() => thread.setSpeakReplies((current) => !current)}
        voiceStatus={speech.voiceStatus}
      />
    </section>
  );
});
