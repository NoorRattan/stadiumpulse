import {
  memo,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Mic, Send, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LanguageContext } from "@/contexts/LanguageContext";

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

interface SpeechRecognitionResultEventLike {
  results: { 0: { 0: { transcript: string } } };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const speechLocales: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
  fr: "fr-FR",
  ar: "ar-SA",
  de: "de-DE",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  hi: "hi-IN",
};

function speechErrorMessage(error: string): string {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Microphone access was denied. Allow microphone access in your browser settings and try again.";
  }
  if (error === "no-speech") {
    return "No speech was detected. Try again and speak after Listening appears.";
  }
  if (error === "audio-capture") {
    return "No working microphone was found. Check your device microphone and try again.";
  }
  if (error === "network") {
    return "Voice recognition could not reach the speech service. Check your connection or type your message.";
  }
  if (error === "aborted") {
    return "Voice input stopped.";
  }
  return "Voice input could not start. Check microphone permission or type your message instead.";
}

/** Concierge chat thread with visible language-change system notes. */
export const ConciergeChat = memo(function ConciergeChat({
  initialMessages = defaultMessages,
  onSendMessage,
}: ConciergeChatProps) {
  const [messages, setMessages] =
    useState<ConciergeThreadMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [speakReplies, setSpeakReplies] = useState(false);
  const messageId = useId();
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const language = useContext(LanguageContext)?.language ?? "en";
  const Recognition =
    (
      window as typeof window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      }
    ).SpeechRecognition ??
    (
      window as typeof window & {
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      }
    ).webkitSpeechRecognition;

  useEffect(
    () => () => {
      recognition.current?.stop();
      window.speechSynthesis?.cancel();
    },
    [],
  );

  const toggleListening = () => {
    if (!Recognition) {
      setVoiceStatus(
        "Voice input is unavailable in this browser. You can still type your message.",
      );
      return;
    }
    if (listening) {
      recognition.current?.stop();
      setVoiceStatus("Voice input stopped.");
      return;
    }

    const listener = new Recognition();
    let receivedResult = false;
    listener.lang = speechLocales[language] ?? language;
    listener.continuous = false;
    listener.interimResults = false;
    listener.onstart = () => {
      setListening(true);
      setVoiceStatus("Listening. Speak now.");
    };
    listener.onresult = (event) => {
      receivedResult = true;
      setDraft(event.results[0][0].transcript);
      setVoiceStatus("Voice captured. Review your message, then send it.");
    };
    listener.onerror = (event) => {
      setListening(false);
      setVoiceStatus(speechErrorMessage(event.error));
    };
    listener.onend = () => {
      setListening(false);
      recognition.current = null;
      if (!receivedResult) {
        setVoiceStatus((current) => current ?? "Voice input stopped.");
      }
    };
    recognition.current = listener;
    setVoiceStatus("Requesting microphone access...");
    try {
      listener.start();
    } catch {
      recognition.current = null;
      setListening(false);
      setVoiceStatus(
        "Voice input could not start. Check microphone permission or type your message instead.",
      );
    }
  };

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
      if (speakReplies && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.lang = language;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
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
        className="grid max-h-[32rem] gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl"
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
        <div className="flex flex-wrap gap-2">
          <Button className="min-h-11" disabled={sending}>
            <Send aria-hidden="true" className="size-4" />
            Send message
          </Button>
          <Button
            aria-label={
              listening
                ? "Stop voice input"
                : Recognition
                  ? "Start voice input"
                  : "Voice input unavailable in this browser"
            }
            disabled={!Recognition || sending}
            onClick={toggleListening}
            type="button"
            variant="outline"
          >
            <Mic aria-hidden="true" className="size-4" />
            {listening ? "Stop listening" : "Speak"}
          </Button>
          <Button
            aria-pressed={speakReplies}
            onClick={() => setSpeakReplies((current) => !current)}
            type="button"
            variant="outline"
          >
            {speakReplies ? (
              <Volume2 aria-hidden="true" />
            ) : (
              <VolumeX aria-hidden="true" />
            )}
            Read replies aloud
          </Button>
        </div>
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
    </section>
  );
});
