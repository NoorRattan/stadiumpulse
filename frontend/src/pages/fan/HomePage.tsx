import {
  ArrowRight,
  Bot,
  Bus,
  Check,
  CircleDot,
  Leaf,
  MapPinned,
  RadioTower,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AppShell } from "@/components/layout";
import { VenueNetworkGlobe } from "@/components/visuals/VenueNetworkGlobe";

const roles = [
  [
    "MATCH DAY, EFFORTLESS",
    "Fans",
    "/fan",
    [
      "Tickets & QR gates",
      "Crowd-aware navigation",
      "Transport & parking",
      "Multilingual PulseAI",
    ],
  ],
  [
    "SHIFT-READY",
    "Volunteers",
    "/volunteer",
    [
      "Assigned zones & tasks",
      "Training modules",
      "Real-time guidance",
      "Live comms",
    ],
  ],
  [
    "OPERATE SAFELY",
    "Venue Staff",
    "/staff",
    [
      "Crowd monitoring",
      "Incident triage",
      "Medical / security / cleaning",
      "Ops coordination",
    ],
  ],
  [
    "COMMAND CENTER",
    "Organizers",
    "/organizer",
    [
      "Predictive crowd insights",
      "AI briefings",
      "Sustainability KPIs",
      "Real-time decisions",
    ],
  ],
] as const;

const highlights = [
  [
    Bot,
    "Multilingual GenAI Concierge",
    "Groq-powered natural chat across 10 supported languages for tickets, gates, parking, food, and accessibility.",
  ],
  [
    RadioTower,
    "Predictive Crowd Intelligence",
    "Live density, arrival curves, and gate throughput become forecasts operators can review before pressure becomes an incident.",
  ],
  [
    MapPinned,
    "Crowd-Aware Navigation",
    "StadiumPulse compares congestion and accessibility before guiding each fan, because the shortest route is not always the calmest.",
  ],
  [
    ShieldCheck,
    "Unified Incident Ops",
    "Security, medical, and cleaning teams share one incident picture with approval-gated drafts and shift briefings.",
  ],
  [
    Bus,
    "Transport & Parking Sync",
    "Fans compare lower-congestion arrivals while operations teams see the same match and transit-load context.",
  ],
  [
    Leaf,
    "Sustainability Signal",
    "Shared transport, refill, waste, and energy indicators remain visible to fans and organizer teams.",
  ],
] as const;

