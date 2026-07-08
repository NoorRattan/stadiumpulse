import { useEffect, useState } from "react";

import { apiRequest } from "@/services/apiClient";
import type { ZoneListResponse } from "@/types/api";
import type { ZoneSummary } from "@/types/domain";

let cachedZones: ZoneSummary[] | null = null;

/** State returned by the cached zone-options hook. */
export interface ZoneOptionsState {
  zones: ZoneSummary[];
  loading: boolean;
  error: Error | null;
}

/** Fetches identity-only zone options once, then reuses them in memory. */
export function useZoneOptions(): ZoneOptionsState {
  const [state, setState] = useState<ZoneOptionsState>({
    zones: cachedZones ?? [],
    loading: cachedZones === null,
    error: null,
  });

  useEffect(() => {
    if (cachedZones !== null) {
      return;
    }

    let active = true;
    void apiRequest<ZoneListResponse>("/api/wayfinding/zones")
      .then((response) => {
        cachedZones = response.zones;
        if (active) {
          setState({ zones: response.zones, loading: false, error: null });
        }
      })
      .catch((caught: unknown) => {
        const error =
          caught instanceof Error
            ? caught
            : new Error("Zone options could not be loaded.");
        if (active) {
          setState({ zones: [], loading: false, error });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
