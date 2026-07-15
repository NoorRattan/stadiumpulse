import { AppShell } from "@/components/layout";
import { FanCockpit } from "@/pages/cockpit/FanCockpit";
import { OrganizerCockpit } from "@/pages/cockpit/OrganizerCockpit";
import { StaffCockpit } from "@/pages/cockpit/StaffCockpit";
import { VolunteerCockpit } from "@/pages/cockpit/VolunteerCockpit";

export type CockpitKind = "fan" | "volunteer" | "staff" | "organizer";

interface CockpitCopy {
  eyebrow: string;
  title: string;
  description: string;
  tone: string;
}

const routeCopy: Record<CockpitKind, CockpitCopy> = {
  fan: {
    eyebrow: "FAN COCKPIT - CONNECTED DEMO",
    title: "Your match day, one tap away.",
    description:
      "Tickets, gates, transport, food, accessibility, and PulseAI previews for the venue you are heading to.",
    tone: "text-primary border-primary/45",
  },
  volunteer: {
    eyebrow: "VOLUNTEER HUB - SHIFT-READY",
    title: "Shift-ready. Zone-aware.",
    description:
      "Connected public snapshots and simulated tasks show how volunteers can prepare, train, and guide fans.",
    tone: "text-secondary border-secondary/45",
  },
  staff: {
    eyebrow: "VENUE STAFF - SIMULATED OPS",
    title: "Operate safely. See everything.",
    description:
      "A connected snapshot of crowd zones plus simulated incidents, queues, and roster readiness in one cockpit.",
    tone: "text-accent border-accent/45",
  },
  organizer: {
    eyebrow: "COMMAND CENTER - WC26 DEMO",
    title: "Command every venue, in real time.",
    description:
      "Connected public snapshots and simulated decision support demonstrate a multi-venue command workflow.",
    tone: "text-primary border-primary/45",
  },
};

const cockpits: Record<CockpitKind, () => JSX.Element> = {
  fan: FanCockpit,
  volunteer: VolunteerCockpit,
  staff: StaffCockpit,
  organizer: OrganizerCockpit,
};

/** Reference-matched role cockpit populated from StadiumPulse's public APIs. */
export default function CockpitPage({
  kind,
}: {
  kind: CockpitKind;
}): JSX.Element {
  const copy = routeCopy[kind];
  const Cockpit = cockpits[kind];

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
        <Cockpit />
      </div>
    </AppShell>
  );
}
