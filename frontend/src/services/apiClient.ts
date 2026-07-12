import { supabase } from "./supabaseConfig";
import { ApiClientError, type ErrorResponse } from "../types/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions<TBody> {
  method?: HttpMethod;
  body?: TBody;
  signal?: AbortSignal;
  timeoutMs?: number;
}

const env = import.meta.env as Record<string, string | undefined>;
const apiBaseUrl = env.VITE_API_BASE_URL ?? "";

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (apiBaseUrl.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${apiBaseUrl}${normalizedPath.slice(4)}`;
  }
  return `${apiBaseUrl}${normalizedPath}`;
}

async function authHeader(): Promise<Record<string, string>> {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  if (!value || typeof value !== "object" || !("error" in value)) {
    return false;
  }
  const error = (value as ErrorResponse).error;
  return (
    typeof error?.code === "string" &&
    typeof error.message === "string" &&
    typeof error.status === "number"
  );
}

/** Sends a typed request to the FastAPI backend with the current Supabase access token. */
export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(await authHeader()),
  };
  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
    signal: options.signal ?? AbortSignal.timeout(options.timeoutMs ?? 15_000),
    cache: "no-store",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(buildUrl(path), init);
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isErrorResponse(payload)) {
      throw new ApiClientError(payload.error);
    }
    throw new ApiClientError({
      code: "INTERNAL_ERROR",
      message: "Unexpected server error.",
      status: response.status,
    });
  }
  return payload as TResponse;
}
