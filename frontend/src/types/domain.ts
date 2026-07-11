/** Supabase custom access-token role claim mirrored for client-side UX routing. */
export type UserRole = "fan" | "staff" | "volunteer";

/** Supported concierge and preference language codes. */
export type SupportedLanguage =
  | "en"
  | "es"
  | "pt"
  | "fr"
  | "ar"
  | "de"
  | "ja"
  | "ko"
  | "zh"
  | "hi";

/** Stadium zone category from Supabase and the backend API. */
export type ZoneType = "concourse" | "gate" | "seating-block" | "transit-hub";

/** Live density reading source. */
export type ReadingSource = "sensor" | "manual" | "estimated";

/** Accessibility need enum shared with the wayfinding request. */
export type AccessibilityNeed =
  | "wheelchair"
  | "visual"
  | "hearing"
  | "cognitive"
  | "none";

/** Congestion level returned on route options. */
export type CongestionLevel = "low" | "medium" | "high" | "critical";

/** Server-derived crowd band returned by crowd routes. */
export type CrowdBand = "normal" | "moderate" | "high" | "critical";

/** Incident workflow status. */
export type IncidentStatus = "draft" | "submitted" | "resolved";

/** Incident severity assigned by triage or staff review. */
export type IncidentSeverity = "low" | "medium" | "high" | "critical";

/** Latitude and longitude pair for map rendering. */
export interface Coordinates {
  lat: number;
  lng: number;
}

/** User profile document and `/api/auth/*` response shape. */
export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  role: UserRole;
  preferredLanguage: string;
  createdAt?: string;
}

/** Supabase zone row hydrated with the row ID. */
export interface Zone {
  zoneId: string;
  name: string;
  type: ZoneType;
  capacity: number;
  currentDensityPct: number;
  lastUpdated: string;
  coordinates: Coordinates;
}

/** Identity-only zone option returned to all signed-in users. */
export interface ZoneSummary {
  zoneId: string;
  name: string;
  type: ZoneType;
}

/** Public tournament match schedule row hydrated with its row ID. */
export interface Match {
  matchId: string;
  venueZoneIds: string[];
  kickoffAt: string;
  homeTeam: string;
  awayTeam: string;
  transitLoadEstimate: "low" | "medium" | "high";
}

/** Raw zone density reading from the zone readings subcollection. */
export interface CrowdDensityReading {
  readingId: string;
  zoneId: string;
  densityPct: number;
  source: ReadingSource;
  recordedAt: string;
}

/** Flat crowd zone summary returned by File 04's crowd routes. */
export interface CrowdZoneSummary {
  zoneId: string;
  name: string;
  currentDensityPct: number;
  band: CrowdBand;
  alert: string;
  lastUpdated: string;
}

/** Wayfinding step returned inside a route option. */
export interface RouteStep {
  instruction: string;
  zoneId: string;
}

/** Candidate wayfinding route. */
export interface RouteOption {
  steps: RouteStep[];
  estimatedMinutes: number;
  congestionLevel: CongestionLevel;
}

/** Stored accessibility settings and PUT body. */
export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  preferredLanguage: string;
}

/** Stored incident report and incident route response shape. */
export interface IncidentReport {
  incidentId: string;
  zoneId: string;
  status: IncidentStatus;
  rawInput: string;
  aiDraftSummary: string | null;
  severity: IncidentSeverity | null;
  reportedByUid: string | null;
  createdAt: string;
  submittedAt: string | null;
  resolvedAt: string | null;
}

/** Volunteer briefing response shape. */
export interface Briefing {
  briefingId: string;
  zoneId: string;
  shiftLabel: string;
  content: string;
  generatedByUid: string;
  generatedAt: string;
}

/** Travel suggestion item. */
export interface TravelSuggestion {
  mode: string;
  description: string;
}
