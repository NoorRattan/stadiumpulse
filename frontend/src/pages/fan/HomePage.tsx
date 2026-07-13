import {
  Accessibility,
  ArrowRight,
  BotMessageSquare,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Languages,
  Leaf,
  Map,
  Radio,
  ShieldCheck,
  Sparkles,
  Train,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AppShell } from "@/components/layout";
import { FadeInView } from "@/components/motion/FadeInView";
import { useMatches } from "@/hooks/useMatches";

const fanJourneys = [
  {
    label: "Find my way",
    description:
      "Choose your gate or seat and get a calmer route with step-free preferences.",
    href: "/wayfinding",
    action: "Plan a route",
    icon: Map,
  },
  {
    label: "Ask StadiumPulse",
    description:
      "Get venue answers in your language by text or voice, with read-aloud replies.",
    href: "/concierge",
    action: "Ask for help",
    icon: BotMessageSquare,
  },
  {
    label: "Plan my arrival",
    description:
      "Compare rail, shuttle, and shared travel around match-day congestion.",
    href: "/travel",
    action: "View travel options",
    icon: Train,
  },
] as const;

const systemSteps = [
  {
    label: "Sense",
    detail: "Synthetic crowd readings update six venue zones.",
    icon: Radio,
  },
  {
    label: "Reason",
    detail: "Deterministic rules calculate routes, bands, and forecasts.",
    icon: ShieldCheck,
  },
  {
    label: "Explain",
    detail: "GenAI translates the result into useful, multilingual guidance.",
    icon: Languages,
  },
  {
    label: "Approve",
    detail:
      "Staff make every operational decision; the system never acts alone.",
    icon: Users,
  },
] as const;

