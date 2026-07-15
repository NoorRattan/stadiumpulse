import { useEffect, useRef, useState, type FormEvent } from "react";

import type { ConciergeMessageRole } from "./ConciergeMessage";

export interface ConciergeThreadMessage {
  id: string;
  role: ConciergeMessageRole;
  text: string;
}

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
  const messages: Record<string, string> = {
    "not-allowed":
      "Microphone access was denied. Allow microphone access in your browser settings and try again.",
    "service-not-allowed":
      "Microphone access was denied. Allow microphone access in your browser settings and try again.",
    "no-speech":
      "No speech was detected. Try again and speak after Listening appears.",
    "audio-capture":
      "No working microphone was found. Check your device microphone and try again.",
    network:
      "Voice recognition could not reach the speech service. Check your connection or type your message.",
    aborted: "Voice input stopped.",
  };
  return (
    messages[error] ??
    "Voice input could not start. Check microphone permission or type your message instead."
  );
}

function recognitionConstructor(): SpeechRecognitionConstructor | undefined {
  const browserWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return (
    browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition
  );
}

interface RecognitionCallbacks {
  onEnd: (receivedResult: boolean) => void;
  onError: (error: string) => void;
  onResult: (transcript: string) => void;
  onStart: () => void;
}

function createRecognitionListener(
  Recognition: SpeechRecognitionConstructor,
  language: string,
  callbacks: RecognitionCallbacks,
): SpeechRecognitionLike {
  const listener = new Recognition();
  let receivedResult = false;
  listener.lang = speechLocales[language] ?? language;
  listener.continuous = false;
  listener.interimResults = false;
  listener.onstart = callbacks.onStart;
  listener.onresult = (event) => {
    receivedResult = true;
    callbacks.onResult(event.results[0][0].transcript);
  };
  listener.onerror = (event) => callbacks.onError(event.error);
  listener.onend = () => callbacks.onEnd(receivedResult);
  return listener;
}

export function useSpeechInput(
  language: string,
  onTranscript: (transcript: string) => void,
) {
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const Recognition = recognitionConstructor();
  useEffect(() => () => recognition.current?.stop(), []);

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
    const listener = createRecognitionListener(Recognition, language, {
      onStart: () => {
        setListening(true);
        setVoiceStatus("Listening. Speak now.");
      },
      onResult: (transcript) => {
        onTranscript(transcript);
        setVoiceStatus("Voice captured. Review your message, then send it.");
      },
      onError: (error) => {
        setListening(false);
        setVoiceStatus(speechErrorMessage(error));
      },
      onEnd: (receivedResult) => {
        setListening(false);
        recognition.current = null;
        if (!receivedResult)
          setVoiceStatus((current) => current ?? "Voice input stopped.");
      },
    });
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
  return {
    available: Boolean(Recognition),
    listening,
    toggleListening,
    voiceStatus,
  };
}

export function useConciergeThread(
  initialMessages: ConciergeThreadMessage[],
  language: string,
  onSendMessage?: (message: string) => Promise<string>,
) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: trimmed },
    ]);
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
  const noteLanguage = (label: string) =>
    setMessages((current) => [
      ...current,
      {
        id: `language-${Date.now()}`,
        role: "system",
        text: `Switched to ${label}.`,
      },
    ]);
  return {
    draft,
    handleSubmit,
    messages,
    noteLanguage,
    sending,
    setDraft,
    setSpeakReplies,
    speakReplies,
  };
}
