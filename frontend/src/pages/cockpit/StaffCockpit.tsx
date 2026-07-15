import {
  HeartPulse,
  Shield,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { usePublicExperience } from "@/hooks/useExperience";
import {
  DemoFreshness,
  MetricStrip,
  Panel,
  useDemoData,
} from "@/pages/cockpit/shared";

interface DensityZone {
  zoneId: string;
  name: string;
  currentDensityPct: number;
}

interface IncidentItem {
  zoneId: string;
  zoneName: string;
  recommendedAction: string;
  priority: string;
}

const loadingZones: DensityZone[] = [
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
];

const loadingIncidents: IncidentItem[] = [
  {
    zoneId: "none",
    zoneName: "No incidents loaded",
    recommendedAction: "The connected demo snapshot is loading.",
    priority: "watch",
  },
];

const teamReadiness: Array<{
  Icon: LucideIcon;
  team: string;
  ready: string;
  total: string;
}> = [
  { Icon: Shield, team: "Security", ready: "112", total: "118" },
  { Icon: HeartPulse, team: "Medical", ready: "40", total: "42" },
  { Icon: Sparkles, team: "Cleaning", ready: "74", total: "88" },
  { Icon: Users, team: "Ushers", ready: "205", total: "210" },
];

function densityTone(value: number): string {
  if (value >= 85) return "var(--brand-magenta)";
  if (value >= 65) return "var(--brand-amber)";
  return "var(--brand-cyan)";
}

function DensityRow({ zone, index }: { zone: DensityZone; index: number }) {
  return (
    <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-3">
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
  );
}

function DensityPanel({ zones }: { zones: DensityZone[] }): JSX.Element {
  const visibleZones = zones.length ? zones : loadingZones;
  return (
    <Panel
      eyebrow="CONNECTED SNAPSHOT - /API/DEMO"
      icon={
        <span className="size-3 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
      }
      title="Zone density heatmap"
    >
      <div className="mt-5 grid gap-3">
        {visibleZones.map((zone, index) => (
          <DensityRow index={index} key={zone.zoneId} zone={zone} />
        ))}
      </div>
    </Panel>
  );
}

function IncidentRow({ item, index }: { item: IncidentItem; index: number }) {
  const borders = ["border-accent", "border-primary", "border-secondary"];
  const category = item.priority === "urgent" ? "Crowd" : "Operations";
  return (
    <li className={`rounded-r-lg border-l-2 ${borders[index]} p-3`}>
      <div className="flex justify-between text-sm">
        <strong>
          <span>{category} - </span>
          <span className="font-normal text-muted-foreground">
            {item.zoneName}
          </span>
        </strong>
        <span className="font-mono text-[0.58rem] text-muted-foreground">
          SNAPSHOT
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {item.recommendedAction}
      </p>
    </li>
  );
}

function IncidentPanel({ items }: { items: IncidentItem[] }): JSX.Element {
  const visibleItems = items.length ? items : loadingIncidents;
  return (
    <Panel
      eyebrow="TRIAGE - SIMULATED SNAPSHOT"
      icon={<Shield aria-hidden="true" className="size-4 text-secondary" />}
      title="Incident feed"
    >
      <ul className="mt-4 grid gap-3">
        {visibleItems.map((item, index) => (
          <IncidentRow index={index} item={item} key={item.zoneId} />
        ))}
      </ul>
    </Panel>
  );
}

function TeamStatusPanel(): JSX.Element {
  return (
    <Panel eyebrow="SIMULATED ROSTER - DEMO READINESS" title="Team status">
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {teamReadiness.map(({ Icon, ready, team, total }) => (
          <div className="rounded-xl border border-border p-4" key={team}>
            <Icon aria-hidden="true" className="size-4 text-primary" />
            <p className="mt-3 font-bold">{team}</p>
            <p className="mt-2 font-mono text-2xl font-bold">
              <span>{ready} </span>
              <span className="text-xs font-normal text-muted-foreground">
                / {total} ready
              </span>
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function StaffCockpit(): JSX.Element {
  const demoState = useDemoData();
  const demo = demoState.data;
  const { data } = usePublicExperience();
  const zones = demo?.zones ?? [];
  const incidentFeed = demo?.operationsDigest.items ?? [];
  const average = zones.length
    ? Math.round(
        zones.reduce((sum, zone) => sum + zone.currentDensityPct, 0) /
          zones.length,
      )
    : 0;
  const metrics = [
    {
      label: "Avg. snapshot density",
      value: zones.length ? `${average}%` : "--",
      delta: zones.length ? "connected" : "loading",
    },
    {
      label: "Open incidents",
      value: String(incidentFeed.length).padStart(2, "0"),
      delta: "simulated",
    },
    {
      label: "Public alerts",
      value: String(data?.alerts.length ?? 0).padStart(2, "0"),
      delta: "snapshot",
    },
    {
      label: "Monitored zones",
      value: String(zones.length).padStart(2, "0"),
      delta: "snapshot",
    },
  ];

  return (
    <div className="grid gap-5">
      <DemoFreshness state={demoState} />
      <MetricStrip metrics={metrics} />
      <div className="grid gap-5 lg:grid-cols-[1.18fr_.82fr]">
        <DensityPanel zones={zones} />
        <IncidentPanel items={incidentFeed} />
      </div>
      <TeamStatusPanel />
    </div>
  );
}
