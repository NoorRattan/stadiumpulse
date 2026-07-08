import { Activity, AlertTriangle, Users } from "lucide-react";

import { ScoreboardMetric, ZoneCard } from "@/components/crowd";
import { AppShell } from "@/components/layout";
import { useCrowdDensity } from "@/hooks/useCrowdDensity";
import type { CrowdBand, CrowdZoneSummary, Zone } from "@/types/domain";

function bandForZone(zone: Zone): CrowdBand {
  if (zone.currentDensityPct >= 90) {
    return "critical";
  }
  if (zone.currentDensityPct >= 75) {
    return "high";
  }
  if (zone.currentDensityPct >= 50) {
    return "moderate";
  }
  return "normal";
}

function toCrowdSummary(zone: Zone): CrowdZoneSummary {
  const roundedDensity = Math.round(zone.currentDensityPct);
  return {
    zoneId: zone.zoneId,
    name: zone.name,
    currentDensityPct: zone.currentDensityPct,
    band: bandForZone(zone),
    alert:
      zone.currentDensityPct >= 75
        ? `${zone.name} is at ${roundedDensity}% density. Review nearby routing.`
        : `${zone.name} is at ${roundedDensity}% density.`,
  };
}

/** Ops dashboard page with live crowd density cards and summary metrics. */
export default function DashboardPage(): JSX.Element {
  const { zones, loading, error } = useCrowdDensity();
  const summaries = zones.map(toCrowdSummary);
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
        <section className="grid gap-2">
          <h1 className="font-display text-4xl font-bold text-foreground">
            Crowd Overview
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Live density signals for venue staff and volunteers, focused on
            zones that need action.
          </p>
        </section>

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
