import { useState } from "react";
import { Bell, Sparkles } from "lucide-react";

import { usePublicExperience } from "@/hooks/useExperience";
import {
  DemoFreshness,
  MetricStrip,
  Panel,
  useDemoData,
} from "@/pages/cockpit/shared";

interface OrganizerAction {
  zoneId: string;
  zoneName: string;
  recommendedAction: string;
  confidence?: string;
}

interface SustainabilityView {
  metricId: string;
  label: string;
  value: string;
  trend: string;
}

interface VenueView {
  venueId: string;
  city: string;
  country: string;
}

const loadingActions: OrganizerAction[] = [
  {
    zoneId: "loading",
    zoneName: "Connecting",
    recommendedAction: "Loading the simulated operations snapshot.",
  },
];

const loadingSustainability: SustainabilityView[] = [
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
    label: "CO2 per fan",
    value: "--",
    trend: "loading",
  },
];

const loadingVenue: VenueView = {
  venueId: "loading",
  city: "Connecting",
  country: "Demo network",
};

function PredictionChart(): JSX.Element {
  return (
    <svg
      aria-label="Simulated predictive crowd curve"
      className="mt-5 h-44 w-full"
      role="img"
      viewBox="0 0 700 180"
    >
      <defs>
        <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="var(--brand-cyan)" stopOpacity=".7" />
          <stop offset="1" stopColor="var(--brand-cyan)" stopOpacity="0" />
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
  );
}

function PredictionPanel({
  topZone,
}: {
  topZone?: OrganizerAction;
}): JSX.Element {
  return (
    <Panel
      className="pulse-beam"
      eyebrow="NEXT 15 MIN - SIMULATED SNAPSHOT"
      icon={
        <span className="font-mono text-xs text-primary">
          CONF {topZone?.confidence?.toUpperCase() ?? "--"}
        </span>
      }
      title={`Predictive crowd - ${topZone?.zoneName ?? "Connecting"}`}
    >
      <PredictionChart />
      <div className="rounded-r-xl border-l-2 border-primary bg-background/55 p-4">
        <p className="panel-label text-primary">Scenario recommendation</p>
        <p className="mt-2 text-sm leading-6">
          {topZone?.recommendedAction ??
            "Loading the simulated operations digest..."}
        </p>
      </div>
    </Panel>
  );
}

function BriefingCard({
  item,
  index,
}: {
  item: OrganizerAction;
  index: number;
}): JSX.Element {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex justify-between gap-2">
        <p className="text-sm font-bold">
          {index === 0 ? "Pre-match ops summary" : `${item.zoneName} alert`}
        </p>
        <span className="font-mono text-[0.55rem] text-muted-foreground">
          PREVIEW
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {item.recommendedAction}
      </p>
    </div>
  );
}

function BriefingsPanel({ actions }: { actions: OrganizerAction[] }) {
  const visibleActions = actions.length ? actions : loadingActions;
  return (
    <Panel
      eyebrow="CURATED - SIMULATED"
      icon={<Sparkles aria-hidden="true" className="size-4" />}
      title="Briefing previews"
    >
      <div className="mt-4 grid gap-2">
        {visibleActions.map((item, index) => (
          <BriefingCard index={index} item={item} key={item.zoneId} />
        ))}
      </div>
    </Panel>
  );
}

function SustainabilityCard({ metric }: { metric: SustainabilityView }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="panel-label">{metric.label}</p>
      <p className="mt-3 font-mono text-2xl font-bold">{metric.value}</p>
      <p className="mt-1 text-xs text-primary">{metric.trend}</p>
    </div>
  );
}

function SustainabilityPanel({
  metrics,
}: {
  metrics: SustainabilityView[];
}): JSX.Element {
  const visibleMetrics = metrics.length ? metrics : loadingSustainability;
  return (
    <Panel
      eyebrow="CURATED SNAPSHOT - PUBLIC IMPACT"
      icon={<Sparkles aria-hidden="true" className="size-4" />}
      title="Sustainability signal"
    >
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {visibleMetrics.map((metric) => (
          <SustainabilityCard key={metric.metricId} metric={metric} />
        ))}
      </div>
    </Panel>
  );
}

function DecisionAlert({
  item,
  reviewed,
  onReview,
}: {
  item: OrganizerAction;
  reviewed: boolean;
  onReview: (zoneId: string) => void;
}): JSX.Element {
  return (
    <li className="rounded-lg border-l-2 border-secondary bg-background/35 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold">{item.recommendedAction}</p>
          <p className="mt-1 font-mono text-[0.55rem] uppercase text-muted-foreground">
            {item.zoneName}
          </p>
        </div>
        {reviewed ? (
          <span className="font-mono text-xs text-primary">
            REVIEWED IN PREVIEW
          </span>
        ) : (
          <button
            className="min-h-10 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground"
            onClick={() => onReview(item.zoneId)}
            type="button"
          >
            Mark reviewed
          </button>
        )}
      </div>
    </li>
  );
}

