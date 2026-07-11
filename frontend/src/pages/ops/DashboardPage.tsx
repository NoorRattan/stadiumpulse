import { lazy, Suspense, useState } from "react";
import { Activity, AlertTriangle, Radio, RefreshCw, Users } from "lucide-react";

import {
  CrowdForecastCard,
  ScoreboardMetric,
  ZoneCard,
} from "@/components/crowd";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useCrowdDensity } from "@/hooks/useCrowdDensity";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import type { CrowdZoneSummary } from "@/types/domain";

const CrowdField3D = lazy(() => import("@/components/visuals/CrowdField3D"));

/** Ops dashboard page with live crowd density cards and summary metrics. */
export default function DashboardPage(): JSX.Element {
  const { zones: summaries, loading, error, refresh } = useCrowdDensity();
  const reducedMotion = useReducedMotionSafe();
  const [selectedZone, setSelectedZone] = useState<CrowdZoneSummary | null>(
    null,
  );
  const busiestZone = summaries.reduce<CrowdZoneSummary | null>(
    (current, zone) =>
      !current || zone.currentDensityPct > current.currentDensityPct
        ? zone
        : current,
    null,
  );
  const criticalCount = summaries.filter(
    (zone) => zone.band === "critical" || zone.band === "high",
  ).length;

  return (
    <AppShell>
      <div className="grid gap-6">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="font-display text-4xl font-bold text-foreground">
              Crowd Overview
            </h1>
            <p className="max-w-3xl text-muted-foreground">
              A live venue digital twin for staff and volunteers, focused on
              zones that need action before pressure becomes an incident.
            </p>
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
              <Radio aria-hidden="true" className="size-3" /> Simulated demo
              signal · live updates
            </p>
          </div>
          <Button
            onClick={() => void refresh()}
            type="button"
            variant="outline"
          >
            <RefreshCw aria-hidden="true" /> Refresh live data
          </Button>
        </section>

        {!reducedMotion && summaries.length > 0 && (
          <Suspense
            fallback={
              <div className="h-64 animate-pulse rounded-3xl bg-muted" />
            }
          >
            <CrowdField3D
              onSelectZone={setSelectedZone}
              selectedZoneId={selectedZone?.zoneId}
              zones={summaries}
            />
          </Suspense>
        )}

        {selectedZone && (
          <section
            aria-label={`Selected zone: ${selectedZone.name}`}
            className="grid gap-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold">
                Digital twin selection
              </h2>
              <Button
                onClick={() => setSelectedZone(null)}
                type="button"
                variant="outline"
              >
                Clear selection
              </Button>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <ZoneCard zone={selectedZone} />
              <CrowdForecastCard
                key={selectedZone.zoneId}
                zoneId={selectedZone.zoneId}
              />
            </div>
          </section>
        )}

        <section
          aria-label="Crowd metrics"
          className="grid gap-4 md:grid-cols-3"
        >
          <ScoreboardMetric
            helperText="Zones attached to the live listener"
            label="Monitored zones"
            value={summaries.length}
          />
          <ScoreboardMetric
            helperText="High or critical density"
            label="Action zones"
            value={criticalCount}
          />
          <ScoreboardMetric
            helperText={busiestZone?.name ?? "No live zones yet"}
            label="Busiest density"
            suffix="%"
            value={
              busiestZone ? Math.round(busiestZone.currentDensityPct) : "--"
            }
          />
        </section>

        {error && (
          <p className="rounded-lg border border-error-text bg-card p-4 text-sm text-error-text">
            Crowd zones could not be loaded. Check your role and connection.
          </p>
        )}

        <section aria-labelledby="zone-grid-heading" className="grid gap-4">
          <h2
            className="font-display text-2xl font-bold text-foreground"
            id="zone-grid-heading"
          >
            Zone Grid
          </h2>
          {loading && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[Activity, Users, AlertTriangle].map((Icon, index) => (
                <div
                  aria-hidden="true"
                  className="min-h-40 rounded-lg border border-border bg-card p-4"
                  key={index}
                >
                  <Icon className="size-6 text-muted-foreground" />
                  <div className="mt-6 h-8 w-24 rounded bg-muted" />
                  <div className="mt-4 h-4 w-full rounded bg-muted" />
                  <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}
          {!loading && summaries.length === 0 && (
            <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              No zones configured yet.
            </p>
          )}
          {!loading && summaries.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {summaries.map((zone) => (
                <ZoneCard key={zone.zoneId} zone={zone} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
