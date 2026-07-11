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
import { AppShell } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMatches } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { LanguageContext } from "@/contexts/LanguageContext";
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
      <div className="grid gap-12 lg:gap-16">
        <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-8 shadow-2xl shadow-primary/5 md:px-10 md:py-12 lg:grid lg:min-h-[31rem] lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <Radio aria-hidden="true" className="size-3.5" /> Live venue
              intelligence
            </p>
            <h1 className="font-display text-5xl font-black leading-[.96] tracking-[-0.055em] text-foreground sm:text-6xl lg:text-7xl">
              Your match day,{" "}
              <span className="text-primary">without the guesswork.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Find accessible routes, avoid crowd pressure, and get trusted
              answers in your language—from arrival to the final whistle.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 font-bold text-primary-foreground"
                to="/wayfinding"
              >
                Plan my route{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-background px-5 font-bold"
                to="/concierge"
              >
                Ask the concierge
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
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
              <div className="grid h-full min-h-72 place-content-center rounded-3xl bg-[linear-gradient(135deg,var(--muted),transparent)] p-8 text-center">
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
                  <div className="h-full min-h-72 animate-pulse rounded-3xl bg-muted" />
                }
              >
                <StadiumScene />
              </Suspense>
            )}
          </div>
        </section>

        <section aria-labelledby="quick-actions-heading" className="grid gap-4">
          <h2
            className="font-display text-3xl font-black tracking-tight text-foreground"
            id="quick-actions-heading"
          >
            Match-Day Tools
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  className="group rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary/45 hover:shadow-xl hover:shadow-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50"
                  key={action.href}
                  to={action.href}
                >
                  <span className="grid size-11 place-content-center rounded-2xl bg-primary/12 text-primary">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="mt-4 block font-semibold text-foreground">
                    {action.label}{" "}
                    <ArrowRight
                      aria-hidden="true"
                      className="ml-1 inline size-4 transition group-hover:translate-x-1"
                    />
                  </span>
                  <span className="mt-2 block text-sm text-muted-foreground">
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
                <div className="grid gap-4 rounded-2xl bg-muted p-5">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Sign in to start a private concierge conversation and keep
                    your accessibility preferences in sync.
                  </p>
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 font-bold text-primary"
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
