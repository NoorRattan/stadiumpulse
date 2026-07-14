import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Accessibility,
  Bell,
  Bus,
  CheckCircle2,
  GraduationCap,
  HeartPulse,
  MapPin,
  ParkingCircle,
  Radio,
  Shield,
  Sparkles,
  Users,
  Utensils,
  Wifi,
} from "lucide-react";

import { AppShell } from "@/components/layout";
import { usePublicExperience } from "@/hooks/useExperience";
import { apiRequest } from "@/services/apiClient";
import type { DemoExperienceResponse } from "@/types/api";

export type CockpitKind = "fan" | "volunteer" | "staff" | "organizer";

const routeCopy: Record<
  CockpitKind,
  { eyebrow: string; title: string; description: string; tone: string }
> = {
  fan: {
    eyebrow: "FAN COCKPIT · LIVE",
    title: "Your match day, one tap away.",
    description:
      "Tickets, gates, transport, food, accessibility, and PulseAI — everything you need synced to the exact venue you're heading to.",
    tone: "text-primary border-primary/45",
  },
  volunteer: {
    eyebrow: "VOLUNTEER HUB · SHIFT-READY",
    title: "Shift-ready. Zone-aware.",
    description:
      "Your shifts, tasks, training, and venue guidance — everything you need to help fans have their best day.",
    tone: "text-secondary border-secondary/45",
  },
  staff: {
    eyebrow: "VENUE STAFF · OPS",
    title: "Operate safely. See everything.",
    description:
      "Live crowd density, incidents, security, medical and cleaning queues — all in one shared cockpit.",
    tone: "text-accent border-accent/45",
  },
  organizer: {
    eyebrow: "COMMAND CENTER · WC26",
    title: "Command every venue, in real time.",
    description:
      "Predictive crowd insights, AI-generated briefings, sustainability data, and live decision support across all 16 host cities.",
    tone: "text-primary border-primary/45",
  },
};

