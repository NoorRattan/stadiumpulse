import { memo } from "react";
import { Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IncidentReport } from "@/types/domain";

/** Props for the generated incident draft preview. */
export interface IncidentDraftPreviewProps {
  draft: IncidentReport;
  onSubmitReport?: (draft: IncidentReport) => Promise<void>;
  submitting?: boolean;
}

/** Read-only incident draft preview with a separate submit action. */
export const IncidentDraftPreview = memo(function IncidentDraftPreview({
  draft,
  onSubmitReport,
  submitting = false,
}: IncidentDraftPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Draft incident report</span>
          <Badge variant="outline">{draft.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm text-muted-foreground">Zone: {draft.zoneId}</p>
        <p className="text-sm text-foreground">
          {draft.aiDraftSummary || draft.rawInput}
        </p>
        {draft.severity && (
          <p className="text-sm text-error-text">Severity: {draft.severity}</p>
        )}
        <Button
          className="min-h-11 justify-self-start"
          disabled={submitting}
          onClick={() => void onSubmitReport?.(draft)}
          type="button"
        >
          <Send aria-hidden="true" className="size-4" />
          Submit Report
        </Button>
      </CardContent>
    </Card>
  );
});