function HeroSection(): JSX.Element {
  return (
    <section className="grid items-center gap-12 lg:grid-cols-[1fr_.95fr]">
      <div>
        <p className="cockpit-kicker text-primary">
          <CircleDot aria-hidden="true" className="size-3" /> FIFA World Cup
          2026 · Match-Day OS
        </p>
        <h1 className="mt-6 max-w-2xl font-display text-[clamp(3.25rem,7vw,6.2rem)] font-black leading-[0.88] tracking-[-0.06em]">
          Every venue, <br />
          in one <span className="text-gradient">pulse.</span>
        </h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          StadiumPulse connects fan guidance and venue operations through one
          GenAI-powered, real-time match-day signal for World Cup 2026.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            className="brand-gradient-surface inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-extrabold shadow-[0_0_28px_var(--glow-primary)]"
            to="/demo"
          >
            Launch live connected demo{" "}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border-bright)] bg-card/50 px-6 font-bold hover:border-primary/60"
            to="/fan"
          >
            Explore fan experience
          </Link>
        </div>
        <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4">
          {[
            ["16", "Host Cities"],
            ["104", "Matches"],
            ["7", "Connected workflows"],
          ].map(([value, label]) => (
            <div key={label}>
              <dd className="font-mono text-2xl font-bold sm:text-3xl">
                {value}
              </dd>
              <dt className="mt-1 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">
                {label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
      <VenueNetworkGlobe />
    </section>
  );
}

function RoleSection(): JSX.Element {
  return (
    <section aria-labelledby="roles-heading">
      <p className="cockpit-kicker w-fit text-secondary">
        <CircleDot aria-hidden="true" className="size-3" /> Built for four
        match-day roles
      </p>
      <h2
        className="mt-5 font-display text-4xl font-black tracking-tight sm:text-5xl"
        id="roles-heading"
      >
        One platform. Four missions.
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Each role gets a purpose-built cockpit fed by the same connected venue
        scenario.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {roles.map(([eyebrow, title, href, features], index) => (
          <Link
            className="group rounded-xl border border-border bg-card/75 p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-card)]"
            key={href}
            to={href}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-primary">
                {eyebrow}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                0{index + 1}
              </span>
            </div>
            <h3 className="mt-7 font-display text-2xl font-extrabold">
              {title}
            </h3>
            <ul className="mt-5 grid gap-3 text-sm text-muted-foreground">
              {features.map((feature) => (
                <li className="flex items-start gap-2" key={feature}>
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-primary"
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold group-hover:text-primary">
              Open cockpit <ArrowRight aria-hidden="true" className="size-4" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HighlightSection(): JSX.Element {
  return (
    <section aria-labelledby="stack-heading">
      <p className="cockpit-kicker w-fit text-primary">
        <Sparkles aria-hidden="true" className="size-3" /> Connected
        capabilities
      </p>
      <h2
        className="mt-5 max-w-3xl font-display text-4xl font-black tracking-tight sm:text-5xl"
        id="stack-heading"
      >
        Real-time intelligence, from gate to grid.
      </h2>
      <div className="mt-9 grid overflow-hidden rounded-xl border border-border bg-card/65 md:grid-cols-2 lg:grid-cols-3">
        {highlights.map(([Icon, title, body]) => (
          <article className="border-b border-r border-border p-6" key={title}>
            <Icon aria-hidden="true" className="size-5 text-primary" />
            <h3 className="mt-5 font-display text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ConciergeSection(): JSX.Element {
  return (
    <section className="pulse-beam grid gap-8 rounded-2xl p-6 sm:p-9 lg:grid-cols-[1fr_.9fr] lg:items-center">
      <div>
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-primary">
          PulseAI · live generative proof
        </p>
        <h2 className="mt-4 max-w-xl font-display text-3xl font-black sm:text-4xl">
          A multilingual concierge in every fan&apos;s pocket.
        </h2>
        <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
          Ask in ten supported languages and get grounded venue answers with
          clear safety boundaries.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {["EN", "ES", "FR", "AR", "PT", "JP", "ZH", "DE"].map((language) => (
            <span
              className="rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground"
              key={language}
            >
              {language}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-3 rounded-xl border border-border bg-background/75 p-4">
        <div className="rounded-xl border border-border p-4 text-sm">
          Where&apos;s the least-crowded route to my section?
        </div>
        <div className="ml-6 rounded-xl bg-muted p-4 text-sm leading-6 text-muted-foreground">
          I&apos;ll compare current demo zones and keep step-free needs in the
          route. For urgent help, contact on-site staff.
        </div>
        <div className="rounded-xl border border-border p-4 text-sm">
          ¿Dónde está la entrada accesible?
        </div>
      </div>
    </section>
  );
}

function FinalCallToAction(): JSX.Element {
  return (
    <section className="flex flex-col gap-6 border-t border-border py-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-primary">
          Ready for kickoff
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-black sm:text-4xl">
          See crowd context change routes, incidents, and briefings.
        </h2>
      </div>
      <Link
        className="brand-gradient-surface inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 font-extrabold"
        to="/demo"
      >
        Run the seven-workflow demo{" "}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}

/** Landing page with an evaluator-ready path into the connected demonstration. */
export default function HomePage(): JSX.Element {
  return (
    <AppShell flush>
      <div className="grid gap-24 py-16 md:gap-28 md:py-20">
        <HeroSection />
        <RoleSection />
        <HighlightSection />
        <ConciergeSection />
        <FinalCallToAction />
      </div>
    </AppShell>
  );
}
