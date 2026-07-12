import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/services/apiClient";
import type { OperationalDigestResponse } from "@/types/api";

const priorityStyles = {
  watch: "border-secondary/50 bg-secondary/12 text-foreground",
  prepare: "border-accent/45 bg-accent/10 text-accent",
  urgent: "border-destructive/45 bg-destructive/10 text-destructive",
} as const;

export function OperationalDigest({
  refreshToken = 0,
}: {
  refreshToken?: number;
}): JSX.Element {
  const [digest, setDigest] = useState<OperationalDigestResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void apiRequest<OperationalDigestResponse>("/api/crowd/digest")
      .then((response) => {
        if (active) {
          setDigest(response);
          setError(false);
        }
      })
      .catch(() => {
        if (active) {
          setDigest(null);
          setError(true);
        }
      });
    return () => {
      active = false;
    };
  }, [refreshToken]);

  return (
    <section
      aria-labelledby="operations-digest-heading"
      className="border-y border-border py-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <Badge className="gap-1" variant="outline">
            <Sparkles aria-hidden="true" /> Decision support
          </Badge>
          <h2
            className="font-display text-2xl font-bold text-foreground"
            id="operations-digest-heading"
          >
            Next 15 minutes
          </h2>
        </div>
        <p className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
          Advice only · no action is executed automatically
        </p>
      </div>

      {!digest && !error && (
        <p
          className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground"
          role="status"
        >
          <Activity aria-hidden="true" className="size-4 animate-pulse" />
          Ranking operational pressure…
        </p>
      )}
      {error && (
        <p className="mt-5 text-sm text-error-text">
          The operational digest is temporarily unavailable. Zone data remains
          visible below.
        </p>
      )}
      {digest && (
        <div className="mt-5 grid gap-5">
          <div className="max-w-4xl">
            <p className="font-semibold text-foreground">{digest.headline}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {digest.narrative}
            </p>
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              Simulated readings · deterministic ranking · AI-written summary
            </p>
          </div>

          {digest.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Maintain routine venue monitoring.
            </p>
          ) : (
            <ol className="grid gap-3 lg:grid-cols-3">
              {digest.items.map((item, index) => (
                <li
                  className="min-w-0 rounded-lg border border-border bg-card p-4"
                  key={item.zoneId}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-muted-foreground">
                        Priority {index + 1}
                      </p>
                      <h3 className="truncate font-semibold text-foreground">
                        {item.zoneName}
                      </h3>
                    </div>
                    <Badge
                      className={priorityStyles[item.priority]}
                      variant="outline"
                    >
                      {item.priority}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-end gap-2">
                    <p className="font-mono text-3xl font-bold text-foreground">
                      {Math.round(item.projectedDensityPct)}%
                    </p>
                    <p className="mb-1 inline-flex items-center gap-1 text-xs font-bold capitalize text-muted-foreground">
                      {item.direction === "rising" && (
                        <ArrowUpRight aria-hidden="true" className="size-3.5" />
                      )}
                      {item.projectedBand}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.recommendedAction}
                  </p>
                  {item.requiresSupervisorApproval && (
                    <p className="mt-3 text-xs font-bold text-foreground">
                      Supervisor approval required
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
