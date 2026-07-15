import { useEffect, useState, type ReactNode } from "react";

import { apiRequest } from "@/services/apiClient";
import type { DemoExperienceResponse } from "@/types/api";

export const DEMO_REFRESH_INTERVAL_MS = 15_000;

export interface DemoDataState {
  data: DemoExperienceResponse | null;
  refreshedAt: number | null;
  status: "connecting" | "live" | "refreshing" | "stale" | "unavailable";
}

const initialDemoState: DemoDataState = {
  data: null,
  refreshedAt: null,
  status: "connecting",
};

export function useDemoData(): DemoDataState {
  const [state, setState] = useState<DemoDataState>(initialDemoState);

  useEffect(() => {
    let active = true;
    let inFlight = false;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const data = await apiRequest<DemoExperienceResponse>("/api/demo", {
          timeoutMs: 60_000,
        });
        if (active) setState({ data, refreshedAt: Date.now(), status: "live" });
      } catch {
        if (active) {
          setState((current) => ({
            ...current,
            status: current.data ? "stale" : "unavailable",
          }));
        }
      } finally {
        inFlight = false;
      }
    };

    void refresh();
    const timer = window.setInterval(() => {
      if (!inFlight) {
        setState((current) => ({
          ...current,
          status: current.data ? "refreshing" : "connecting",
        }));
      }
      void refresh();
    }, DEMO_REFRESH_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return state;
}

function freshnessMessage(state: DemoDataState): string {
  if (state.status === "connecting") {
    return "Connecting demo snapshot · refreshes every 15 seconds";
  }
  if (state.status === "unavailable") {
    return "Demo snapshot unavailable · retrying every 15 seconds";
  }
  const time = new Date(state.refreshedAt ?? 0).toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  if (state.status === "refreshing") {
    return `Refreshing demo snapshot · showing data fetched at ${time}`;
  }
  if (state.status === "stale") {
    return `Refresh delayed · showing data fetched at ${time} · retrying every 15 seconds`;
  }
  return `Connected demo snapshot · fetched at ${time} · refreshes every 15 seconds`;
}

export function DemoFreshness({
  state,
}: {
  state: DemoDataState;
}): JSX.Element {
  const connected = state.status === "live" || state.status === "refreshing";
  return (
    <div className="flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground">
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${connected ? "bg-primary" : "bg-accent"}`}
      />
      <p role="status">{freshnessMessage(state)}</p>
    </div>
  );
}

export function Panel({
  children,
  className = "",
  eyebrow,
  icon,
  title,
}: {
  children: ReactNode;
  className?: string;
  eyebrow: string;
  icon?: ReactNode;
  title: string;
}): JSX.Element {
  return (
    <section
      className={`rounded-xl border border-border bg-card/75 p-5 shadow-[0_16px_50px_rgb(2_6_23_/_0.18)] sm:p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-extrabold">{title}</h2>
          <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        </div>
        <span className="text-primary">{icon}</span>
      </div>
      {children}
    </section>
  );
}

function MiniBars(): JSX.Element {
  return (
    <span aria-hidden="true" className="mt-4 flex h-8 items-end gap-1">
      {[9, 18, 14, 24, 19, 28, 22, 33, 27, 36].map((height, index) => (
        <span
          className="w-1.5 bg-[linear-gradient(var(--brand-cyan),var(--brand-violet))]"
          key={`${height}-${index}`}
          style={{ height }}
        />
      ))}
    </span>
  );
}

export function MetricStrip({
  metrics,
}: {
  metrics: Array<{ label: string; value: string; delta: string }>;
}): JSX.Element {
  return (
    <section
      aria-label="Live cockpit metrics"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map((metric) => (
        <article
          className="rounded-xl border border-border bg-card/75 p-5"
          key={metric.label}
        >
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
            {metric.label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-mono text-3xl font-bold">{metric.value}</p>
            <span className="font-mono text-xs text-primary">
              {metric.delta}
            </span>
          </div>
          <MiniBars />
        </article>
      ))}
    </section>
  );
}

export function shortTeam(team: string): string {
  const words = team
    .replace(/[^A-Za-z ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}
