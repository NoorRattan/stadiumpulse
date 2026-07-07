import { useCallback, useState } from "react";

import { apiRequest } from "../services/apiClient";
import type { RouteRequest, RouteResponse } from "../types/api";

/** State and command API for the wayfinding route endpoint. */
export interface WayfindingState {
  route: RouteResponse | null;
  loading: boolean;
  error: Error | null;
  getRoute: (request: RouteRequest) => Promise<RouteResponse>;
  reset: () => void;
}

/** Calls `/api/wayfinding/route` and stores the latest route response. */
export function useWayfinding(): WayfindingState {
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getRoute = useCallback(
    async (request: RouteRequest): Promise<RouteResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiRequest<RouteResponse, RouteRequest>(
          "/api/wayfinding/route",
          {
            method: "POST",
            body: request,
          },
        );
        setRoute(response);
        return response;
      } catch (caught) {
        const nextError =
          caught instanceof Error
            ? caught
            : new Error("Wayfinding request failed.");
        setError(nextError);
        throw nextError;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setRoute(null);
    setError(null);
    setLoading(false);
  }, []);

  return { route, loading, error, getRoute, reset };
}
