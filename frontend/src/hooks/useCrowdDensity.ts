import { useEffect, useState } from "react";

import { supabase } from "../services/supabaseConfig";
import type { Zone, ZoneType } from "../types/domain";

/** State returned by the live crowd-density listener. */
export interface CrowdDensityState {
  zones: Zone[];
  loading: boolean;
  error: Error | null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function zoneFromRow(data: Record<string, unknown>): Zone {
  return {
    zoneId: stringValue(data.zone_id),
    name: stringValue(data.name),
    type: data.type as ZoneType,
    capacity: Number(data.capacity ?? 0),
    currentDensityPct: Number(data.current_density_pct ?? 0),
    lastUpdated: stringValue(data.last_updated),
    coordinates: {
      lat: Number(data.lat ?? 0),
      lng: Number(data.lng ?? 0),
    },
  };
}

/** Listens to the staff/volunteer Supabase zone feed with cleanup on unmount. */
export function useCrowdDensity(maxZones = 50): CrowdDensityState {
  const [state, setState] = useState<CrowdDensityState>({
    zones: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    void supabase
      .from("zones")
      .select(
        "zone_id,name,type,capacity,current_density_pct,last_updated,lat,lng",
      )
      .order("zone_id", { ascending: true })
      .limit(maxZones)
      .then(({ data, error }) => {
        if (!active) {
          return;
        }
        if (error) {
          setState({ zones: [], loading: false, error });
          return;
        }
        setState({
          zones: (data ?? []).map((row) => zoneFromRow(row)),
          loading: false,
          error: null,
        });
      });

    const channel = supabase
      .channel("zones-density")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "zones" },
        (payload) => {
          const nextZone = zoneFromRow(payload.new);
          setState((current) => ({
            ...current,
            zones: current.zones.map((zone) =>
              zone.zoneId === nextZone.zoneId ? nextZone : zone,
            ),
          }));
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [maxZones]);

  return state;
}
