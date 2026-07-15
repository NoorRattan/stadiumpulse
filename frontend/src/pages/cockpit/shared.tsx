import { useEffect, useState, type ReactNode } from "react";

import { apiRequest } from "@/services/apiClient";
import type { DemoExperienceResponse } from "@/types/api";

export function useDemoData(): DemoExperienceResponse | null {
  const [demo, setDemo] = useState<DemoExperienceResponse | null>(null);

  useEffect(() => {
    let active = true;
    void apiRequest<DemoExperienceResponse>("/api/demo", { timeoutMs: 60_000 })
      .then((response) => {
        if (active) setDemo(response);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return demo;
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
