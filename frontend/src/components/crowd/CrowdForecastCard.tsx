import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/services/apiClient";
import type { CrowdForecastResponse } from "@/types/api";

const trendIcon = {
  rising: ArrowUpRight,
  stable: ArrowRight,
  falling: ArrowDownRight,
} as const;

export function CrowdForecastCard({ zoneId }: { zoneId: string }): JSX.Element {
  const [forecast, setForecast] = useState<CrowdForecastResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void apiRequest<CrowdForecastResponse>(
      `/api/crowd/zones/${zoneId}/forecast`,
    )
      .then((response) => active && setForecast(response))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [zoneId]);

  const TrendIcon = forecast ? trendIcon[forecast.direction] : ArrowRight;

  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles aria-hidden="true" className="size-5 text-accent" />
          15-minute decision forecast
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!forecast && !error && (
          <p role="status">Reading recent crowd movement...</p>
        )}
        {error && (
          <p className="text-sm text-error-text">
            Forecast is temporarily unavailable.
          </p>
        )}
        {forecast && (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <p className="font-mono text-3xl font-bold">
                {Math.round(forecast.projectedDensityPct)}%
              </p>
              <p className="mb-1 inline-flex items-center gap-1 text-sm font-bold capitalize">
                <TrendIcon aria-hidden="true" className="size-4" />{" "}
                {forecast.direction} - {forecast.confidence} confidence
              </p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {forecast.narrative}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              Deterministic trend projection; Groq explains the action.
              Simulated demo readings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
