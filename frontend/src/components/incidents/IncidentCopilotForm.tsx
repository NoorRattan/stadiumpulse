import { memo, useId, useState, type FormEvent } from "react";
import { WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ZoneSelectItems } from "@/components/ui/zone-select-items";
import type { IncidentReport, Zone } from "@/types/domain";

import { IncidentDraftPreview } from "./IncidentDraftPreview";

interface IncidentDraftInput {
  zoneId: string;
  rawInput: string;
}

interface IncidentCopilotFormProps {
  zones: Zone[];
  onGenerateDraft: (input: IncidentDraftInput) => Promise<IncidentReport>;
  onSubmitReport?: (draft: IncidentReport) => Promise<void>;
}

interface FieldProps {
  error?: string;
  errorId: string;
}

function ZoneField({
  error,
  errorId,
  labelId,
  onChange,
  value,
  zones,
}: FieldProps & {
  labelId: string;
  onChange: (value: string) => void;
  value: string;
  zones: Zone[];
}) {
  return (
    <div className="grid gap-2">
      <Label id={labelId}>Affected zone</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          aria-labelledby={labelId}
          className="min-h-11 w-full"
        >
          <SelectValue placeholder="Select a zone" />
        </SelectTrigger>
        <SelectContent>
          <ZoneSelectItems zones={zones} />
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-error-text" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

function NotesField({
  error,
  errorId,
  inputId,
  onChange,
  value,
}: FieldProps & {
  inputId: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>Incident notes</Label>
      <Textarea
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        id={inputId}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Describe the issue, nearby gate, crowd condition, and immediate risk."
        value={value}
      />
      {error && (
        <p className="text-sm text-error-text" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

function validateDraftInput(zoneId: string, rawInput: string) {
  const errors: Partial<IncidentDraftInput> = {};
  if (!zoneId) errors.zoneId = "Choose the affected zone.";
  if (rawInput.trim().length < 5) {
    errors.rawInput = "Describe what happened in at least 5 characters.";
  }
  return errors;
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

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateDraftInput(zoneId, rawInput);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setGenerating(true);
    try {
      setDraft(await onGenerateDraft({ zoneId, rawInput: rawInput.trim() }));
    } finally {
      setGenerating(false);
    }
  };

  const submitDraft = async (nextDraft: IncidentReport) => {
    setSubmitting(true);
    try {
      await onSubmitReport?.(nextDraft);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="grid gap-4" aria-label="Incident copilot">
      <form
        className="grid gap-4"
        onSubmit={(event) => void handleGenerate(event)}
      >
        <ZoneField
          error={errors.zoneId}
          errorId={zoneErrorId}
          labelId={zoneLabelId}
          onChange={setZoneId}
          value={zoneId}
          zones={zones}
        />
        <NotesField
          error={errors.rawInput}
          errorId={rawInputErrorId}
          inputId={rawInputId}
          onChange={setRawInput}
          value={rawInput}
        />
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
          onSubmitReport={submitDraft}
          submitting={submitting}
        />
      )}
    </section>
  );
});
