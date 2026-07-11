import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/services/apiClient";
import { supabase } from "@/services/supabaseConfig";
import type { CrowdZonesResponse } from "@/types/api";
import type { CrowdZoneSummary } from "@/types/domain";

export interface CrowdDensityState {
  zones: CrowdZoneSummary[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/** Reads backend-computed bands and refreshes instantly from the Supabase change signal. */
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
    const channel = supabase
      .channel("crowd-zone-live-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "zones" },
        () => void refresh(),
      )
      .subscribe();
    const fallbackInterval = window.setInterval(() => void refresh(), 30_000);
    return () => {
      window.clearInterval(fallbackInterval);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { zones, loading, error, refresh };
}
