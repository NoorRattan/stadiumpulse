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

const roles = [
  {
    eyebrow: "MATCH DAY, EFFORTLESS",
    title: "Fans",
    href: "/fan",
    color: "primary",
    features: [
      "Tickets & QR gates",
      "Crowd-aware navigation",
      "Transport & parking",
      "Multilingual PulseAI",
    ],
  },
  {
    eyebrow: "SHIFT-READY",
    title: "Volunteers",
    href: "/volunteer",
    color: "secondary",
    features: [
      "Assigned zones & tasks",
      "Training modules",
      "Real-time guidance",
      "Live comms",
    ],
  },
  {
    eyebrow: "OPERATE SAFELY",
    title: "Venue Staff",
    href: "/staff",
    color: "accent",
    features: [
      "Crowd monitoring",
      "Incident triage",
      "Medical / security / cleaning",
      "Ops coordination",
    ],
  },
  {
    eyebrow: "COMMAND CENTER",
    title: "Organizers",
    href: "/organizer",
    color: "violet",
    features: [
      "Predictive crowd insights",
      "AI briefings",
      "Sustainability KPIs",
      "Real-time decisions",
    ],
  },
] as const;

const highlights = [
  {
    icon: Bot,
    title: "Multilingual GenAI Concierge",
    body: "Groq-powered natural chat across 10 supported languages. Ask about tickets, gates, parking, food, or accessibility — instantly.",
  },
  {
    icon: RadioTower,
    title: "Predictive Crowd Intelligence",
    body: "Live density, arrival curves, and gate throughput become forecasts operators can review before pressure turns into an incident.",
  },
  {
    icon: MapPinned,
    title: "Crowd-Aware Navigation",
    body: "The shortest route is not always the calmest. StadiumPulse compares congestion and accessibility before guiding each fan.",
  },
  {
    icon: ShieldCheck,
    title: "Unified Incident Ops",
    body: "Security, medical, and cleaning teams share one incident picture with approval-gated drafts and shift briefings.",
  },
  {
    icon: Bus,
    title: "Transport & Parking Sync",
    body: "Fans compare lower-congestion arrivals while operations teams see the same match and transit-load context.",
  },
  {
    icon: Leaf,
    title: "Sustainability Signal",
    body: "Shared transport, refill, waste, and energy indicators remain visible to fans and organizer teams.",
  },
] as const;

function NetworkGlobe(): JSX.Element {
  return (
    <div className="pulse-network relative aspect-square overflow-hidden rounded-2xl border border-border bg-card/55 p-5 shadow-[var(--shadow-card)] sm:p-7">
      <div className="flex justify-between font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
        <span>· Network · WC26</span>
        <span className="text-primary">◆ Live 16 venues</span>
      </div>
      <svg
        aria-label="Connected host-city network illustration"
        className="mx-auto mt-2 h-[78%] w-[92%]"
        fill="none"
        role="img"
        viewBox="0 0 520 420"
      >
        <defs>
          <linearGradient id="globe-stroke" x1="0" x2="1">
            <stop stopColor="var(--brand-cyan)" />
            <stop offset="0.62" stopColor="var(--brand-magenta)" />
            <stop offset="1" stopColor="var(--brand-amber)" />
          </linearGradient>
          <radialGradient id="globe-fill">
            <stop stopColor="var(--glow-primary)" />
            <stop offset="1" stopColor="transparent" />
          </radialGradient>
        </defs>
        <ellipse cx="260" cy="214" fill="url(#globe-fill)" rx="185" ry="174" />
        <circle
          cx="260"
          cy="214"
          r="164"
          stroke="var(--border-bright)"
          strokeWidth="1.5"
        />
        {[42, 78, 116, 146].map((radius) => (
          <ellipse
            cx="260"
            cy="214"
            key={radius}
            rx={radius}
            ry="164"
            stroke="var(--border-bright)"
            strokeOpacity=".8"
          />
        ))}
        {[-112, -72, -34, 0, 34, 72, 112].map((offset) => (
          <ellipse
            cx="260"
            cy={214 + offset / 3}
            key={offset}
            rx={Math.sqrt(Math.max(1, 164 ** 2 - offset ** 2))}
            ry={34 + Math.abs(offset) / 6}
            stroke="var(--border-bright)"
            strokeOpacity=".8"
          />
        ))}
        <ellipse
          cx="260"
          cy="214"
          rx="242"
          ry="48"
          stroke="url(#globe-stroke)"
          strokeWidth="2"
          transform="rotate(7 260 214)"
        />
        <ellipse
          cx="260"
          cy="214"
          rx="226"
          ry="70"
          stroke="var(--brand-magenta)"
          strokeOpacity=".65"
          transform="rotate(-16 260 214)"
        />
        {["98 239", "177 92", "337 104", "418 226", "291 370"].map(
          (position) => {
            const [cx, cy] = position.split(" ").map(Number);
            return (
              <circle
                cx={cx}
                cy={cy}
                fill="var(--brand-magenta)"
                key={position}
                r="5"
              />
            );
          },
        )}
      </svg>
      <div className="flex justify-between font-mono text-[0.55rem] uppercase tracking-[0.16em] text-muted-foreground">
        <span>Lat 40.81 · Lng -74.07</span>
        <span>Pulse-ok ▮▮▮▮▮▮▮▯▯</span>
      </div>
    </div>
  );
}

