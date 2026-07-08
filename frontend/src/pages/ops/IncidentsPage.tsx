import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { IncidentCopilotForm, IncidentList } from "@/components/incidents";
import { AppShell } from "@/components/layout";
import { useZoneOptions } from "@/hooks/useZoneOptions";
import { apiRequest } from "@/services/apiClient";
import type {
  IncidentCreateRequest,
  IncidentListResponse,
  IncidentUpdateRequest,
} from "@/types/api";
import type { IncidentReport, Zone, ZoneSummary } from "@/types/domain";

function zoneSummaryToZone(zone: ZoneSummary): Zone {
  return {
    zoneId: zone.zoneId,
    name: zone.name,
    type: zone.type,
    capacity: 1,
    currentDensityPct: 0,
    lastUpdated: "",
    coordinates: { lat: 0, lng: 0 },
  };
}

/** Ops incident page with AI draft generation and separate submission. */
export default function IncidentsPage(): JSX.Element {
  const { zones: zoneOptions, loading: zonesLoading } = useZoneOptions();
  const zones = useMemo(
    () => zoneOptions.map(zoneSummaryToZone),
    [zoneOptions],
  );
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

  return (
    <AppShell>
      <div className="grid gap-6">
        <section className="grid gap-2">
          <h1 className="font-display text-4xl font-bold text-foreground">
            Incidents
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Generate structured drafts from staff notes, then submit only after
            human review.
          </p>
        </section>

        {zonesLoading && (
          <p className="text-sm text-accent" role="status">
            Loading zone options...
          </p>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
          <IncidentCopilotForm
            zones={zones}
            onGenerateDraft={async (input) => {
              const draft = await apiRequest<
                IncidentReport,
                IncidentCreateRequest
              >("/api/incidents", {
                method: "POST",
                body: input,
              });
              toast.success("Incident draft generated.");
              setIncidents((current) => [draft, ...current]);
              return draft;
            }}
            onSubmitReport={async (draft) => {
              const updated = await apiRequest<
                IncidentReport,
                IncidentUpdateRequest
              >(`/api/incidents/${draft.incidentId}`, {
                method: "PATCH",
                body: { status: "submitted" },
              });
              setIncidents((current) =>
                current.map((incident) =>
                  incident.incidentId === updated.incidentId
                    ? updated
                    : incident,
                ),
              );
              toast.success("Incident submitted.");
            }}
          />
          <IncidentList incidents={incidents} loading={loading} zones={zones} />
        </div>
      </div>
    </AppShell>
  );
}
