import { lazy, Suspense, useContext, useRef } from "react";
import {
  ArrowRight,
  CalendarDays,
  Map,
  MessageSquare,
  Radio,
  ShieldCheck,
  Train,
} from "lucide-react";
import { Link } from "react-router-dom";

import { ConciergeChat } from "@/components/concierge";
import { AppShell, AtmosphericPanel } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageContext } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useMatches } from "@/hooks/useMatches";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { apiRequest } from "@/services/apiClient";
import type { ChatRequest, ChatResponse } from "@/types/api";

const StadiumScene = lazy(() => import("@/components/visuals/StadiumScene"));

const quickActions = [
  {
    label: "Ask the Concierge",
    description: "Get multilingual answers about gates, seats, and amenities.",
    href: "/concierge",
    icon: MessageSquare,
  },
  {
    label: "Find My Way",
    description: "Plan a route around live crowd density and access needs.",
    href: "/wayfinding",
    icon: Map,
  },
  {
    label: "Travel Options",
    description: "Compare lower-congestion transit and shared arrival choices.",
    href: "/travel",
    icon: Train,
  },
] as const;

function formatMatchDate(value: string): string {
  if (!value) {
    return "Schedule time to be confirmed";
  }
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** Fan landing page with quick actions and the next public match. */
export default function HomePage(): JSX.Element {
  const { matches, loading } = useMatches();
  const { user } = useAuth();
  const reducedMotion = useReducedMotionSafe();
  const language = useContext(LanguageContext)?.language ?? "en";
  const sessionId = useRef<string>();
  const nextMatch = matches[0];

  return (
    <AppShell>
      <div className="grid gap-10 lg:gap-14">
        <AtmosphericPanel
          className="lg:min-h-[31rem]"
          contentClassName="px-5 py-7 md:px-8 md:py-10 lg:grid lg:grid-cols-[1.02fr_.98fr] lg:items-center"
          intensity="strong"
        >
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-md border border-current/40 bg-background/30 px-3 py-1.5 text-xs font-black uppercase text-foreground">
              <Radio aria-hidden="true" className="size-3.5" /> Live venue
              intelligence
            </p>
            <h1 className="font-display text-5xl font-black uppercase leading-none text-foreground sm:text-6xl lg:text-7xl">
              Your match day,{" "}
              <span className="text-secondary">without the guesswork.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Find accessible routes, avoid crowd pressure, and get trusted
              answers in your language - from arrival to the final whistle.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-12 items-center gap-2 rounded-md border border-border bg-primary px-5 font-black uppercase text-primary-foreground shadow-[5px_5px_0_var(--secondary)]"
                to="/wayfinding"
              >
                Plan my route{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center gap-2 rounded-md border border-border bg-background/40 px-5 font-black uppercase text-foreground backdrop-blur-xl"
                to="/concierge"
              >
                Ask the concierge
              </Link>
              <Link
                className="inline-flex min-h-12 items-center gap-2 rounded-md border border-accent/60 bg-accent/15 px-5 font-black uppercase text-foreground backdrop-blur-xl"
                to="/demo"
              >
                Explore the FIFA 2026 demo
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck
                  aria-hidden="true"
                  className="size-4 text-primary"
                />{" "}
                Accessible by design
              </span>
              <span className="inline-flex items-center gap-2">
                <Radio aria-hidden="true" className="size-4 text-accent" /> Live
                operational signals
              </span>
            </div>
          </div>
          <div className="relative mt-8 min-h-72 lg:mt-0">
            {reducedMotion ? (
              <div className="grid h-full min-h-72 place-content-center rounded-lg border border-border bg-background/40 p-8 text-center text-foreground backdrop-blur-xl">
                <Map
                  aria-hidden="true"
                  className="mx-auto size-16 text-primary"
                />
                <p className="mt-4 max-w-xs font-semibold">
                  A calmer, clearer route through every part of the venue.
                </p>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="h-full min-h-72 animate-pulse rounded-lg bg-background/20" />
                }
              >
                <StadiumScene />
              </Suspense>
            )}
          </div>
        </AtmosphericPanel>

        <section aria-labelledby="quick-actions-heading" className="grid gap-4">
          <h2
            className="font-display text-3xl font-black uppercase text-foreground"
            id="quick-actions-heading"
          >
            Match-Day Tools
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  className="group rounded-lg border border-border bg-card/92 p-5 shadow-[7px_7px_0_rgb(0_0_0/0.16)] transition hover:-translate-y-1 hover:bg-foreground hover:text-background focus-visible:ring-3 focus-visible:ring-ring/50 dark:shadow-[7px_7px_0_rgb(247_243_232/0.08)]"
                  key={action.href}
                  to={action.href}
                >
                  <span className="grid size-11 place-content-center rounded-md border border-border bg-primary text-primary-foreground group-hover:border-background">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="mt-4 block font-black uppercase text-foreground group-hover:text-background">
                    {action.label}{" "}
                    <ArrowRight
                      aria-hidden="true"
                      className="ml-1 inline size-4 transition group-hover:translate-x-1"
                    />
                  </span>
                  <span className="mt-2 block text-sm text-muted-foreground group-hover:text-background/75">
                    {action.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="match-heading"
          className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)]"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" id="match-heading">
                <CalendarDays aria-hidden="true" className="size-5" />
                Today's Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && (
                <p className="text-sm text-accent" role="status">
                  Loading match schedule...
                </p>
              )}
              {!loading && nextMatch && (
                <div className="grid gap-2">
                  <p className="font-semibold text-foreground">
                    {nextMatch.homeTeam} vs. {nextMatch.awayTeam}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Next scheduled kickoff:{" "}
                    {formatMatchDate(nextMatch.kickoffAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Transit load estimate: {nextMatch.transitLoadEstimate}
                  </p>
                </div>
              )}
              {!loading && !nextMatch && (
                <p className="text-sm text-muted-foreground">
                  No live match is scheduled. The next scheduled match date will
                  appear here once the public schedule is seeded.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Concierge Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <ConciergeChat
                  initialMessages={[
                    {
                      id: "home-welcome",
                      role: "assistant",
                      text: "Need a fast answer? Open the concierge for full chat history.",
                    },
                  ]}
                  onSendMessage={async (message) => {
                    const response = await apiRequest<
                      ChatResponse,
                      ChatRequest
                    >("/api/concierge/chat", {
                      method: "POST",
                      body: { sessionId: sessionId.current, message, language },
                    });
                    sessionId.current = response.sessionId;
                    return response.reply;
                  }}
                />
              ) : (
                <div className="grid gap-4 rounded-lg border border-border bg-muted p-5">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Sign in to start a private concierge conversation and keep
                    your accessibility preferences in sync.
                  </p>
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 font-black uppercase text-primary"
                    to="/login"
                  >
                    Sign in to ask{" "}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