/** Reference-faithful StadiumPulse landing page. */
export default function HomePage(): JSX.Element {
  return (
    <AppShell flush>
      <div className="grid gap-24 py-16 md:gap-28 md:py-20">
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
              StadiumPulse is the GenAI-powered match-day intelligence platform
              for World Cup 2026 venues. Fans navigate with confidence.
              Volunteers, staff, and organizers run venues safely, accessibly,
              efficiently.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="brand-gradient-surface inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-extrabold shadow-[0_0_28px_var(--glow-primary)]"
                to="/fan"
              >
                Enter as Fan{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border-bright)] bg-card/50 px-6 font-bold hover:border-primary/60"
                to="/organizer"
              >
                Open Command Center
              </Link>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              {[
                ["16", "Host Cities"],
                ["104", "Matches"],
                ["3.7M+", "Fans"],
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
          <NetworkGlobe />
        </section>

        <section aria-labelledby="roles-heading">
          <p className="cockpit-kicker w-fit text-secondary">
            <CircleDot aria-hidden="true" className="size-3" /> Built for four
            match-day tribes
          </p>
          <h2
            className="mt-5 font-display text-4xl font-black tracking-tight sm:text-5xl"
            id="roles-heading"
          >
            One platform. Four missions.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Each role gets a purpose-built cockpit — fed by the same real-time
            venue nervous system.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {roles.map((role, index) => (
              <Link
                className="group rounded-xl border border-border bg-card/75 p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-card)]"
                key={role.href}
                to={role.href}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-primary">
                    {role.eyebrow}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-7 font-display text-2xl font-extrabold">
                  {role.title}
                </h3>
                <ul className="mt-5 grid gap-3 text-sm text-muted-foreground">
                  {role.features.map((feature) => (
                    <li className="flex items-start gap-2" key={feature}>
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-foreground group-hover:text-primary">
                  Open cockpit{" "}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="stack-heading">
          <p className="cockpit-kicker w-fit text-primary">
            <Sparkles aria-hidden="true" className="size-3" /> Stack highlights
          </p>
          <h2
            className="mt-5 max-w-3xl font-display text-4xl font-black tracking-tight sm:text-5xl"
            id="stack-heading"
          >
            Real-time intelligence, from gate to grid.
          </h2>
          <div className="mt-9 grid overflow-hidden rounded-xl border border-border bg-card/65 md:grid-cols-2 lg:grid-cols-3">
            {highlights.map(({ icon: Icon, title, body }) => (
              <article
                className="border-b border-r border-border p-6"
                key={title}
              >
                <Icon aria-hidden="true" className="size-5 text-primary" />
                <h3 className="mt-5 font-display text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="pulse-beam grid gap-8 rounded-2xl p-6 sm:p-9 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-primary">
              PulseAI · Groq-powered
            </p>
            <h2 className="mt-4 max-w-xl font-display text-3xl font-black sm:text-4xl">
              A multilingual concierge in every fan&apos;s pocket.
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
              Ask in Spanish, English, French, Arabic, Portuguese, Japanese,
              Chinese, German, Hindi, or Korean — get grounded answers backed by
              venue data and clear safety boundaries.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["EN", "ES", "FR", "AR", "PT", "JP", "ZH", "DE"].map(
                (language) => (
                  <span
                    className="rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground"
                    key={language}
                  >
                    {language}
                  </span>
                ),
              )}
            </div>
          </div>
          <div className="grid gap-3 rounded-xl border border-border bg-background/75 p-4">
            <div className="rounded-xl border border-border p-4 text-sm">
              Where&apos;s the least-crowded route to my section?
            </div>
            <div className="ml-6 rounded-xl bg-muted p-4 text-sm leading-6 text-muted-foreground">
              I&apos;ll compare the current demo zones and keep step-free needs
              in the route. For urgent help, contact on-site staff.
            </div>
            <div className="rounded-xl border border-border p-4 text-sm">
              ¿Dónde está la entrada accesible?
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6 border-t border-border py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-primary">
              Ready for kickoff
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-black sm:text-4xl">
              Turn 16 host cities into one intelligent network.
            </h2>
          </div>
          <Link
            className="brand-gradient-surface inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 font-extrabold"
            to="/organizer"
          >
            Explore Command Center
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
