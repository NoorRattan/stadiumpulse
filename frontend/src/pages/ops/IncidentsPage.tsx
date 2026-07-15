import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { IncidentCopilotForm, IncidentList } from "@/components/incidents";
import { AppShell } from "@/components/layout";
import { FadeInView } from "@/components/motion/FadeInView";
import { useZoneOptions } from "@/hooks/useZoneOptions";
import { zoneSummaryToZone } from "@/lib/zoneUtils";
import { apiRequest } from "@/services/apiClient";
import type {
  IncidentCreateRequest,
  IncidentListResponse,
  IncidentUpdateRequest,
} from "@/types/api";
import type { IncidentReport, Zone } from "@/types/domain";

function IncidentsHeader({ zonesLoading }: { zonesLoading: boolean }) {
  return (
    <div className="border-b border-border pb-8">
      <span className="inline-flex items-center gap-2 border border-accent/25 bg-accent/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
        <ClipboardList aria-hidden="true" className="size-3" />
        Human-reviewed AI
      </span>
      <h1 className="mt-4 font-display text-4xl font-bold leading-none tracking-tight text-foreground sm:text-5xl">
        Incidents.
      </h1>
      <p className="mt-3 max-w-lg text-sm text-muted-foreground">
        Generate structured drafts from staff notes, then submit only after
        human review.
      </p>
      {zonesLoading && (
        <p className="mt-2 text-xs text-accent" role="status">
          Loading zone options...
        </p>
      )}
    </div>
  );
}

function useIncidentRecords() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest<IncidentListResponse>(
        "/api/incidents?limit=20",
      );
      setIncidents(response.items);
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Incidents could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  const generateDraft = async (input: IncidentCreateRequest) => {
    const draft = await apiRequest<IncidentReport, IncidentCreateRequest>(
      "/api/incidents",
      { method: "POST", body: input },
    );
    toast.success("Incident draft generated.");
    setIncidents((current) => [draft, ...current]);
    return draft;
  };

  const submitReport = async (draft: IncidentReport) => {
    const updated = await apiRequest<IncidentReport, IncidentUpdateRequest>(
      `/api/incidents/${draft.incidentId}`,
      { method: "PATCH", body: { status: "submitted" } },
    );
    setIncidents((current) =>
      current.map((incident) =>
        incident.incidentId === updated.incidentId ? updated : incident,
      ),
    );
    toast.success("Incident submitted.");
  };

  return { generateDraft, incidents, loading, submitReport };
}

function IncidentWorkspace({
  incidents,
  loading,
  onGenerateDraft,
  onSubmitReport,
  zones,
}: {
  incidents: IncidentReport[];
  loading: boolean;
  onGenerateDraft: (input: IncidentCreateRequest) => Promise<IncidentReport>;
  onSubmitReport: (draft: IncidentReport) => Promise<void>;
  zones: Zone[];
}): JSX.Element {
  return (
    <FadeInView>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <IncidentCopilotForm
          onGenerateDraft={onGenerateDraft}
          onSubmitReport={onSubmitReport}
          zones={zones}
        />
        <IncidentList incidents={incidents} loading={loading} zones={zones} />
      </div>
    </FadeInView>
  );
}

/** Ops incident page with AI draft generation and separate submission. */
export default function IncidentsPage(): JSX.Element {
  const { zones: zoneOptions, loading: zonesLoading } = useZoneOptions();
  const zones = useMemo(
    () => zoneOptions.map(zoneSummaryToZone),
    [zoneOptions],
  );
  const { generateDraft, incidents, loading, submitReport } =
    useIncidentRecords();

  return (
    <AppShell shader="subtle">
      <div className="grid gap-10">
        <IncidentsHeader zonesLoading={zonesLoading} />
        <IncidentWorkspace
          incidents={incidents}
          loading={loading}
          onGenerateDraft={generateDraft}
          onSubmitReport={submitReport}
          zones={zones}
        />
      </div>
    </AppShell>
  );
}
