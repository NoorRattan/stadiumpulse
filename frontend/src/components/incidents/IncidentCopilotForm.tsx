import { memo, useId, useState, type FormEvent } from "react";
import { WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { IncidentReport, Zone } from "@/types/domain";

import { IncidentDraftPreview } from "./IncidentDraftPreview";

/** Input sent to the incident draft generator. */
export interface IncidentDraftInput {
  zoneId: string;
  rawInput: string;
}

/** Props for the incident copilot form. */
export interface IncidentCopilotFormProps {
  zones: Zone[];
  onGenerateDraft: (input: IncidentDraftInput) => Promise<IncidentReport>;
  onSubmitReport?: (draft: IncidentReport) => Promise<void>;
}

/** Incident copilot form that never auto-submits generated drafts. */
export const IncidentCopilotForm = memo(function IncidentCopilotForm({
  zones,
  onGenerateDraft,
  onSubmitReport,
}: IncidentCopilotFormProps) {
  const rawInputId = useId();
  const zoneLabelId = useId();
  const rawInputErrorId = useId();
  const zoneErrorId = useId();
  const [zoneId, setZoneId] = useState(zones[0]?.zoneId ?? "");
  const [rawInput, setRawInput] = useState("");
  const [draft, setDraft] = useState<IncidentReport | null>(null);
  const [errors, setErrors] = useState<Partial<IncidentDraftInput>>({});
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const nextErrors: Partial<IncidentDraftInput> = {};
    if (!zoneId) {
      nextErrors.zoneId = "Choose the affected zone.";
    }
    if (rawInput.trim().length < 5) {
      nextErrors.rawInput = "Describe what happened in at least 5 characters.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    setGenerating(true);
    try {
      const generatedDraft = await onGenerateDraft({
        zoneId,
        rawInput: rawInput.trim(),
      });
      setDraft(generatedDraft);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section className="grid gap-4" aria-label="Incident copilot">
      <form
        className="grid gap-4"
        onSubmit={(event) => void handleGenerate(event)}
      >
        <div className="grid gap-2">
          <Label id={zoneLabelId}>Affected zone</Label>
          <Select value={zoneId} onValueChange={setZoneId}>
            <SelectTrigger
              aria-describedby={errors.zoneId ? zoneErrorId : undefined}
              aria-invalid={Boolean(errors.zoneId)}
              aria-labelledby={zoneLabelId}
              className="min-h-11 w-full"
            >
              <SelectValue placeholder="Select a zone" />
            </SelectTrigger>
            <SelectContent>
              {zones.map((zone) => (
                <SelectItem key={zone.zoneId} value={zone.zoneId}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.zoneId && (
            <p className="text-sm text-error-text" id={zoneErrorId}>
              {errors.zoneId}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={rawInputId}>Incident notes</Label>
          <Textarea
            aria-describedby={errors.rawInput ? rawInputErrorId : undefined}
            aria-invalid={Boolean(errors.rawInput)}
            id={rawInputId}
            onChange={(event) => setRawInput(event.target.value)}
            placeholder="Describe the issue, nearby gate, crowd condition, and immediate risk."
            value={rawInput}
          />
          {errors.rawInput && (
            <p className="text-sm text-error-text" id={rawInputErrorId}>
              {errors.rawInput}
            </p>
          )}
        </div>
        <Button
          className="min-h-11 justify-self-start"
          disabled={generating}
          type="submit"
        >
          <WandSparkles aria-hidden="true" className="size-4" />
          Generate Draft
        </Button>
      </form>
      {draft && (
        <IncidentDraftPreview
          draft={draft}
          onSubmitReport={async (nextDraft) => {
            setSubmitting(true);
            try {
              await onSubmitReport?.(nextDraft);
            } finally {
              setSubmitting(false);
            }
          }}
          submitting={submitting}
        />
      )}
    </section>
  );
});
