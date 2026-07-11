import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/services/apiClient";
import type { CrowdZonesResponse } from "@/types/api";
import type { CrowdZoneSummary } from "@/types/domain";

export interface CrowdDensityState {
  zones: CrowdZoneSummary[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/** Reads the backend-computed crowd bands and refreshes them on a bounded interval. */
export function useCrowdDensity(): CrowdDensityState {
  const [zones, setZones] = useState<CrowdZoneSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await apiRequest<CrowdZonesResponse>("/api/crowd/zones");
      setZones(response.zones);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught
          : new Error("Crowd zones could not be loaded."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  return { zones, loading, error, refresh };
}
