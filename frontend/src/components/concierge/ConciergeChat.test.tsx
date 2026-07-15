import { fireEvent, render, screen } from "@testing-library/react";

import { LanguageProvider } from "@/contexts/LanguageContext";

import { ConciergeChat } from "./ConciergeChat";

afterEach(() => {
  Reflect.deleteProperty(window, "SpeechRecognition");
});

it("renders a named composer control and submit button", () => {
  render(
    <LanguageProvider>
      <ConciergeChat />
    </LanguageProvider>,
  );

  expect(screen.getByLabelText("Message")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Send message" }),
  ).toBeInTheDocument();
});

it("captures speech into the message composer", async () => {
  class MockSpeechRecognition {
    lang = "";
    continuous = false;
    interimResults = false;
    onstart: (() => void) | null = null;
    onresult:
      | ((event: { results: { 0: { 0: { transcript: string } } } }) => void)
      | null = null;
    onerror: ((event: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;

    start() {
      this.onstart?.();
      this.onresult?.({
        results: { 0: { 0: { transcript: "Take me to Gate 12" } } },
      });
      this.onend?.();
    }

    stop() {
      this.onend?.();
    }
  }

  Object.defineProperty(window, "SpeechRecognition", {
    configurable: true,
    value: MockSpeechRecognition,
  });

  render(
    <LanguageProvider>
      <ConciergeChat />
    </LanguageProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));

  expect(await screen.findByDisplayValue("Take me to Gate 12")).toBeVisible();
  expect(screen.getByText(/Voice captured/)).toBeVisible();
});

it("explains when microphone permission is denied", async () => {
  class DeniedSpeechRecognition {
    lang = "";
    continuous = false;
    interimResults = false;
    onstart: (() => void) | null = null;
    onresult = null;
    onerror: ((event: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;

    start() {
      this.onerror?.({ error: "not-allowed" });
      this.onend?.();
    }

    stop() {
      this.onend?.();
    }
  }

  Object.defineProperty(window, "SpeechRecognition", {
    configurable: true,
    value: DeniedSpeechRecognition,
  });

  render(
    <LanguageProvider>
      <ConciergeChat />
    </LanguageProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));

  expect(await screen.findByText(/Microphone access was denied/)).toBeVisible();
});