function useDemoData(): DemoExperienceResponse | null {
  const [demo, setDemo] = useState<DemoExperienceResponse | null>(null);
  useEffect(() => {
    let active = true;
    void apiRequest<DemoExperienceResponse>("/api/demo", { timeoutMs: 60_000 })
      .then((response) => {
        if (active) setDemo(response);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return demo;
}

function Panel({
  children,
  className = "",
  eyebrow,
  icon,
  title,
}: {
  children: ReactNode;
  className?: string;
  eyebrow: string;
  icon?: ReactNode;
  title: string;
}): JSX.Element {
  return (
    <section
      className={`rounded-xl border border-border bg-card/75 p-5 shadow-[0_16px_50px_rgb(2_6_23_/_0.18)] sm:p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-extrabold">{title}</h2>
          <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        </div>
        <span className="text-primary">{icon}</span>
      </div>
      {children}
    </section>
  );
}

function MiniBars(): JSX.Element {
  return (
    <span aria-hidden="true" className="mt-4 flex h-8 items-end gap-1">
      {[9, 18, 14, 24, 19, 28, 22, 33, 27, 36].map((height, index) => (
        <span
          className="w-1.5 bg-[linear-gradient(var(--brand-cyan),var(--brand-violet))]"
          key={`${height}-${index}`}
          style={{ height }}
        />
      ))}
    </span>
  );
}

function MetricStrip({
  metrics,
}: {
  metrics: Array<{ label: string; value: string; delta: string }>;
}): JSX.Element {
  return (
    <section
      aria-label="Live cockpit metrics"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map((metric) => (
        <article
          className="rounded-xl border border-border bg-card/75 p-5"
          key={metric.label}
        >
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
            {metric.label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-mono text-3xl font-bold">{metric.value}</p>
            <span className="font-mono text-xs text-primary">
              {metric.delta}
            </span>
          </div>
          <MiniBars />
        </article>
      ))}
    </section>
  );
}

function shortTeam(team: string): string {
  const words = team
    .replace(/[^A-Za-z ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function FanCockpit(): JSX.Element {
  const { data } = usePublicExperience();
  const demo = useDemoData();
  const match = data?.matches[0];
  const venue =
    data?.venues.find((item) => item.venueId === match?.venueId) ??
    data?.venues[0];
  const route = demo?.accessibleRoute;
  const matches = data?.matches.slice(0, 4) ?? [];
  const alerts = data?.alerts.slice(0, 3) ?? [];
  const amenities = data?.amenities.slice(0, 4) ?? [];
  const home = shortTeam(match?.homeTeam ?? demo?.match.homeTeam ?? "USA");
  const away = shortTeam(match?.awayTeam ?? demo?.match.awayTeam ?? "CAN");
  const kickoff = match?.kickoffAt ? new Date(match.kickoffAt) : null;
  const gate = venue?.gates[0] ?? route?.steps[0]?.instruction ?? "Gate 2";

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[.82fr_1.18fr]">
        <Panel eyebrow="CURATED DEMO PASS" title="Match day ticket">
          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <p className="font-display text-4xl font-black tracking-tight">
                {home}{" "}
                <span className="font-mono text-xl text-primary">VS</span>{" "}
                {away}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {match?.homeTeam ?? "United States"} ·{" "}
                {match?.awayTeam ?? "Canada"}
              </p>
            </div>
            <span className="font-mono text-xs text-accent">CAT 1 · DEMO</span>
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-3 border-y border-border py-4">
            <div>
              <dt className="panel-label">Date</dt>
              <dd className="mt-1 text-sm font-bold">
                {kickoff
                  ? kickoff.toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Jul 15"}
              </dd>
            </div>
            <div>
              <dt className="panel-label">Gate</dt>
              <dd className="mt-1 text-sm font-bold text-primary">{gate}</dd>
            </div>
            <div>
              <dt className="panel-label">Venue</dt>
              <dd className="mt-1 truncate text-sm font-bold">
                {venue?.name ?? "StadiumPulse Central"}
              </dd>
            </div>
          </dl>
          <div className="mt-5 flex items-center gap-4 rounded-xl border border-border bg-background/60 p-4">
            <div className="grid size-20 shrink-0 grid-cols-2 gap-1 rounded-lg bg-foreground p-3">
              {[0, 1, 2, 3].map((item) => (
                <span
                  className="rounded-sm border-4 border-background"
                  key={item}
                />
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
        </Panel>

        <Panel
          eyebrow="LIVE PATH · CONNECTED DEMO"
          icon={
            <span className="size-3 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          }
          title="Crowd-aware navigation"
        >
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              [
                MapPin,
                "Fastest gate",
                gate,
                `${route?.estimatedMinutes ?? 14} min route`,
              ],
              [
                Bus,
                "Nearest transit",
                demo?.travelSuggestions[0]?.mode ?? "Rail",
                "High-capacity",
              ],
              [ParkingCircle, "Best arrival", "Shared", "Lower congestion"],
            ].map(([Icon, label, value, detail]) => {
              const MetricIcon = Icon as typeof MapPin;
              return (
                <div
                  className="rounded-xl border border-border p-3"
                  key={String(label)}
                >
                  <p className="panel-label flex items-center gap-1.5">
                    <MetricIcon
                      aria-hidden="true"
                      className="size-3.5 text-primary"
                    />
                    {String(label)}
                  </p>
                  <p className="mt-2 font-display text-xl font-bold capitalize">
                    {String(value)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {String(detail)}
                  </p>
                </div>
              );
            })}
          </div>
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
            <span className="absolute bottom-3 left-3 panel-label">
              You → {gate}
            </span>
            <span className="absolute right-3 top-3 font-mono text-[0.65rem] text-primary">
              EST. {route?.estimatedMinutes ?? 14} MIN
            </span>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.18fr_.82fr]">
        <Panel eyebrow="TOURNAMENT SCHEDULE" title="Your matches">
          <div className="mt-4 divide-y divide-border">
            {(matches.length
              ? matches
              : [
                  {
                    matchId: "fallback",
                    homeTeam: "United States",
                    awayTeam: "Canada",
                    venueName: "StadiumPulse Central",
                    kickoffAt: "2026-07-15T18:00:00Z",
                  },
                ]
            ).map((item, index) => (
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
        <Panel
          eyebrow="PERSONAL · VENUE"
          icon={<Bell aria-hidden="true" className="size-4 text-secondary" />}
          title="Live alerts"
        >
          <ul className="mt-4 grid gap-2">
            {(alerts.length
              ? alerts
              : [
                  {
                    alertId: "empty",
                    issuedAt: new Date().toISOString(),
                    message: "No active venue alerts.",
                  },
                ]
            ).map((alert, index) => (
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
      </div>

      <Panel eyebrow="CONNECTED PUBLIC DIRECTORY" title="Amenities near you">
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(amenities.length
            ? amenities
            : [
                { amenityId: "food", name: "Food", zone: "North Concourse" },
                {
                  amenityId: "access",
                  name: "Accessible route",
                  zone: "Gate 2",
                },
                {
                  amenityId: "restroom",
                  name: "Restroom",
                  zone: "Section 118",
                },
                { amenityId: "wifi", name: "Free Wi-Fi", zone: "Venue-wide" },
              ]
          ).map((amenity, index) => {
            const Icon =
              [Utensils, Accessibility, MapPin, Wifi][index] ?? MapPin;
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
    </div>
  );
}

function VolunteerCockpit(): JSX.Element {
  const { data } = usePublicExperience();
  const shifts = data?.fanEvents.slice(0, 3) ?? [];
  const taskSource = [
    ...(data?.alerts ?? []).map((alert) => ({
      id: alert.alertId,
      title: alert.title,
      detail: alert.zone,
    })),
    ...(data?.amenities ?? []).map((item) => ({
      id: item.amenityId,
      title: `Verify ${item.name}`,
      detail: item.zone,
    })),
  ].slice(0, 3);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        eyebrow="TODAY · CONNECTED DEMO"
        icon={
          <span className="size-3 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
        }
        title="Your shifts"
      >
        <div className="mt-4 divide-y divide-border">
          {(shifts.length
            ? shifts
            : [
                {
                  eventId: "shift-1",
                  title: "North Gate B",
                  location: "Wayfinding",
                  startsAt: "2026-07-15T16:00:00Z",
                },
                {
                  eventId: "shift-2",
                  title: "Concourse 210",
                  location: "Language Assist",
                  startsAt: "2026-07-15T17:00:00Z",
                },
                {
                  eventId: "shift-3",
                  title: "Family Zone",
                  location: "Accessibility Buddy",
                  startsAt: "2026-07-15T15:30:00Z",
                },
              ]
          ).map((shift, index) => (
            <div className="flex items-center gap-3 py-3" key={shift.eventId}>
              <span className="grid size-10 place-content-center rounded-lg border border-border text-secondary">
                <MapPin aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{shift.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {shift.location}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs">
                  {new Date(shift.startsAt).toLocaleTimeString("en", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p
                  className={`font-mono text-[0.58rem] uppercase ${index === 2 ? "text-accent" : "text-primary"}`}
                >
                  {index === 2 ? "pending" : "confirmed"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="LIVE FEED · 3 OPEN" title="Assigned tasks">
        <ul className="mt-4 grid gap-3">
          {(taskSource.length
            ? taskSource
            : [
                {
                  id: "task-1",
                  title: "Escort mobility guest to Section 118",
                  detail: "Due 17:20",
                },
                {
                  id: "task-2",
                  title: "Verify Spanish signage — Concourse 210",
                  detail: "Due 18:00",
                },
                {
                  id: "task-3",
                  title: "Water station refill — West B",
                  detail: "Due 19:30",
                },
              ]
          ).map((task, index) => (
            <li
              className={`rounded-r-lg border-l-2 ${index === 0 ? "border-secondary" : index === 1 ? "border-accent" : "border-primary"} bg-background/35 p-3`}
              key={task.id}
            >
              <div className="flex gap-2">
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <div>
                  <p className="text-sm font-semibold">{task.title}</p>
                  <p className="mt-1 font-mono text-[0.58rem] uppercase text-muted-foreground">
                    {task.detail} ·{" "}
                    {index === 0 ? "high" : index === 1 ? "med" : "low"}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        eyebrow="COMPLETE BEFORE KICKOFF"
        icon={<GraduationCap aria-hidden="true" className="size-4" />}
        title="Training modules"
      >
        <div className="mt-5 grid gap-4">
          {[
            ["Crowd flow basics", 100],
            ["Accessibility etiquette", 80],
            ["Emergency protocols", 45],
            ["Multilingual phrases", 20],
          ].map(([label, progress]) => (
            <div key={String(label)}>
              <div className="flex justify-between text-sm">
                <span>{label}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {progress}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-cyan),var(--brand-magenta))]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        eyebrow="ZONE B · SUPERVISOR"
        icon={<Radio aria-hidden="true" className="size-4 text-secondary" />}
        title="Live comms"
      >
        <div className="mt-4 grid gap-2">
          {[
            [
              "Supervisor · N-Gate",
              "Turnstile 4 slow. Redirect groups to 3 & 5.",
            ],
            ["Med Team", "Ambulance access clear at Ramp 2."],
            ["Ops", "Language support requested — Concourse 210."],
          ].map(([sender, message], index) => (
            <div className="rounded-lg border border-border p-3" key={sender}>
              <div className="flex justify-between font-mono text-[0.58rem] uppercase tracking-wider text-primary">
                <span>{sender}</span>
                <span className="text-muted-foreground">
                  {["17:12", "17:04", "16:52"][index]}
                </span>
              </div>
              <p className="mt-2 text-sm">{message}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function densityTone(value: number): string {
  if (value >= 85) return "var(--brand-magenta)";
  if (value >= 65) return "var(--brand-amber)";
  return "var(--brand-cyan)";
}

function StaffCockpit(): JSX.Element {
  const demo = useDemoData();
  const { data } = usePublicExperience();
  const zones = demo?.zones ?? [];
  const average = zones.length
    ? Math.round(
        zones.reduce((sum, zone) => sum + zone.currentDensityPct, 0) /
          zones.length,
      )
    : 0;
  const actionCount = demo?.operationsDigest.items.length ?? 0;
  const incidentFeed = demo?.operationsDigest.items ?? [];

  return (
    <div className="grid gap-5">
      <MetricStrip
        metrics={[
          {
            label: "Avg. live density",
            value: zones.length ? `${average}%` : "--",
            delta: zones.length ? "connected" : "loading",
          },
          {
            label: "Open incidents",
            value: String(actionCount).padStart(2, "0"),
            delta: "review",
          },
          {
            label: "Public alerts",
            value: String(data?.alerts.length ?? 0).padStart(2, "0"),
            delta: "stable",
          },
          {
            label: "Monitored zones",
            value: String(zones.length).padStart(2, "0"),
            delta: "live",
          },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-[1.18fr_.82fr]">
        <Panel
          eyebrow="UPDATED FROM /API/DEMO"
          icon={
            <span className="size-3 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          }
          title="Zone density heatmap"
        >
          <div className="mt-5 grid gap-3">
            {(zones.length
              ? zones
              : [
                  {
                    zoneId: "loading-1",
                    name: "Connecting venue data",
                    currentDensityPct: 0,
                  },
                  {
                    zoneId: "loading-2",
                    name: "Waiting for demo API",
                    currentDensityPct: 0,
                  },
                ]
            ).map((zone, index) => (
              <div
                className="grid grid-cols-[1fr_2fr_auto] items-center gap-3"
                key={zone.zoneId}
              >
                <p className="truncate text-sm">
                  <span className="mr-2 font-mono text-[0.55rem] text-muted-foreground">
                    Z{index + 1}
                  </span>
                  {zone.name}
                </p>
                <div className="h-8 overflow-hidden rounded-md border border-border bg-background/45">
                  <div
                    className="h-full opacity-80"
                    style={{
                      background: densityTone(zone.currentDensityPct),
                      width: `${zone.currentDensityPct}%`,
                    }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-xs">
                  {Math.round(zone.currentDensityPct)}%
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="TRIAGE · REAL-TIME"
          icon={<Shield aria-hidden="true" className="size-4 text-secondary" />}
          title="Incident feed"
        >
          <ul className="mt-4 grid gap-3">
            {(incidentFeed.length
              ? incidentFeed
              : [
                  {
                    zoneId: "none",
                    zoneName: "No incidents loaded",
                    recommendedAction: "The connected demo is starting.",
                    priority: "watch",
                  },
                ]
            ).map((item, index) => (
              <li
                className={`rounded-r-lg border-l-2 ${index === 0 ? "border-accent" : index === 1 ? "border-primary" : "border-secondary"} p-3`}
                key={item.zoneId}
              >
                <div className="flex justify-between text-sm">
                  <strong>
                    {item.priority === "urgent" ? "Crowd" : "Operations"} ·{" "}
                    <span className="font-normal text-muted-foreground">
                      {item.zoneName}
                    </span>
                  </strong>
                  <span className="font-mono text-[0.58rem] text-muted-foreground">
                    LIVE
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {item.recommendedAction}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel eyebrow="LIVE ROSTERS · DEMO READINESS" title="Team status">
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Shield, "Security", "112", "118"],
            [HeartPulse, "Medical", "40", "42"],
            [Sparkles, "Cleaning", "74", "88"],
            [Users, "Ushers", "205", "210"],
          ].map(([Icon, team, ready, total]) => {
            const TeamIcon = Icon as typeof Users;
            return (
              <div
                className="rounded-xl border border-border p-4"
                key={String(team)}
              >
                <TeamIcon aria-hidden="true" className="size-4 text-primary" />
                <p className="mt-3 font-bold">{String(team)}</p>
                <p className="mt-2 font-mono text-2xl font-bold">
                  {String(ready)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    / {String(total)} ready
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function OrganizerCockpit(): JSX.Element {
  const demo = useDemoData();
  const { data } = usePublicExperience();
  const [resolved, setResolved] = useState<string[]>([]);
  const attendance = data?.venues[0]?.capacity;
  const actions = demo?.operationsDigest.items ?? [];
  const topZone = actions[0];
  const sustainability = data?.sustainability.slice(0, 3) ?? [];
  const venues = data?.venues ?? [];

  return (
    <div className="grid gap-5">
      <MetricStrip
        metrics={[
          {
            label: "Venue capacity",
            value: attendance ? attendance.toLocaleString("en-US") : "--",
            delta: "connected",
          },
          {
            label: "Avg. route time",
            value: demo ? `${demo.accessibleRoute.estimatedMinutes}m` : "--",
            delta: "accessible",
          },
          {
            label: "Open incidents",
            value: String(actions.length).padStart(2, "0"),
            delta: "review",
          },
          {
            label: sustainability[0]?.label ?? "Shared transport",
            value: sustainability[0]?.value ?? "--",
            delta: sustainability[0]?.trend ?? "loading",
          },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <Panel
          className="pulse-beam"
          eyebrow="NEXT 15 MIN · DETERMINISTIC"
          icon={
            <span className="font-mono text-xs text-primary">
              CONF {topZone?.confidence?.toUpperCase() ?? "--"}
            </span>
          }
          title={`Predictive crowd — ${topZone?.zoneName ?? "Connecting"}`}
        >
          <svg
            aria-label="Predictive crowd curve"
            className="mt-5 h-44 w-full"
            role="img"
            viewBox="0 0 700 180"
          >
            <defs>
              <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
                <stop stopColor="var(--brand-cyan)" stopOpacity=".7" />
                <stop
                  offset="1"
                  stopColor="var(--brand-cyan)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            <path
              d="M20 145 L120 110 L220 78 L320 58 L420 66 L520 92 L620 74 L680 88 L680 160 L20 160 Z"
              fill="url(#area-fill)"
            />
            <path
              d="M20 145 L120 110 L220 78 L320 58 L420 66 L520 92 L620 74 L680 88"
              fill="none"
              stroke="var(--brand-cyan)"
              strokeWidth="4"
            />
          </svg>
          <div className="rounded-r-xl border-l-2 border-primary bg-background/55 p-4">
            <p className="panel-label text-primary">AI recommendation</p>
            <p className="mt-2 text-sm leading-6">
              {topZone?.recommendedAction ??
                "Loading the connected operations digest…"}
            </p>
          </div>
        </Panel>

        <Panel
          eyebrow="AUTO-GENERATED"
          icon={<Sparkles aria-hidden="true" className="size-4" />}
          title="AI briefings"
        >
          <div className="mt-4 grid gap-2">
            {(actions.length
              ? actions
              : [
                  {
                    zoneId: "loading",
                    zoneName: "Loading briefing",
                    recommendedAction:
                      "Connecting to the deterministic demo digest.",
                  },
                ]
            ).map((item, index) => (
              <div
                className="rounded-lg border border-border p-3"
                key={item.zoneId}
              >
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-bold">
                    {index === 0
                      ? "Pre-match ops summary"
                      : `${item.zoneName} alert`}
                  </p>
                  <span className="font-mono text-[0.55rem] text-muted-foreground">
                    LIVE
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {item.recommendedAction}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          eyebrow="LIVE · PUBLIC IMPACT"
          icon={<Sparkles aria-hidden="true" className="size-4" />}
          title="Sustainability signal"
        >
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(sustainability.length
              ? sustainability
              : [
                  {
                    metricId: "loading-1",
                    label: "Transit share",
                    value: "--",
                    trend: "loading",
                  },
                  {
                    metricId: "loading-2",
                    label: "Recycled waste",
                    value: "--",
                    trend: "loading",
                  },
                  {
                    metricId: "loading-3",
                    label: "CO₂ per fan",
                    value: "--",
                    trend: "loading",
                  },
                ]
            ).map((metric) => (
              <div
                className="rounded-xl border border-border p-4"
                key={metric.metricId}
              >
                <p className="panel-label">{metric.label}</p>
                <p className="mt-3 font-mono text-2xl font-bold">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs text-primary">{metric.trend}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="ACT NOW · HUMAN APPROVAL"
          icon={<Bell aria-hidden="true" className="size-4 text-secondary" />}
          title="Decision alerts"
        >
          <ul className="mt-4 grid gap-3">
            {(actions.length
              ? actions
              : [
                  {
                    zoneId: "loading",
                    zoneName: "Connecting",
                    recommendedAction: "Loading connected decision support.",
                  },
                ]
            ).map((item) => (
              <li
                className="rounded-lg border-l-2 border-secondary bg-background/35 p-3"
                key={item.zoneId}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold">
                      {item.recommendedAction}
                    </p>
                    <p className="mt-1 font-mono text-[0.55rem] uppercase text-muted-foreground">
                      {item.zoneName}
                    </p>
                  </div>
                  {resolved.includes(item.zoneId) ? (
                    <span className="font-mono text-xs text-primary">
                      APPROVED
                    </span>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        className="min-h-10 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground"
                        onClick={() =>
                          setResolved((current) => [...current, item.zoneId])
                        }
                        type="button"
                      >
                        Approve
                      </button>
                      <button
                        className="min-h-10 rounded-lg border border-border px-3 text-xs font-bold"
                        type="button"
                      >
                        Snooze
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        eyebrow="LIVE STATUS · CONNECTED VENUES"
        title="Venue grid · 16 host cities"
      >
        <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(venues.length
            ? venues
            : [
                {
                  venueId: "loading",
                  city: "Connecting",
                  country: "Demo network",
                },
              ]
          ).map((venue, index) => (
            <div
              className="flex items-center justify-between rounded-lg border border-border p-3"
              key={venue.venueId}
            >
              <div>
                <p className="text-sm font-bold">{venue.city}</p>
                <p className="text-xs text-muted-foreground">{venue.country}</p>
              </div>
              <span
                className={`size-2 rounded-full ${index % 3 === 0 ? "bg-secondary" : "bg-primary"}`}
              />
            </div>
          ))}
          {Array.from(
            { length: Math.max(0, 16 - venues.length) },
            (_, index) => (
              <div
                className="flex items-center justify-between rounded-lg border border-border p-3"
                key={`host-${index}`}
              >
                <div>
                  <p className="text-sm font-bold">
                    Host city{" "}
                    {String(index + venues.length + 1).padStart(2, "0")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Network standby
                  </p>
                </div>
                <span className="size-2 rounded-full bg-muted-foreground" />
              </div>
            ),
          )}
        </div>
      </Panel>
    </div>
  );
}

/** Reference-matched role cockpit populated from StadiumPulse's real public APIs. */
export default function CockpitPage({
  kind,
}: {
  kind: CockpitKind;
}): JSX.Element {
  const copy = routeCopy[kind];
  const content = useMemo(() => {
    if (kind === "fan") return <FanCockpit />;
    if (kind === "volunteer") return <VolunteerCockpit />;
    if (kind === "staff") return <StaffCockpit />;
    return <OrganizerCockpit />;
  }, [kind]);

  return (
    <AppShell>
      <div className="grid gap-8">
        <header>
          <p className={`cockpit-kicker w-fit ${copy.tone}`}>{copy.eyebrow}</p>
          <h1 className="mt-4 max-w-5xl font-display text-[clamp(2.5rem,4vw,3rem)] font-black leading-[.95] tracking-[-0.05em]">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            {copy.description}
          </p>
        </header>
        {content}
      </div>
    </AppShell>
  );
}
