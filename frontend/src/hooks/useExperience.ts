import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/services/apiClient";
import type {
  AccountExperienceResponse,
  PortalKind,
  PublicExperienceResponse,
  RolePortalResponse,
} from "@/types/api";

interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

let publicExperiencePromise: Promise<PublicExperienceResponse> | null = null;

function loadPublicExperience(): Promise<PublicExperienceResponse> {
  publicExperiencePromise ??= apiRequest<PublicExperienceResponse>(
    "/api/experience",
  ).catch((error: unknown) => {
    publicExperiencePromise = null;
    throw error;
  });
  return publicExperiencePromise;
}

function errorText(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "StadiumPulse information is temporarily unavailable.";
}

function useResource<T>(load: () => Promise<T>): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await load());
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { data, loading, error, refresh };
}

/** Loads the shared public tournament and venue information hub once per session. */
export function usePublicExperience(): ResourceState<PublicExperienceResponse> {
  return useResource(loadPublicExperience);
}

/** Loads the authenticated fan account's demo passes and portable preferences. */
export function useAccountExperience(): ResourceState<AccountExperienceResponse> {
  const load = useCallback(
    () => apiRequest<AccountExperienceResponse>("/api/account/overview"),
    [],
  );
  return useResource(load);
}

/** Loads a role-scoped workspace; backend authorization remains authoritative. */
export function useRolePortal(
  kind: PortalKind,
): ResourceState<RolePortalResponse> {
  const load = useCallback(
    () => apiRequest<RolePortalResponse>(`/api/portals/${kind}`),
    [kind],
  );
  return useResource(load);
}
