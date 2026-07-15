import { memo, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ZoneSelectItems } from "@/components/ui/zone-select-items";
import type { IncidentReport, IncidentStatus, Zone } from "@/types/domain";

interface IncidentFilters {
  zoneId: string | null;
  status: IncidentStatus | null;
}

interface IncidentListProps {
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

function IncidentFilterControls({
  filters,
  onChange,
  zones,
}: {
  filters: IncidentFilters;
  onChange: (filters: IncidentFilters) => void;
  zones: Zone[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Select
        value={filters.zoneId ?? "all"}
        onValueChange={(value) =>
          onChange({ ...filters, zoneId: value === "all" ? null : value })
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
          <ZoneSelectItems zones={zones} />
        </SelectContent>
      </Select>
      <Select
        value={filters.status ?? "all"}
        onValueChange={(value) =>
          onChange({
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
  );
}

function IncidentRows({ incidents }: { incidents: IncidentReport[] }) {
  return (
    <ul className="grid gap-3">
      {incidents.map((incident) => (
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
  );
}

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
  const updateFilters = (next: IncidentFilters) => {
    setFilters(next);
    onFiltersChange?.(next);
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
      <IncidentFilterControls
        filters={filters}
        onChange={updateFilters}
        zones={zones}
      />
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
      <IncidentRows incidents={filteredIncidents} />
    </section>
  );
});
