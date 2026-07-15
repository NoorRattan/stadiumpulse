import type { Zone, ZoneSummary } from "@/types/domain";

/** Adapts a public route option to the minimal zone shape used by ops forms. */
export function zoneSummaryToZone(zone: ZoneSummary): Zone {
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