function formatMatchDate(value: string): string {
  if (!value) return "Schedule time to be confirmed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Schedule time to be confirmed";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Task-first fan landing page that explains and demonstrates the connected match-day system. */
export default function HomePage(): JSX.Element {
  const { matches, loading } = useMatches();
  const nextMatch = matches[0];

  return (
    <AppShell shader="vivid">
      <div className="grid gap-16 md:gap-24">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card px-5 py-8 shadow-[0_24px_90px_rgb(0_0_0/0.12)] sm:px-8 sm:py-12 lg:grid lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:gap-12 lg:px-12 lg:py-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,var(--glow-primary),transparent_45%)]"
          />
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              <span className="size-2 rounded-full bg-primary" />
              FIFA World Cup 2026 · Connected demo
            </p>
            <h1 className="mt-6 max-w-3xl font-display text-[clamp(2.7rem,8vw,6.4rem)] font-bold leading-[0.94] tracking-[-0.055em] text-foreground">
              Know where to go.{" "}
              <span className="text-gradient">Before the crowd does.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              StadiumPulse turns one shared venue signal into calmer fan routes,
              multilingual help, smarter arrivals, and human-reviewed
              operations.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-[0_12px_32px_var(--glow-primary)] transition-transform hover:-translate-y-0.5"
                to="/demo"
              >
                <Sparkles aria-hidden="true" className="size-4" />
                Explore the live demo
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-6 font-bold text-foreground transition-colors hover:bg-muted"
                to="/wayfinding"
              >
                Plan my route
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-primary"
              />
              No account needed for the read-only demo. All scenario data is
              clearly labelled synthetic.
            </p>
          </div>

          <div className="relative z-10 mt-10 lg:mt-0">
            <div className="rounded-2xl border border-border bg-background/80 p-4 shadow-xl backdrop-blur-xl sm:p-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Demo scenario
                  </p>
                  <p className="mt-1 font-display text-xl font-bold">
                    Venue pulse
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <span className="size-2 rounded-full bg-primary" /> Ready
                </span>
              </div>
              <dl className="grid gap-3 py-4">
                <div className="flex items-center justify-between gap-4 rounded-xl bg-muted p-3">
                  <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Radio aria-hidden="true" className="size-4" /> Crowd view
                  </dt>
                  <dd className="text-sm font-bold text-foreground">
                    6 selectable zones
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-muted p-3">
                  <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Accessibility aria-hidden="true" className="size-4" />{" "}
                    Route mode
                  </dt>
                  <dd className="text-sm font-bold text-foreground">
                    Step-free aware
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-muted p-3">
                  <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 aria-hidden="true" className="size-4" /> Forecast
                  </dt>
                  <dd className="text-sm font-bold text-foreground">
                    15-minute window
                  </dd>
                </div>
              </dl>
              <Link
                className="flex min-h-11 items-center justify-between rounded-xl border border-border px-4 text-sm font-bold text-foreground transition-colors hover:bg-muted"
                to="/demo"
              >
                See the whole match-day story
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 text-primary"
                />
              </Link>
            </div>
          </div>
        </section>

        <FadeInView>
          <section aria-labelledby="start-heading">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Start with what you need
              </p>
              <h2
                className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl"
                id="start-heading"
              >
                Three match-day tasks. One shared picture.
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                No dashboard training. Choose a task and StadiumPulse uses the
                same venue context throughout your journey.
              </p>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {fanJourneys.map((journey, index) => {
                const Icon = journey.icon;
                return (
                  <Link
                    className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl sm:p-6"
                    key={journey.href}
                    to={journey.href}
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid size-11 place-content-center rounded-xl bg-primary/10 text-primary">
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-6 font-display text-xl font-bold">
                      {journey.label}
                    </h3>
                    <p className="mt-2 min-h-20 text-sm leading-6 text-muted-foreground">
                      {journey.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">
                      {journey.action}
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </FadeInView>

        <FadeInView>
          <section
            aria-labelledby="match-heading"
            className="grid overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-[.8fr_1.2fr]"
          >
            <div className="bg-foreground p-6 text-background sm:p-8 lg:p-10">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-background/75">
                <CalendarDays aria-hidden="true" className="size-4" /> Next
                scenario match
              </p>
              {loading ? (
                <p className="mt-8" role="status">
                  Loading match schedule…
                </p>
              ) : nextMatch ? (
                <div className="mt-8">
                  <h2
                    className="font-display text-3xl font-bold sm:text-4xl"
                    id="match-heading"
                  >
                    {nextMatch.homeTeam}
                    <span className="my-2 block text-lg font-medium text-background/70">
                      vs.
                    </span>
                    {nextMatch.awayTeam}
                  </h2>
                  <p className="mt-6 border-t border-background/20 pt-5 text-sm leading-6 text-background/80">
                    {formatMatchDate(nextMatch.kickoffAt)}
                  </p>
                  <p className="mt-2 text-sm text-background/80">
                    Transit load:{" "}
                    <span className="font-bold capitalize text-background">
                      {nextMatch.transitLoadEstimate}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="mt-8">
                  <h2
                    className="font-display text-3xl font-bold"
                    id="match-heading"
                  >
                    Match schedule pending
                  </h2>
                  <p className="mt-3 text-background/80">
                    The tools remain available for the synthetic demo scenario.
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                One signal, four safeguards
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold">
                Useful AI without handing it the keys.
              </h2>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                {systemSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div className="flex gap-3" key={step.label}>
                      <span className="grid size-10 shrink-0 place-content-center rounded-xl bg-accent/10 text-accent">
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <div>
                        <h3 className="font-bold">{step.label}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </FadeInView>

        <FadeInView>
          <section
            aria-labelledby="roles-heading"
            className="grid gap-5 lg:grid-cols-2"
          >
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <span className="grid size-11 place-content-center rounded-xl bg-primary/10 text-primary">
                <Leaf aria-hidden="true" className="size-5" />
              </span>
              <h2
                className="mt-5 font-display text-2xl font-bold"
                id="roles-heading"
              >
                For fans
              </h2>
              <p className="mt-2 leading-7 text-muted-foreground">
                Route, language, accessibility, and arrival guidance stay in one
                calm experience instead of four disconnected tools.
              </p>
              <Link
                className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-primary"
                to="/wayfinding"
              >
                Plan a route{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <span className="grid size-11 place-content-center rounded-xl bg-accent/10 text-accent">
                <Users aria-hidden="true" className="size-5" />
              </span>
              <h2 className="mt-5 font-display text-2xl font-bold">
                For venue teams
              </h2>
              <p className="mt-2 leading-7 text-muted-foreground">
                Role-protected staff tools turn the same signals into forecasts,
                incident drafts, and briefings that require human approval.
              </p>
              <Link
                className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-accent"
                to="/login"
              >
                Staff sign in{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </section>
        </FadeInView>
      </div>
    </AppShell>
  );
}
