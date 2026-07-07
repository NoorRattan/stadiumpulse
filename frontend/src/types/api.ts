import type {
  AccessibilityNeed,
  AccessibilitySettings,
  Briefing,
  CrowdZoneSummary,
  IncidentReport,
  IncidentStatus,
  RouteOption,
  TravelSuggestion,
  UserProfile,
} from "./domain";

/** Backend error code taxonomy from File 04. */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "AI_UPSTREAM_ERROR";

/** Standard backend error detail. */
export interface ErrorDetail {
  code: ErrorCode;
  message: string;
  status: number;
}

/** Standard backend error response. */
export interface ErrorResponse {
  error: ErrorDetail;
}

/** API client error with typed backend metadata when present. */
export class ApiClientError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(error: ErrorDetail) {
    super(error.message);
    this.name = "ApiClientError";
    this.code = error.code;
    this.status = error.status;
  }
}

/** Paginated backend response envelope. */
export interface PaginatedResponse<TItem> {
  items: TItem[];
  limit: number;
  nextPageToken: string | null;
}

/** Chat request body. */
export interface ChatRequest {
  sessionId?: string;
  message: string;
  language: string;
}

/** Chat response body. */
export interface ChatResponse {
  sessionId: string;
  reply: string;
  detectedLanguage: string;
}

/** Wayfinding request body. */
export interface RouteRequest {
  fromZoneId: string;
  toZoneId: string;
  accessibilityNeeds: AccessibilityNeed[];
}

/** Wayfinding response body. */
export interface RouteResponse {
  routeOptions: RouteOption[];
  generatedBy: "ai" | "fallback";
}

/** Incident create request body. */
export interface IncidentCreateRequest {
  zoneId: string;
  rawInput: string;
}

/** Incident update request body. */
export interface IncidentUpdateRequest {
  status: IncidentStatus;
}

/** Briefing generation request body. */
export interface BriefingGenerateRequest {
  zoneId: string;
  shiftLabel: string;
}

/** Travel suggestions response body. */
export interface TravelSuggestionsResponse {
  matchId: string;
  suggestions: TravelSuggestion[];
}

/** Crowd zones list response body. */
export interface CrowdZonesResponse {
  zones: CrowdZoneSummary[];
}

/** Auth profile response body. */
export type UserProfileResponse = UserProfile;

/** Accessibility response and request body. */
export type AccessibilitySettingsResponse = AccessibilitySettings;

/** Incident list response body. */
export type IncidentListResponse = PaginatedResponse<IncidentReport>;

/** Briefing route response body. */
export type BriefingResponse = Briefing;
