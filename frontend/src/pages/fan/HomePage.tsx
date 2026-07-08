import { CalendarDays, Map, MessageSquare, Train } from "lucide-react";
import { Link } from "react-router-dom";

import { ConciergeChat } from "@/components/concierge";
import { AppShell } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMatches } from "@/hooks/useMatches";

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
  const nextMatch = matches[0];

  return (
    <AppShell>
      <div className="grid gap-8">
        <section className="grid gap-3">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary-text">
            Fan Experience PWA
          </p>
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
            StadiumPulse
          </h1>
          <p className="max-w-3xl text-lg text-muted-foreground">
            The live intelligence layer for match-day operations and fan
            experience.
          </p>
        </section>

        <section aria-labelledby="quick-actions-heading" className="grid gap-4">
          <h2
            className="font-display text-2xl font-bold text-foreground"
            id="quick-actions-heading"
          >
            Match-Day Tools
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  className="rounded-lg border border-border bg-card p-4 transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  key={action.href}
                  to={action.href}
                >
                  <Icon aria-hidden="true" className="size-6 text-accent" />
                  <span className="mt-4 block font-semibold text-foreground">
                    {action.label}
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
              <ConciergeChat
                initialMessages={[
                  {
                    id: "home-welcome",
                    role: "assistant",
                    text: "Need a fast answer? Open the concierge for full chat history.",
                  },
                ]}
                onSendMessage={() =>
                  Promise.resolve(
                    "Open Ask StadiumPulse for the full multilingual concierge.",
                  )
                }
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
