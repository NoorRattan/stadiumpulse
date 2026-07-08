import { memo, useState, type FormEvent } from "react";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import type { Briefing, Zone } from "@/types/domain";

/** Input sent to the briefing generation endpoint. */
export interface BriefingGenerateInput {
  zoneId: string;
  shiftLabel: string;
}

/** Props for the staff-only briefing generator. */
export interface BriefingGeneratorProps {
  zones: Zone[];
  onGenerate: (input: BriefingGenerateInput) => Promise<Briefing>;
  onGenerated?: (briefing: Briefing) => void;
}

/** Staff-only briefing generator; volunteers receive no generate control. */
export const BriefingGenerator = memo(function BriefingGenerator({
  zones,
  onGenerate,
  onGenerated,
}: BriefingGeneratorProps) {
  const { role } = useAuth();
  const [zoneId, setZoneId] = useState(zones[0]?.zoneId ?? "");
  const [shiftLabel, setShiftLabel] = useState("");
  const [generating, setGenerating] = useState(false);

  if (role !== "staff") {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!zoneId || !shiftLabel.trim()) {
      return;
    }
    setGenerating(true);
    try {
      const briefing = await onGenerate({
        zoneId,
        shiftLabel: shiftLabel.trim(),
      });
      onGenerated?.(briefing);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <form
      aria-label="Generate volunteer briefing"
      className="grid gap-4 rounded-lg border border-border bg-card p-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="grid gap-2">
        <Label id="briefing-zone-label">Zone</Label>
        <Select value={zoneId} onValueChange={setZoneId}>
          <SelectTrigger
            aria-labelledby="briefing-zone-label"
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
      </div>
      <div className="grid gap-2">
        <Label htmlFor="briefing-shift-label">Shift label</Label>
        <Input
          id="briefing-shift-label"
          onChange={(event) => setShiftLabel(event.target.value)}
          placeholder="Morning - Gates Open to Kickoff"
          value={shiftLabel}
        />
      </div>
      <Button
        className="min-h-11 justify-self-start"
        disabled={generating}
        type="submit"
      >
        <FileText aria-hidden="true" className="size-4" />
        Generate briefing
      </Button>
    </form>
  );
});
