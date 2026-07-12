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

import { AppShell, AtmosphericPanel } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <AppShell>
      <div className="grid gap-8">
        <AtmosphericPanel contentClassName="p-6 md:p-10" intensity="strong">
          <div className="max-w-4xl">
            <Badge className="gap-2" variant="outline">
              <Sparkles aria-hidden="true" /> FIFA World Cup 2026 demo
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-black uppercase leading-none text-foreground md:text-6xl">
              One connected match-day story, from fan arrival to venue command.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
              This read-only walkthrough uses synthetic tournament data. It
              proves the browser-to-FastAPI-to-Supabase path while the
              authenticated app keeps Gemini calls and staff mutations behind
              role checks.
            </p>
          </div>
        </AtmosphericPanel>

        {loading && (
          <div
            className="grid min-h-56 place-content-center rounded-lg border border-border bg-card/90"
            role="status"
          >
            <RefreshCw
              aria-hidden="true"
              className="mx-auto size-8 animate-spin text-primary"
            />
            <p className="mt-3 font-semibold">Connecting the demo stack...</p>
          </div>
        )}

        {error && !loading && (
          <section
            className="grid gap-4 rounded-lg border border-error-text bg-card p-6"
            role="alert"
          >
            <h2 className="font-display text-2xl font-bold">
              Demo connection failed
            </h2>
            <p className="text-error-text">{error}</p>
            <Button
              className="w-fit"
              onClick={() => void loadDemo()}
              type="button"
            >
              <RefreshCw aria-hidden="true" /> Retry connection
            </Button>
          </section>
        )}

        {demo && !loading && (
          <>
            <section
              aria-label="Connected demo status"
              className="grid gap-3 md:grid-cols-3"
            >
              {[
                [CheckCircle2, "Frontend to FastAPI", "Connected"],
                [Database, "Seeded Supabase scenario", demo.databaseStatus],
                [ShieldCheck, "Data mode", demo.dataStatus],
              ].map(([Icon, label, value]) => (
                <div
                  className="rounded-2xl border border-border bg-card p-4"
                  key={String(label)}
                >
                  <Icon aria-hidden="true" className="size-5 text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {String(label)}
                  </p>
                  <p className="font-bold capitalize text-foreground">
                    {String(value)}
                  </p>
                </div>
              ))}
            </section>

            <section
              className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"
              aria-labelledby="digital-twin-heading"
            >
              <div className="grid gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                    Scenario: {demo.match.homeTeam} vs. {demo.match.awayTeam}
                  </p>
                  <h2
                    className="font-display text-3xl font-black"
                    id="digital-twin-heading"
                  >
                    Animated crowd digital twin
                  </h2>
                </div>
                {!reducedMotion ? (
                  <Suspense
                    fallback={
                      <div className="h-72 animate-pulse rounded-3xl bg-muted" />
                    }
                  >
                    <CrowdField3D
                      onSelectZone={setSelectedZone}
                      selectedZoneId={selectedZone?.zoneId}
                      zones={demo.zones}
                    />
                  </Suspense>
                ) : (
                  <div className="grid gap-2 rounded-3xl border border-border bg-card p-5">
                    {demo.zones.map((zone) => (
                      <button
                        className="flex min-h-11 items-center justify-between rounded-xl border border-border px-4 text-left"
                        key={zone.zoneId}
                        onClick={() => setSelectedZone(zone)}
                        type="button"
                      >
                        <span>{zone.name}</span>
                        <span className="font-mono font-bold">
                          {Math.round(zone.currentDensityPct)}%
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Selected live scenario signal</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedZone ? (
                    <div className="grid gap-4">
                      <div>
                        <p className="font-mono text-5xl font-black">
                          {Math.round(selectedZone.currentDensityPct)}%
                        </p>
                        <p className="font-bold capitalize text-primary">
                          {selectedZone.band} density
                        </p>
                      </div>
                      <p className="leading-7 text-muted-foreground">
                        {selectedZone.alert}
                      </p>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Synthetic reading - no physical sensor claim
                      </p>
                    </div>
                  ) : (
                    <p>Select a zone in the digital twin.</p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Accessibility
                      aria-hidden="true"
                      className="text-primary"
                    />{" "}
                    Accessible crowd-aware route
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StepList route={demo.accessibleRoute} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BotMessageSquare
                      aria-hidden="true"
                      className="text-accent"
                    />{" "}
                    Multilingual concierge preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {demo.conciergeExamples.map((example) => (
                    <div
                      className="rounded-2xl bg-muted p-4"
                      key={example.language}
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">
                        {example.language}
                      </p>
                      <p className="mt-2 font-semibold">{example.question}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {example.answer}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <section
              aria-labelledby="capabilities-heading"
              className="grid gap-4"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                  GenAI-enabled solution
                </p>
                <h2
                  className="font-display text-3xl font-black"
                  id="capabilities-heading"
                >
                  What the full authenticated app demonstrates
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {demo.capabilities.map((capability, index) => {
                  const Icon = featureIcons[index] ?? Sparkles;
                  return (
                    <Card key={capability.label}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon aria-hidden="true" className="text-primary" />{" "}
                          {capability.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {capability.description}
                        </p>
                        <code className="mt-3 block overflow-x-auto text-xs text-accent">
                          {capability.liveEndpoint}
                        </code>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
