import { lazy, Suspense, useEffect, useState } from "react";
import {
  Accessibility,
  BotMessageSquare,
  CheckCircle2,
  Database,
  Leaf,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

import { AppShell } from "@/components/layout";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { FadeInView } from "@/components/motion/FadeInView";
import { MagneticCard } from "@/components/motion/MagneticCard";
import { StepList } from "@/components/wayfinding";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { apiRequest } from "@/services/apiClient";
import type { DemoExperienceResponse } from "@/types/api";
import type { CrowdZoneSummary } from "@/types/domain";

const CrowdField3D = lazy(() => import("@/components/visuals/CrowdField3D"));

const featureIcons = [
  BotMessageSquare,
  Accessibility,
  ShieldCheck,
  Leaf,
] as const;

/** Public, read-only FIFA 2026 walkthrough backed by FastAPI and seeded Supabase data. */
export default function DemoPage(): JSX.Element {
  const [demo, setDemo] = useState<DemoExperienceResponse | null>(null);
  const [selectedZone, setSelectedZone] = useState<CrowdZoneSummary | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reducedMotion = useReducedMotionSafe();

  const loadDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<DemoExperienceResponse>("/api/demo", {
        timeoutMs: 60_000,
      });
      setDemo(response);
      setSelectedZone(response.zones[0] ?? null);
    } catch (caught) {
      setDemo(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "The connected demo could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDemo();
  }, []);

  return (
    <AppShell shader="vivid">
      <div className="grid gap-16">
        {/* -- Hero -- */}
        <div className="border-b border-white/[0.06] pb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <Sparkles aria-hidden="true" className="size-3" />
              FIFA World Cup 2026 demo
            </span>
          </motion.div>
          <motion.h1
            className="mt-5 font-display text-4xl font-bold leading-none tracking-tight text-foreground sm:text-5xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.05,
            }}
          >
            One connected
            <br />
            <span className="text-gradient">match-day story.</span>
          </motion.h1>
          <motion.p
            className="mt-5 max-w-xl text-base text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            This read-only walkthrough uses synthetic tournament data. It proves
            the browser-to-FastAPI-to-Supabase path while the authenticated app
            keeps Gemini calls and staff mutations behind role checks.
          </motion.p>
        </div>

        {loading && (
          <div
            className="grid min-h-56 place-content-center border border-white/[0.06] bg-white/[0.01]"
            role="status"
          >
            <RefreshCw
              aria-hidden="true"
              className="mx-auto size-8 animate-spin text-primary"
            />
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              Connecting the demo stack...
            </p>
          </div>
        )}

        {error && !loading && (
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
              onClick={() => void loadDemo()}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              Retry connection
            </button>
          </section>
        )}

        {demo && !loading && (
          <>
            {/* Status cards */}
            <FadeInView>
              <section
                aria-label="Connected demo status"
                className="grid gap-0 border border-white/[0.06] md:grid-cols-3"
              >
                {[
                  [CheckCircle2, "Frontend to FastAPI", "Connected", "primary"],
                  [
                    Database,
                    "Seeded Supabase scenario",
                    demo.databaseStatus,
                    "accent",
                  ],
                  [ShieldCheck, "Data mode", demo.dataStatus, "secondary"],
                ].map(([Icon, label, value, color]) => (
                  <div
                    className="flex items-start gap-4 border-b border-r border-white/[0.06] p-6 last:border-b-0 md:border-b-0"
                    key={String(label)}
                  >
                    <Icon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                      style={{
                        color:
                          color === "primary"
                            ? "var(--primary)"
                            : color === "accent"
                              ? "var(--accent)"
                              : "var(--secondary)",
                      }}
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {String(label)}
                      </p>
                      <p className="mt-0.5 font-semibold capitalize text-foreground">
                        {String(value)}
                      </p>
                    </div>
                  </div>
                ))}
              </section>
            </FadeInView>

            {/* 3D crowd twin */}
            <FadeInView delay={0.1}>
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
                      Animated crowd digital twin
                    </h2>
                  </div>
                  {!reducedMotion ? (
                    <Suspense
                      fallback={
                        <div className="h-72 animate-pulse border border-white/[0.06] bg-white/[0.02]" />
                      }
                    >
                      <CrowdField3D
                        onSelectZone={setSelectedZone}
                        selectedZoneId={selectedZone?.zoneId}
                        zones={demo.zones}
                      />
                    </Suspense>
                  ) : (
                    <div className="grid gap-2 border border-white/[0.06] bg-white/[0.01] p-5">
                      {demo.zones.map((zone) => (
                        <button
                          className="flex min-h-11 items-center justify-between border border-white/[0.06] px-4 text-left transition hover:border-primary/30"
                          key={zone.zoneId}
                          onClick={() => setSelectedZone(zone)}
                          type="button"
                        >
                          <span>{zone.name}</span>
                          <span className="font-mono font-bold text-primary">
                            {Math.round(zone.currentDensityPct)}%
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-white/[0.06] bg-white/[0.01] p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Selected live scenario signal
                  </p>
                  {selectedZone ? (
                    <div className="mt-5 grid gap-4">
                      <p className="font-mono text-5xl font-bold text-foreground">
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
                      <p className="text-xs text-muted-foreground/50">
                        Synthetic reading - no physical sensor claim
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Select a zone in the digital twin.
                    </p>
                  )}
                </div>
              </section>
            </FadeInView>

            {/* Accessible route + Concierge */}
            <FadeInView delay={0.15}>
              <section className="grid gap-6 lg:grid-cols-2">
                <div className="border border-white/[0.06] bg-white/[0.01] p-6">
                  <div className="flex items-center gap-2.5">
                    <Accessibility
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                    <p className="font-display text-sm uppercase tracking-widest text-muted-foreground">
                      Accessible crowd-aware route
                    </p>
                  </div>
                  <div className="mt-5">
                    <StepList route={demo.accessibleRoute} />
                  </div>
                </div>

                <div className="border border-white/[0.06] bg-white/[0.01] p-6">
                  <div className="flex items-center gap-2.5">
                    <BotMessageSquare
                      aria-hidden="true"
                      className="size-4 text-accent"
                    />
                    <p className="font-display text-sm uppercase tracking-widest text-muted-foreground">
                      Multilingual concierge preview
                    </p>
                  </div>
                  <div className="mt-5 grid gap-4">
                    {demo.conciergeExamples.map((example) => (
                      <div
                        className="border border-white/[0.06] bg-white/[0.02] p-4"
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
            </FadeInView>

            {/* Capabilities grid */}
            <FadeInView delay={0.2}>
              <section
                aria-labelledby="capabilities-heading"
                className="grid gap-8"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    - GenAI-enabled solution
                  </p>
                  <h2
                    className="mt-3 font-display text-3xl font-bold"
                    id="capabilities-heading"
                  >
                    What the full authenticated app demonstrates
                  </h2>
                </div>
                <div className="grid gap-0 border border-white/[0.06] md:grid-cols-2">
                  {demo.capabilities.map((capability, index) => {
                    const Icon = featureIcons[index] ?? Sparkles;
                    return (
                      <MagneticCard
                        className="border-b border-r border-white/[0.06] p-6 last:border-b-0 transition-colors hover:bg-white/[0.02]"
                        key={capability.label}
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            aria-hidden="true"
                            className="size-4 text-primary"
                          />
                          <h3 className="font-display font-bold">
                            {capability.label}
                          </h3>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {capability.description}
                        </p>
                        <code className="mt-3 block overflow-x-auto border border-white/[0.06] bg-black/50 px-3 py-2 font-mono text-xs text-accent">
                          {capability.liveEndpoint}
                        </code>
                      </MagneticCard>
                    );
                  })}
                </div>
              </section>
            </FadeInView>
          </>
        )}
      </div>
    </AppShell>
  );
}
