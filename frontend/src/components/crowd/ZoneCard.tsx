import { memo } from "react";
import { AlertTriangle, CircleCheck, Gauge, OctagonAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CrowdBand, CrowdZoneSummary } from "@/types/domain";

const bandMeta: Record<
  CrowdBand,
  {
    label: string;
    className: string;
    icon: typeof CircleCheck;
  }
> = {
  normal: {
    label: "Normal",
    className: "border-success text-success",
    icon: CircleCheck,
  },
  moderate: {
    label: "Moderate",
    className: "border-secondary text-secondary",
    icon: Gauge,
  },
  high: {
    label: "High",
    className: "border-error-text text-error-text",
    icon: AlertTriangle,
  },
  critical: {
    label: "Critical",
    className: "border-destructive text-error-text",
    icon: OctagonAlert,
  },
};

/** Props for a single crowd-zone status card. */
interface ZoneCardProps {
  zone: CrowdZoneSummary;
}

/** Crowd zone card with non-color-only congestion band treatment. */
export const ZoneCard = memo(function ZoneCard({ zone }: ZoneCardProps) {
  const band = bandMeta[zone.band];
  const Icon = band.icon;

  return (
    <Card className={cn("border", band.className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{zone.name}</span>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm font-semibold",
              band.className,
              zone.band === "critical" && "text-base",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {band.label}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-3xl font-semibold text-foreground">
          {Math.round(zone.currentDensityPct)}%
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {zone.alert || "No staff action needed right now."}
        </p>
      </CardContent>
    </Card>
  );
});
