import { useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Radio, Sparkles } from "lucide-react";

import { apiRequest } from "@/services/apiClient";
import type {
  DemoBriefingResponse,
  DemoIncidentDraftResponse,
} from "@/types/api";

type RunState = "idle" | "running" | "complete" | "error";

function ReplayStatus({ state }: { state: RunState }): JSX.Element {
  if (state === "running")
    return (
      <span
        className="inline-flex items-center gap-2 text-accent"
        role="status"
      >
        <Radio aria-hidden="true" className="size-3.5 animate-pulse" />
        Generating from connected context…
      </span>
    );
  if (state === "complete")
    return (
      <span
        className="inline-flex items-center gap-2 text-primary"
        role="status"
      >
        <CheckCircle2 aria-hidden="true" className="size-3.5" />
        Generated · nothing persisted
      </span>
    );
  if (state === "error")
    return (
      <span
        className="inline-flex items-center gap-2 text-error-text"
        role="status"
      >
        <AlertCircle aria-hidden="true" className="size-3.5" />
        Generation failed
      </span>
    );
  return <span>Ready · no data will be written</span>;
}

function ReplayCard({
  buttonLabel,
  children,
  description,
  error,
  onRun,
  state,
  title,
}: {
  buttonLabel: string;
  children: ReactNode;
  description: string;
  error: string | null;
  onRun: () => void;
  state: RunState;
  title: string;
}): JSX.Element {
  const steps = (
    <ol className="grid gap-2 text-sm text-muted-foreground">
      <li>1. Read the highest-pressure connected demo zone</li>
      <li>2. Run production generation logic with bounded context</li>
      <li>3. Return a review-only result without an insert</li>
    </ol>
  );
  return (
    <article className="grid gap-4 border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <Sparkles aria-hidden="true" className="size-4 shrink-0 text-primary" />
      </div>
      <div className="min-h-36 border border-border bg-background/60 p-4">
        {error ? (
          <p className="text-sm leading-6 text-error-text" role="alert">
            {error}
          </p>
        ) : state === "complete" ? (
          children
        ) : (
          steps
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className="font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground"
        >
          <ReplayStatus state={state} />
        </p>
        <button
          className="min-h-11 bg-primary px-4 text-sm font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-70"
          disabled={state === "running"}
          onClick={onRun}
          type="button"
        >
          {state === "complete" ? `Generate ${title} again` : buttonLabel}
        </button>
      </div>
    </article>
  );
}

function IncidentOutput({
  result,
}: {
  result: DemoIncidentDraftResponse | null;
}): JSX.Element | null {
  if (!result) return null;
  const source =
    result.generatedBy === "ai" ? "Groq generated" : "tested fallback";
  return (
    <div className="grid gap-2 text-sm">
      <p className="panel-label">Generated incident draft</p>
      <p className="font-bold">
        {result.zoneName} · {Math.round(result.currentDensityPct)}%
      </p>
      <p className="leading-6 text-muted-foreground">{result.summary}</p>
      <p className="font-mono text-xs text-accent">
        Severity: {result.severity} · {source} · human review required
      </p>
    </div>
  );
}

function BriefingOutput({
  result,
}: {
  result: DemoBriefingResponse | null;
}): JSX.Element | null {
  if (!result) return null;
  const source =
    result.generatedBy === "ai" ? "Groq generated" : "tested fallback";
  return (
    <div className="grid gap-2 text-sm">
      <p className="panel-label">Generated volunteer briefing</p>
      <p className="font-bold">
        {result.shiftLabel} · {result.zoneName}
      </p>
      <p className="leading-6 text-muted-foreground">{result.content}</p>
      <p className="font-mono text-xs text-primary">
        {result.openIncidentCount} open incident
        {result.openIncidentCount === 1 ? "" : "s"} · {source} · not persisted
      </p>
    </div>
  );
}

function useDemoGeneration<T>(endpoint: string) {
  const [result, setResult] = useState<T | null>(null);
  const [state, setState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setState("running");
    setError(null);
    try {
      setResult(
        await apiRequest<T>(endpoint, { method: "POST", timeoutMs: 60_000 }),
      );
      setState("complete");
    } catch (caught) {
      setResult(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "The no-write generation request failed.",
      );
      setState("error");
    }
  };
  return { error, result, run, state };
}

/** Runs authentic, rate-limited generation logic against fixed synthetic context. */
export function OperationsReplay(): JSX.Element {
  const incident = useDemoGeneration<DemoIncidentDraftResponse>(
    "/api/demo/incident-draft",
  );
  const briefing = useDemoGeneration<DemoBriefingResponse>(
    "/api/demo/volunteer-briefing",
  );
  return (
    <section aria-labelledby="operations-replay-heading" className="grid gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Anonymous access · authentic no-write execution
        </p>
        <h2
          className="mt-3 font-display text-3xl font-bold"
          id="operations-replay-heading"
        >
          Run the protected AI logic safely
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Each button calls a rate-limited endpoint that reuses protected
          generation code with fixed connected context. It returns a reviewable
          result and cannot create a shared record.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ReplayCard
          buttonLabel="Generate incident draft"
          description="Turn the highest-pressure zone into a structured, human-reviewed incident draft."
          error={incident.error}
          onRun={() => void incident.run()}
          state={incident.state}
          title="Incident Copilot"
        >
          <IncidentOutput result={incident.result} />
        </ReplayCard>
        <ReplayCard
          buttonLabel="Generate volunteer briefing"
          description="Turn current zone and incident context into a concise shift briefing."
          error={briefing.error}
          onRun={() => void briefing.run()}
          state={briefing.state}
          title="Briefing Generator"
        >
          <BriefingOutput result={briefing.result} />
        </ReplayCard>
      </div>
    </section>
  );
}
