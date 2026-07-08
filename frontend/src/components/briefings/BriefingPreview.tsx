import { memo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Briefing } from "@/types/domain";

/** Props for read-only briefing previews. */
export interface BriefingPreviewProps {
  briefings: Briefing[];
}

/** Read-only briefing list for staff and volunteer users. */
export const BriefingPreview = memo(function BriefingPreview({
  briefings,
}: BriefingPreviewProps) {
  if (briefings.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        No briefings are available for this zone yet.
      </p>
    );
  }

  return (
    <section className="grid gap-3" aria-label="Generated briefings">
      {briefings.map((briefing) => (
        <Card key={briefing.briefingId}>
          <CardHeader>
            <CardTitle>{briefing.shiftLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Zone: {briefing.zoneId}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
              {briefing.content}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
});
