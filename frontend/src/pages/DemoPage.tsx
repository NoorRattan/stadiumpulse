import { useCallback, useEffect, useState } from "react";
import {
  Accessibility,
  BotMessageSquare,
  CheckCircle2,
  Database,
  Leaf,
  MapPinned,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

import { OperationsReplay } from "@/components/demo/OperationsReplay";
import { AppShell } from "@/components/layout";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { FadeInView } from "@/components/motion/FadeInView";
import { MagneticCard } from "@/components/motion/MagneticCard";
import { CrowdVenueMap } from "@/components/visuals/CrowdVenueMap";
import { StepList } from "@/components/wayfinding";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { apiRequest } from "@/services/apiClient";
import type { DemoExperienceResponse } from "@/types/api";
import type { CrowdZoneSummary } from "@/types/domain";

const proofLinks = [
  [
    BotMessageSquare,
    "Multilingual concierge",
    "/concierge",
    "Live GenAI answers in ten languages",
  ],
  [
    MapPinned,
    "Crowd-aware wayfinding",
    "/wayfinding",
    "Accessible routes from deterministic zone data",
  ],
  [
    Accessibility,
    "Accessibility mode",
    "/accessibility",
    "Step-free, contrast, screen-reader, and motion controls",
  ],
  [
    Leaf,
    "Sustainable travel",
    "/travel",
    "Match-aware transit and arrival guidance",
  ],
  [
    RadioTower,
    "Crowd intelligence",
    "#digital-twin-heading",
    "Selectable connected zone pressure",
  ],
  [
    ShieldCheck,
    "Incident Copilot",
    "#operations-replay-heading",
    "Authentic no-write draft generation",
  ],
  [
    Sparkles,
    "Briefing Generator",
    "#operations-replay-heading",
    "Authentic no-write volunteer briefing",
  ],
] as const;

function useConnectedDemo() {
  const [demo, setDemo] = useState<DemoExperienceResponse | null>(null);
  const [selectedZone, setSelectedZone] = useState<CrowdZoneSummary | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<DemoExperienceResponse>("/api/demo", {
        timeoutMs: 60_000,
      });
      setDemo(response);
      setSelectedZone(
        (current) =>
          response.zones.find((zone) => zone.zoneId === current?.zoneId) ??
          response.zones[0] ??
          null,
      );
    } catch (caught) {
      if (showLoading) setDemo(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "The connected demo could not be loaded.",
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load(true);
    const interval = window.setInterval(() => void load(false), 15_000);
    return () => window.clearInterval(interval);
  }, [load]);
  return { demo, error, load, loading, selectedZone, setSelectedZone };
}

function DemoHero(): JSX.Element {
  const reducedMotion = useReducedMotionSafe();
  return (
    <div className="border-b border-border pb-12">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5 }}
      >
        <span className="inline-flex items-center gap-2 border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
          <Sparkles aria-hidden="true" className="size-3" />
          FIFA World Cup 2026 demo
        </span>
      </motion.div>
      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl lg:text-7xl"
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      >
        One connected <br />
        <span className="text-gradient">match-day story.</span>
      </motion.h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
        Run all seven StadiumPulse workflows without an account. The browser
        reads a seeded Supabase scenario through FastAPI; public operations
        generation is rate-limited, review-only, and never writes a record.
      </p>
    </div>
  );
}

function LoadingState(): JSX.Element {
  return (
    <div
      className="grid min-h-56 place-content-center border border-border bg-card"
      role="status"
    >
      <RefreshCw
        aria-hidden="true"
        className="mx-auto size-8 animate-spin text-primary"
      />
      <p className="mt-3 text-sm font-semibold text-muted-foreground">
        Connecting the demo stack…
      </p>
    </div>
  );
}

function ErrorState({
  error,
  retry,
}: {
  error: string;
  retry: () => void;
}): JSX.Element {
  return (
    <section
      className="grid gap-4 border border-error-text/30 bg-error-text/[0.04] p-6"
      role="alert"
    >
      <h2 className="font-display text-2xl font-bold">
        Demo connection failed
      </h2>
      <p className="text-error-text">{error}</p>
      <button
        className="inline-flex w-fit items-center gap-2 bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
        onClick={retry}
        type="button"
      >
        <RefreshCw aria-hidden="true" className="size-4" />
        Retry connection
      </button>
    </section>
  );
}

