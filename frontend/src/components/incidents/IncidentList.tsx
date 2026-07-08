import { memo, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IncidentReport, IncidentStatus, Zone } from "@/types/domain";

/** Filters applied to the currently loaded incident page. */
export interface IncidentFilters {
  zoneId: string | null;
  status: IncidentStatus | null;
}

/** Props for the paginated incident list. */
export interface IncidentListProps {
  incidents: IncidentReport[];
  zones: Zone[];
  loading?: boolean;
  onFiltersChange?: (filters: IncidentFilters) => void;
}

const statusOptions: readonly IncidentStatus[] = [
  "draft",
  "submitted",
  "resolved",
];

/** Filterable incident list for the already-loaded paginated response. */
export const IncidentList = memo(function IncidentList({
  incidents,
  zones,
  loading = false,
  onFiltersChange,
}: IncidentListProps) {
  const [filters, setFilters] = useState<IncidentFilters>({
    zoneId: null,
    status: null,
  });

  const updateFilters = (nextFilters: IncidentFilters) => {
    setFilters(nextFilters);
    onFiltersChange?.(nextFilters);
  };

  const filteredIncidents = useMemo(
    () =>
      incidents.filter(
        (incident) =>
          (!filters.zoneId || incident.zoneId === filters.zoneId) &&
          (!filters.status || incident.status === filters.status),
      ),
    [filters.status, filters.zoneId, incidents],
  );

  return (
    <section className="grid gap-4" aria-label="Incident list">
      <div className="grid gap-3 md:grid-cols-2">
        <Select
          value={filters.zoneId ?? "all"}
          onValueChange={(value) =>
            updateFilters({
              ...filters,
              zoneId: value === "all" ? null : value,
            })
          }
        >
          <SelectTrigger
            aria-label="Filter incidents by zone"
            className="min-h-11 w-full"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All zones</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.zoneId} value={zone.zoneId}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.status ?? "all"}
          onValueChange={(value) =>
            updateFilters({
              ...filters,
              status: value === "all" ? null : (value as IncidentStatus),
            })
          }
        >
          <SelectTrigger
            aria-label="Filter incidents by status"
            className="min-h-11 w-full"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {loading && (
        <p className="text-sm text-accent" role="status">
          Loading incident page...
        </p>
      )}
      {!loading && filteredIncidents.length === 0 && (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          No incidents match the selected filters.
        </p>
      )}
      <ul className="grid gap-3">
        {filteredIncidents.map((incident) => (
          <li
            className="rounded-lg border border-border bg-card p-4"
            key={incident.incidentId}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-foreground">{incident.zoneId}</p>
              <Badge variant="outline">{incident.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {incident.aiDraftSummary || incident.rawInput}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
});