function DecisionAlertsPanel({
  actions,
  reviewed,
  onReview,
}: {
  actions: OrganizerAction[];
  reviewed: string[];
  onReview: (zoneId: string) => void;
}): JSX.Element {
  const visibleActions = actions.length ? actions : loadingActions;
  return (
    <Panel
      eyebrow="SIMULATED SNAPSHOT - LOCAL REVIEW"
      icon={<Bell aria-hidden="true" className="size-4 text-secondary" />}
      title="Decision alerts"
    >
      <ul className="mt-4 grid gap-3">
        {visibleActions.map((item) => (
          <DecisionAlert
            item={item}
            key={item.zoneId}
            onReview={onReview}
            reviewed={reviewed.includes(item.zoneId)}
          />
        ))}
      </ul>
    </Panel>
  );
}

function VenueCard({ venue, index }: { venue: VenueView; index: number }) {
  const indicator = index % 3 === 0 ? "bg-secondary" : "bg-primary";
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-bold">{venue.city}</p>
        <p className="text-xs text-muted-foreground">{venue.country}</p>
      </div>
      <span className={`size-2 rounded-full ${indicator}`} />
    </div>
  );
}

function PlaceholderVenue({ index }: { index: number }): JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-bold">
          Host city {String(index + 1).padStart(2, "0")}
        </p>
        <p className="text-xs text-muted-foreground">Not connected in demo</p>
      </div>
      <span className="size-2 rounded-full bg-muted-foreground" />
    </div>
  );
}

function VenueGridPanel({ venues }: { venues: VenueView[] }): JSX.Element {
  const visibleVenues = venues.length ? venues : [loadingVenue];
  const placeholderCount = Math.max(0, 16 - venues.length);
  return (
    <Panel
      eyebrow="CONNECTED SNAPSHOT - DEMO VENUES"
      title="Venue grid - 16 host cities"
    >
      <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {visibleVenues.map((venue, index) => (
          <VenueCard index={index} key={venue.venueId} venue={venue} />
        ))}
        {Array.from({ length: placeholderCount }, (_, index) => (
          <PlaceholderVenue
            index={index + venues.length}
            key={`host-${index}`}
          />
        ))}
      </div>
    </Panel>
  );
}

function OrganizerMetrics({
  actions,
  attendance,
  routeMinutes,
  sustainability,
}: {
  actions: OrganizerAction[];
  attendance?: number;
  routeMinutes?: number;
  sustainability: SustainabilityView[];
}): JSX.Element {
  return (
    <MetricStrip
      metrics={[
        {
          label: "Venue capacity",
          value: attendance?.toLocaleString("en-US") ?? "--",
          delta: "connected snapshot",
        },
        {
          label: "Avg. route time",
          value: routeMinutes === undefined ? "--" : `${routeMinutes}m`,
          delta: "simulated",
        },
        {
          label: "Open incidents",
          value: String(actions.length).padStart(2, "0"),
          delta: "simulated",
        },
        {
          label: sustainability[0]?.label ?? "Shared transport",
          value: sustainability[0]?.value ?? "--",
          delta: sustainability[0]?.trend ?? "loading",
        },
      ]}
    />
  );
}

export function OrganizerCockpit(): JSX.Element {
  const demoState = useDemoData();
  const demo = demoState.data;
  const { data } = usePublicExperience();
  const [reviewed, setReviewed] = useState<string[]>([]);
  const actions = demo?.operationsDigest.items ?? [];
  const sustainability = data?.sustainability.slice(0, 3) ?? [];
  const venues = data?.venues ?? [];
  const review = (zoneId: string) => {
    setReviewed((current) => [...current, zoneId]);
  };

  return (
    <div className="grid gap-5">
      <DemoFreshness state={demoState} />
      <OrganizerMetrics
        actions={actions}
        attendance={data?.venues[0]?.capacity}
        routeMinutes={demo?.accessibleRoute.estimatedMinutes}
        sustainability={sustainability}
      />
      <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <PredictionPanel topZone={actions[0]} />
        <BriefingsPanel actions={actions} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <SustainabilityPanel metrics={sustainability} />
        <DecisionAlertsPanel
          actions={actions}
          onReview={review}
          reviewed={reviewed}
        />
      </div>
      <VenueGridPanel venues={venues} />
    </div>
  );
}