function DemoStatus({ demo }: { demo: DemoExperienceResponse }): JSX.Element {
  const cards = [
    [CheckCircle2, "Frontend to FastAPI", "Connected", "var(--primary)"],
    [
      Database,
      "Seeded Supabase scenario",
      demo.databaseStatus,
      "var(--accent)",
    ],
    [ShieldCheck, "Auto-refresh", "Every 15 seconds", "var(--secondary)"],
  ] as const;
  return (
    <section
      aria-label="Connected demo status"
      className="grid border border-border md:grid-cols-3"
    >
      {cards.map(([Icon, label, value, color]) => (
        <div
          className="flex items-start gap-4 border-b border-r border-border p-6 last:border-b-0 md:border-b-0"
          key={label}
        >
          <Icon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
            style={{ color }}
          />
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 font-semibold capitalize">{value}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function ProofMap(): JSX.Element {
  return (
    <section aria-labelledby="proof-map-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Seven capabilities · direct proof paths
      </p>
      <h2
        className="mt-3 font-display text-3xl font-bold"
        id="proof-map-heading"
      >
        Choose a workflow and use it now
      </h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {proofLinks.map(([Icon, label, href, description]) => (
          <a
            className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/50"
            href={href}
            key={label}
          >
            <Icon aria-hidden="true" className="size-4 text-primary" />
            <h3 className="mt-3 font-bold">{label}</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}

function CrowdSignal({
  demo,
  selectedZone,
  select,
}: {
  demo: DemoExperienceResponse;
  selectedZone: CrowdZoneSummary | null;
  select: (zone: CrowdZoneSummary) => void;
}): JSX.Element {
  return (
    <section
      aria-labelledby="digital-twin-heading"
      className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"
    >
      <div className="grid gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Scenario: {demo.match.homeTeam} vs. {demo.match.awayTeam}
          </p>
          <h2
            className="mt-2 font-display text-2xl font-bold"
            id="digital-twin-heading"
          >
            Selectable crowd venue map
          </h2>
        </div>
        <CrowdVenueMap
          onSelectZone={select}
          selectedZoneId={selectedZone?.zoneId}
          zones={demo.zones}
        />
      </div>
      <div className="border border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Selected connected scenario signal
        </p>
        {selectedZone ? (
          <div className="mt-5 grid gap-4">
            <p className="font-mono text-5xl font-bold">
              <AnimatedCounter
                suffix="%"
                value={Math.round(selectedZone.currentDensityPct)}
              />
            </p>
            <p className="font-semibold capitalize text-primary">
              {selectedZone.band} density
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              {selectedZone.alert}
            </p>
            <p className="text-xs text-muted-foreground">
              Synthetic reading · refreshed from the demo API
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Select a zone in the venue map.
          </p>
        )}
      </div>
    </section>
  );
}

function FanWorkflowProof({
  demo,
}: {
  demo: DemoExperienceResponse;
}): JSX.Element {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="border border-border bg-card p-6">
        <div className="flex items-center gap-2.5">
          <Accessibility aria-hidden="true" className="size-4 text-primary" />
          <p className="font-display text-sm uppercase tracking-widest text-muted-foreground">
            Accessible crowd-aware route
          </p>
        </div>
        <div className="mt-5">
          <StepList route={demo.accessibleRoute} />
        </div>
      </div>
      <div className="border border-border bg-card p-6">
        <div className="flex items-center gap-2.5">
          <BotMessageSquare aria-hidden="true" className="size-4 text-accent" />
          <p className="font-display text-sm uppercase tracking-widest text-muted-foreground">
            Multilingual concierge preview
          </p>
        </div>
        <div className="mt-5 grid gap-4">
          {demo.conciergeExamples.map((example) => (
            <div
              className="border border-border bg-muted/50 p-4"
              key={example.language}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {example.language}
              </p>
              <p className="mt-2 font-semibold">{example.question}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {example.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CapabilityGrid({
  demo,
}: {
  demo: DemoExperienceResponse;
}): JSX.Element {
  return (
    <section aria-labelledby="capabilities-heading" className="grid gap-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Connected implementation evidence
        </p>
        <h2
          className="mt-3 font-display text-3xl font-bold"
          id="capabilities-heading"
        >
          The shared backend contracts
        </h2>
      </div>
      <div className="grid border border-border md:grid-cols-2">
        {demo.capabilities.map((capability) => (
          <MagneticCard
            className="border-b border-r border-border p-6 last:border-b-0 transition-colors hover:bg-muted/50"
            key={capability.label}
          >
            <h3 className="font-display font-bold">{capability.label}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {capability.description}
            </p>
            <code className="mt-3 block overflow-x-auto border border-border bg-background px-3 py-2 font-mono text-xs text-accent">
              {capability.liveEndpoint}
            </code>
          </MagneticCard>
        ))}
      </div>
    </section>
  );
}

function ConnectedDemo({
  demo,
  selectedZone,
  select,
}: {
  demo: DemoExperienceResponse;
  selectedZone: CrowdZoneSummary | null;
  select: (zone: CrowdZoneSummary) => void;
}): JSX.Element {
  return (
    <>
      <FadeInView>
        <DemoStatus demo={demo} />
      </FadeInView>
      <FadeInView delay={0.05}>
        <ProofMap />
      </FadeInView>
      <FadeInView delay={0.1}>
        <CrowdSignal demo={demo} select={select} selectedZone={selectedZone} />
      </FadeInView>
      <FadeInView delay={0.15}>
        <FanWorkflowProof demo={demo} />
      </FadeInView>
      <FadeInView delay={0.18}>
        <OperationsReplay />
      </FadeInView>
      <FadeInView delay={0.2}>
        <CapabilityGrid demo={demo} />
      </FadeInView>
    </>
  );
}

/** Public connected walkthrough with authentic, no-write operations generation. */
export default function DemoPage(): JSX.Element {
  const state = useConnectedDemo();
  return (
    <AppShell shader="vivid">
      <div className="grid gap-16">
        <DemoHero />
        {state.loading && <LoadingState />}
        {state.error && !state.loading && !state.demo && (
          <ErrorState error={state.error} retry={() => void state.load(true)} />
        )}
        {state.demo && !state.loading && (
          <ConnectedDemo
            demo={state.demo}
            select={state.setSelectedZone}
            selectedZone={state.selectedZone}
          />
        )}
      </div>
    </AppShell>
  );
}
