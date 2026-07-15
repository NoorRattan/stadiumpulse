import {
  Accessibility,
  Bell,
  Bus,
  MapPin,
  ParkingCircle,
  Utensils,
  Wifi,
} from "lucide-react";

import { usePublicExperience } from "@/hooks/useExperience";
import type {
  AmenityInfo,
  DemoExperienceResponse,
  PublicExperienceResponse,
  PublicMatch,
  SafetyAlert,
  VenueInfo,
} from "@/types/api";

import {
  DemoFreshness,
  Panel,
  shortTeam,
  useDemoData,
  type DemoDataState,
} from "./shared";

const fallbackMatch: PublicMatch = {
  matchId: "fallback",
  homeTeam: "United States",
  awayTeam: "Canada",
  venueId: "demo-venue",
  venueName: "StadiumPulse Central",
  kickoffAt: "2026-07-15T18:00:00Z",
  status: "upcoming",
  score: null,
  ticketStatus: "Official ticketing",
};

const fallbackAlert: SafetyAlert = {
  alertId: "empty",
  issuedAt: "2026-07-15T18:00:00Z",
  message: "No active venue alerts.",
  severity: "info",
  title: "Venue status",
  zone: "Venue-wide",
};

const fallbackAmenities: AmenityInfo[] = [
  {
    amenityId: "food",
    name: "Food",
    category: "food",
    zone: "North Concourse",
    openingNote: "Open",
    accessibilityNote: "Step-free access",
  },
  {
    amenityId: "access",
    name: "Accessible route",
    category: "guest-services",
    zone: "Gate 2",
    openingNote: "Open",
    accessibilityNote: "Step-free access",
  },
  {
    amenityId: "restroom",
    name: "Restroom",
    category: "restroom",
    zone: "Section 118",
    openingNote: "Open",
    accessibilityNote: "Accessible stalls",
  },
  {
    amenityId: "wifi",
    name: "Free Wi-Fi",
    category: "guest-services",
    zone: "Venue-wide",
    openingNote: "Available",
    accessibilityNote: "Digital service",
  },
];

interface FanViewModel {
  alerts: SafetyAlert[];
  amenities: AmenityInfo[];
  away: string;
  demo: DemoExperienceResponse | null;
  gate: string;
  home: string;
  kickoff: Date;
  match: PublicMatch;
  matches: PublicMatch[];
  venue: VenueInfo | null;
}

function resolveVenue(
  data: PublicExperienceResponse | null,
  match: PublicMatch | undefined,
): VenueInfo | null {
  if (!data) return null;
  return (
    data.venues.find((item) => item.venueId === match?.venueId) ??
    data.venues[0] ??
    null
  );
}

function resolveTeams(
  match: PublicMatch,
  demo: DemoExperienceResponse | null,
): { home: string; away: string } {
  const homeTeam = match.homeTeam || demo?.match.homeTeam || "USA";
  const awayTeam = match.awayTeam || demo?.match.awayTeam || "Canada";
  return { home: shortTeam(homeTeam), away: shortTeam(awayTeam) };
}

function resolveGate(
  venue: VenueInfo | null,
  demo: DemoExperienceResponse | null,
): string {
  return (
    venue?.gates[0] ?? demo?.accessibleRoute.steps[0]?.instruction ?? "Gate 2"
  );
}

function publicLists(
  data: PublicExperienceResponse | null,
): Pick<FanViewModel, "alerts" | "amenities" | "matches"> {
  if (!data) return { alerts: [], amenities: [], matches: [] };
  return {
    alerts: data.alerts.slice(0, 3),
    amenities: data.amenities.slice(0, 4),
    matches: data.matches.slice(0, 4),
  };
}

