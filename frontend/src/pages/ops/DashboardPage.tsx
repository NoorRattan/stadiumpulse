import { useState } from "react";
import { Activity, AlertTriangle, Radio, RefreshCw, Users } from "lucide-react";

import {
  CrowdForecastCard,
  OperationalDigest,
  ZoneCard,
} from "@/components/crowd";
import { AppShell } from "@/components/layout";
import { FadeInView } from "@/components/motion/FadeInView";
import { CrowdVenueMap } from "@/components/visuals/CrowdVenueMap";
import { useCrowdDensity } from "@/hooks/useCrowdDensity";
import type { CrowdZoneSummary } from "@/types/domain";

/** Ops dashboard - mission-control aesthetic with live crowd density data. */
export default function DashboardPage(): JSX.Element {
  const { zones: summaries, loading, error, refresh } = useCrowdDensity();
  const [selectedZone, setSelectedZone] = useState<CrowdZoneSummary | null>(
    null,
  );
  const [digestRefreshToken, setDigestRefreshToken] = useState(0);

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
    <AppShell shader="subtle">
      <div className="grid gap-10">
        {/* -- OPS Header -- */}
        <div className="border-b border-white/[0.06] pb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="live-pulse inline-flex items-center gap-2 border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                <Radio aria-hidden="true" className="size-3" />
                Operations command
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold leading-none tracking-tight text-foreground sm:text-5xl">
                Crowd Overview.
              </h1>
              <p className="mt-3 max-w-lg text-sm text-muted-foreground">
                A live venue map for staff and volunteers, focused on zones that
                need action before pressure becomes an incident.
              </p>
            </div>
            <button
              className="hidden shrink-0 items-center gap-2 border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/[0.08] md:inline-flex"
              onClick={() => {
                void refresh();
                setDigestRefreshToken((current) => current + 1);
              }}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="size-3.5" />
              Refresh live data
            </button>
          </div>
        </div>

        {/* -- Scoreboard metrics -- */}
        <section
          aria-label="Crowd metrics"
          className="grid grid-cols-3 divide-x divide-white/[0.06] border border-white/[0.06]"
        >
          {[
            {
              label: "Monitored zones",
              value: summaries.length,
              helper: "Live listener",
            },
            {
              label: "Action zones",
              value: criticalCount,
              helper: "High or critical",
            },
            {
              label: "Busiest zone",
              value: busiestZone
                ? Math.round(busiestZone.currentDensityPct)
                : "--",
              helper: busiestZone?.name ?? "No live zones",
              suffix: busiestZone ? "%" : "",
            },
          ].map((m) => (
            <div className="px-4 py-6 text-center" key={m.label}>
              <p className="font-display text-4xl font-bold text-foreground lg:text-5xl">
                {m.value}
                {m.suffix ?? ""}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{m.helper}</p>
            </div>
          ))}
        </section>

        <OperationalDigest refreshToken={digestRefreshToken} />

        <FadeInView>
          {summaries.length > 0 && (
            <CrowdVenueMap
              onSelectZone={setSelectedZone}
              selectedZoneId={selectedZone?.zoneId}
              zones={summaries}
            />
          )}
        </FadeInView>

        {selectedZone && (
          <section
            aria-label={`Selected zone: ${selectedZone.name}`}
            className="grid gap-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-foreground">
                Venue map selection -{" "}
                <span className="text-primary">{selectedZone.name}</span>
              </h2>
              <button
                className="border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold transition hover:bg-white/[0.08]"
                onClick={() => setSelectedZone(null)}
                type="button"
              >
                Clear
              </button>
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

        {error && (
          <p className="border border-error-text/30 bg-error-text/[0.04] p-4 text-sm text-error-text">
            Crowd zones could not be loaded. Check your role and connection.
          </p>
        )}

        {/* -- Zone Grid -- */}
        <section aria-labelledby="zone-grid-heading" className="grid gap-6">
          <div className="flex items-center justify-between">
            <h2
              className="font-display text-sm uppercase tracking-widest text-muted-foreground"
              id="zone-grid-heading"
            >
              Zone Grid
            </h2>
            <button
              className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/[0.08] md:hidden"
              onClick={() => {
                void refresh();
                setDigestRefreshToken((c) => c + 1);
              }}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="size-3.5" />
              Refresh
            </button>
          </div>

          {loading && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[Activity, Users, AlertTriangle].map((Icon, index) => (
                <div
                  aria-hidden="true"
                  className="border border-white/[0.06] bg-white/[0.01] p-6"
                  key={index}
                >
                  <Icon className="size-5 text-muted-foreground/30" />
                  <div className="mt-5 h-6 w-24 bg-white/[0.04]" />
                  <div className="mt-3 h-3 w-full bg-white/[0.04]" />
                  <div className="mt-2 h-3 w-3/4 bg-white/[0.04]" />
                </div>
              ))}
            </div>
          )}
          {!loading && summaries.length === 0 && (
            <p className="border border-white/[0.06] bg-white/[0.01] p-5 text-sm text-muted-foreground">
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
