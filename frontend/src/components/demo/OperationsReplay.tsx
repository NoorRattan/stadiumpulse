import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Radio, Sparkles } from "lucide-react";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import type { DemoExperienceResponse } from "@/types/api";

type ReplayState = "idle" | "running" | "complete";
type ReplayKind = "incident" | "briefing";

interface ReplayCardProps {
  buttonLabel: string;
  children: React.ReactNode;
  description: string;
  kind: ReplayKind;
  onRun: (kind: ReplayKind) => void;
  state: ReplayState;
  title: string;
}

function ReplayStatus({ state }: { state: ReplayState }): JSX.Element {
  if (state === "running") {
    return (
      <span
        className="inline-flex items-center gap-2 text-accent"
        role="status"
      >
        <Radio aria-hidden="true" className="size-3.5 animate-pulse" />
        Replaying protected workflow…
      </span>
    );
  }
  if (state === "complete") {
    return (
      <span
        className="inline-flex items-center gap-2 text-primary"
        role="status"
      >
        <CheckCircle2 aria-hidden="true" className="size-3.5" />
        Replay complete
      </span>
    );
  }
  return <span>Ready · no data will be written</span>;
}

function ReplayCard({
  buttonLabel,
  children,
  description,
  kind,
  onRun,
  state,
  title,
}: ReplayCardProps): JSX.Element {
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
      <div className="min-h-32 border border-border bg-background/60 p-4">
        {state === "complete" ? (
          children
        ) : (
          <ol className="grid gap-2 text-sm text-muted-foreground">
            <li>1. Validate structured venue context</li>
            <li>2. Generate a bounded decision-support draft</li>
            <li>3. Return output for human review</li>
          </ol>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className="font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground"
          aria-live="polite"
        >
          <ReplayStatus state={state} />
        </p>
        <button
          className="min-h-11 bg-primary px-4 text-sm font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-70"
          disabled={state === "running"}
          onClick={() => onRun(kind)}
          type="button"
        >
          {state === "complete" ? `Replay ${title} again` : buttonLabel}
        </button>
      </div>
    </article>
  );
}

function IncidentOutput({
  demo,
}: {
  demo: DemoExperienceResponse;
}): JSX.Element {
  const item = demo.operationsDigest.items[0];
  return (
    <div className="grid gap-2 text-sm">
      <p className="panel-label">Generated incident draft</p>
      <p className="font-bold">{item?.zoneName ?? "Venue operations"}</p>
      <p className="leading-6 text-muted-foreground">
        {item?.recommendedAction ?? demo.operationsDigest.narrative}
      </p>
      <p className="font-mono text-xs text-accent">
        Severity: {item?.priority ?? "watch"} · awaiting human approval
      </p>
    </div>
  );
}

function BriefingOutput({
  demo,
}: {
  demo: DemoExperienceResponse;
}): JSX.Element {
  return (
    <div className="grid gap-2 text-sm">
      <p className="panel-label">Generated volunteer briefing</p>
      <p className="font-bold">Pre-match · accessible guest support</p>
      <p className="leading-6 text-muted-foreground">
        {demo.operationsDigest.headline} Use the{" "}
        {demo.accessibleRoute.estimatedMinutes}-minute step-free route and
        escalate urgent zone changes to a supervisor.
      </p>
      <p className="font-mono text-xs text-primary">
        Synthetic preview · read-only · supervisor review required
      </p>
    </div>
  );
}

/** Safe public replay of role-protected AI flows; never calls mutation endpoints. */
export function OperationsReplay({
  demo,
}: {
  demo: DemoExperienceResponse;
}): JSX.Element {
  const reducedMotion = useReducedMotionSafe();
  const [states, setStates] = useState<Record<ReplayKind, ReplayState>>({
    incident: "idle",
    briefing: "idle",
  });
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const run = (kind: ReplayKind) => {
    setStates((current) => ({ ...current, [kind]: "running" }));
    const finish = () =>
      setStates((current) => ({ ...current, [kind]: "complete" }));
    if (reducedMotion) {
      finish();
      return;
    }
    timers.current.push(window.setTimeout(finish, 650));
  };

  return (
    <section aria-labelledby="operations-replay-heading" className="grid gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Anonymous evaluator access · safe replay
        </p>
        <h2
          className="mt-3 font-display text-3xl font-bold"
          id="operations-replay-heading"
        >
          Watch the protected AI workflows work
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          These synthetic replays use the connected demo scenario but never
          create an incident, briefing, account, or shared record. The
          authenticated Ops Console performs the same review-first workflows
          against protected endpoints.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ReplayCard
          buttonLabel="Run incident replay"
          description="Transforms a live zone signal into a structured incident draft without submitting it."
          kind="incident"
          onRun={run}
          state={states.incident}
          title="Incident Copilot"
        >
          <IncidentOutput demo={demo} />
        </ReplayCard>
        <ReplayCard
          buttonLabel="Run briefing replay"
          description="Turns the same deterministic venue context into a concise volunteer briefing."
          kind="briefing"
          onRun={run}
          state={states.briefing}
          title="Briefing Generator"
        >
          <BriefingOutput demo={demo} />
        </ReplayCard>
      </div>
    </section>
  );
}