function buildFanViewModel(
  data: PublicExperienceResponse | null,
  demo: DemoExperienceResponse | null,
): FanViewModel {
  const sourceMatch = data?.matches[0];
  const match = sourceMatch ?? fallbackMatch;
  const venue = resolveVenue(data, sourceMatch);
  const teams = resolveTeams(match, demo);

  return {
    ...publicLists(data),
    away: teams.away,
    demo,
    gate: resolveGate(venue, demo),
    home: teams.home,
    kickoff: new Date(match.kickoffAt),
    match,
    venue,
  };
}

function useFanViewModel(): {
  demoState: DemoDataState;
  model: FanViewModel;
} {
  const { data } = usePublicExperience();
  const demoState = useDemoData();
  return { demoState, model: buildFanViewModel(data, demoState.data) };
}

function DemoPass({ venue }: { venue: VenueInfo | null }): JSX.Element {
  return (
    <div className="mt-5 flex items-center gap-4 rounded-xl border border-border bg-background/60 p-4">
      <div className="grid size-20 shrink-0 grid-cols-2 gap-1 rounded-lg bg-foreground p-3">
        {[0, 1, 2, 3].map((item) => (
          <span className="rounded-sm border-4 border-background" key={item} />
        ))}
      </div>
      <div>
        <p className="panel-label">Present at gate</p>
        <p className="mt-1 font-display font-bold">
          {venue?.name ?? "StadiumPulse Central"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Read-only demo pass · use official FIFA ticketing
        </p>
      </div>
    </div>
  );
}

function MatchDayTicket({ model }: { model: FanViewModel }): JSX.Element {
  const { away, gate, home, kickoff, match, venue } = model;
  return (
    <Panel eyebrow="CURATED DEMO PASS" title="Match day ticket">
      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-4xl font-black tracking-tight">
            {home} <span className="font-mono text-xl text-primary">VS</span>{" "}
            {away}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {match.homeTeam} · {match.awayTeam}
          </p>
        </div>
        <span className="font-mono text-xs text-accent">CAT 1 · DEMO</span>
      </div>
      <dl className="mt-6 grid grid-cols-3 gap-3 border-y border-border py-4">
        <div>
          <dt className="panel-label">Date</dt>
          <dd className="mt-1 text-sm font-bold">
            {kickoff.toLocaleDateString("en", {
              month: "short",
              day: "numeric",
            })}
          </dd>
        </div>
        <div>
          <dt className="panel-label">Gate</dt>
          <dd className="mt-1 text-sm font-bold text-primary">{gate}</dd>
        </div>
        <div>
          <dt className="panel-label">Venue</dt>
          <dd className="mt-1 truncate text-sm font-bold">
            {venue?.name ?? match.venueName}
          </dd>
        </div>
      </dl>
      <DemoPass venue={venue} />
    </Panel>
  );
}

function RoutePreview({
  gate,
  minutes,
}: {
  gate: string;
  minutes: number;
}): JSX.Element {
  return (
    <div className="relative mt-4 h-40 overflow-hidden rounded-xl border border-border bg-background/55">
      <svg
        aria-label="Suggested path"
        className="h-full w-full"
        role="img"
        viewBox="0 0 600 160"
      >
        <defs>
          <linearGradient id="path-line" x1="0" x2="1">
            <stop stopColor="var(--brand-cyan)" />
            <stop offset="1" stopColor="var(--brand-magenta)" />
          </linearGradient>
        </defs>
        <path
          d="M30 128 C130 126 180 42 278 76 S450 134 565 30"
          fill="none"
          stroke="url(#path-line)"
          strokeDasharray="7 7"
          strokeWidth="4"
        />
        <circle cx="30" cy="128" fill="var(--brand-cyan)" r="7" />
        <circle cx="565" cy="30" fill="var(--brand-magenta)" r="8" />
      </svg>
      <span className="absolute bottom-3 left-3 panel-label">You → {gate}</span>
      <span className="absolute right-3 top-3 font-mono text-[0.65rem] text-primary">
        EST. {minutes} MIN
      </span>
    </div>
  );
}

function CrowdAwareNavigation({ model }: { model: FanViewModel }): JSX.Element {
  const minutes = model.demo?.accessibleRoute.estimatedMinutes ?? 14;
  const navigationMetrics = [
    [MapPin, "Fastest gate", model.gate, `${minutes} min route`],
    [
      Bus,
      "Nearest transit",
      model.demo?.travelSuggestions[0]?.mode ?? "Rail",
      "High-capacity",
    ],
    [ParkingCircle, "Best arrival", "Shared", "Lower congestion"],
  ] as const;

  return (
    <Panel
      eyebrow="LIVE PATH · CONNECTED DEMO"
      icon={
        <span className="size-3 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
      }
      title="Crowd-aware navigation"
    >
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {navigationMetrics.map(([Icon, label, value, detail]) => (
          <div className="rounded-xl border border-border p-3" key={label}>
            <p className="panel-label flex items-center gap-1.5">
              <Icon aria-hidden="true" className="size-3.5 text-primary" />
              {label}
            </p>
            <p className="mt-2 font-display text-xl font-bold capitalize">
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </div>
      <RoutePreview gate={model.gate} minutes={minutes} />
    </Panel>
  );
}

function FanMatches({ matches }: { matches: PublicMatch[] }): JSX.Element {
  const rows = matches.length > 0 ? matches : [fallbackMatch];
  return (
    <Panel eyebrow="TOURNAMENT SCHEDULE" title="Your matches">
      <div className="mt-4 divide-y divide-border">
        {rows.map((item, index) => (
          <div className="flex items-center gap-3 py-3" key={item.matchId}>
            <span className="grid size-10 place-content-center rounded-lg border border-border font-mono text-xs text-primary">
              {String.fromCharCode(65 + index)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {shortTeam(item.homeTeam)} vs {shortTeam(item.awayTeam)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {item.venueName}
              </p>
            </div>
            <time className="font-mono text-xs text-primary">
              {new Date(item.kickoffAt).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
              })}
            </time>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function LiveAlerts({ alerts }: { alerts: SafetyAlert[] }): JSX.Element {
  const rows = alerts.length > 0 ? alerts : [fallbackAlert];
  return (
    <Panel
      eyebrow="PERSONAL · VENUE"
      icon={<Bell aria-hidden="true" className="size-4 text-secondary" />}
      title="Live alerts"
    >
      <ul className="mt-4 grid gap-2">
        {rows.map((alert, index) => (
          <li
            className="border-l-2 border-primary py-2 pl-3 text-sm"
            key={alert.alertId}
          >
            <time className="mr-2 font-mono text-[0.62rem] text-primary">
              {new Date(alert.issuedAt).toLocaleTimeString("en", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
            {alert.message}
            {index === 0 && <span className="sr-only"> Latest alert</span>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function FanAmenities({
  amenities,
}: {
  amenities: AmenityInfo[];
}): JSX.Element {
  const rows = amenities.length > 0 ? amenities : fallbackAmenities;
  const icons = [Utensils, Accessibility, MapPin, Wifi];
  return (
    <Panel eyebrow="CONNECTED PUBLIC DIRECTORY" title="Amenities near you">
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((amenity, index) => {
          const Icon = icons[index] ?? MapPin;
          return (
            <div
              className="rounded-xl border border-border p-4"
              key={amenity.amenityId}
            >
              <Icon aria-hidden="true" className="size-4 text-primary" />
              <p className="mt-3 font-bold">{amenity.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {amenity.zone}
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function FanCockpit(): JSX.Element {
  const { demoState, model } = useFanViewModel();
  return (
    <div className="grid gap-5">
      <DemoFreshness state={demoState} />
      <div className="grid gap-5 lg:grid-cols-[.82fr_1.18fr]">
        <MatchDayTicket model={model} />
        <CrowdAwareNavigation model={model} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.18fr_.82fr]">
        <FanMatches matches={model.matches} />
        <LiveAlerts alerts={model.alerts} />
      </div>
      <FanAmenities amenities={model.amenities} />
    </div>
  );
}
