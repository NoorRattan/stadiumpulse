import {
  Accessibility,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CircleHelp,
  Leaf,
  MapPinned,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Utensils,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AppShell, PageHero } from "@/components/layout";
import { usePublicExperience } from "@/hooks/useExperience";
import type { AmenityInfo } from "@/types/api";

export type PublicExperienceSection =
  | "matches"
  | "venues"
  | "accessibility"
  | "amenities"
  | "events"
  | "sustainability"
  | "alerts"
  | "help";

const sectionCopy: Record<
  PublicExperienceSection,
  { badge: string; title: string; description: string }
> = {
  matches: {
    badge: "Schedule and official ticket handoff",
    title: "Matches & Tickets",
    description:
      "Follow the synthetic StadiumPulse schedule and continue to FIFA's official ticketing channel for real availability or purchases.",
  },
  venues: {
    badge: "Stadium finder",
    title: "Venues, Gates & Seating",
    description:
      "Compare venue locations, capacities, gate groups, seating areas, and accessible facilities before match day.",
  },
  accessibility: {
    badge: "Accessibility hub",
    title: "Plan Around Your Needs",
    description:
      "Find step-free gates, sensory-friendly facilities, assistive services, and personalized route tools in one place.",
  },
  amenities: {
    badge: "Inside the venue",
    title: "Food, Retail & Amenities",
    description:
      "Find food, tournament retail, medical help, accessible restrooms, and guest services by venue zone.",
  },
  events: {
    badge: "Beyond the match",
    title: "Fan Zones & Events",
    description:
      "Explore a curated synthetic programme of fan activities, accessible previews, and sustainability experiences.",
  },
  sustainability: {
    badge: "Public sustainability dashboard",
    title: "A Lower-Impact Match Day",
    description:
      "See simulated transport, energy, refill, and waste indicators and turn them into practical fan choices.",
  },
  alerts: {
    badge: "Safety notices",
    title: "Alerts That Explain What to Do",
    description:
      "Review current synthetic advisories with a clear zone, severity, timestamp, and recommended fan response.",
  },
  help: {
    badge: "Help center",
    title: "Questions, Answered Clearly",
    description:
      "Get direct answers about tickets, accessibility, safety, language support, routes, and urgent help.",
  },
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function amenityIcon(category: AmenityInfo["category"]): typeof Utensils {
  if (category === "food") return Utensils;
  if (category === "retail") return ShoppingBag;
  if (category === "medical") return AlertTriangle;
  return Accessibility;
}

/** Route-specific public information pages backed by one consistent experience API. */
export default function PublicExperiencePage({
  section,
}: {
  section: PublicExperienceSection;
}): JSX.Element {
  const { data, error, loading, refresh } = usePublicExperience();
  const copy = sectionCopy[section];

  return (
    <AppShell shader="subtle">
      <div className="grid gap-10">
        <PageHero
          badge={
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              <Sparkles aria-hidden="true" className="size-4" />
              {copy.badge}
            </span>
          }
          description={copy.description}
          meta={
            <span>
              Data status: <strong>curated and simulated</strong>
            </span>
          }
          title={copy.title}
        />

        {loading && (
          <p
            className="rounded-xl border border-border bg-card p-5"
            role="status"
          >
            Loading match-day information…
          </p>
        )}
        {error && (
          <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive/40 bg-destructive/10 p-5"
            role="alert"
          >
            <p>{error}</p>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 font-bold"
              onClick={() => void refresh()}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="size-4" /> Retry
            </button>
          </div>
        )}

        {data && section === "matches" && (
          <section aria-label="Match schedule" className="grid gap-5">
            <div className="rounded-2xl border border-accent/35 bg-accent/8 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
              <div>
                <h2 className="font-display text-2xl font-bold">
                  Buy only through official FIFA ticketing
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  StadiumPulse never sells or issues tickets. Availability,
                  categories, payment, resale, and entry terms belong to FIFA.
                </p>
              </div>
              <a
                className="mt-4 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-accent px-5 font-bold text-accent-foreground sm:mt-0"
                href={data.officialTicketUrl}
                rel="noreferrer"
                target="_blank"
              >
                Official FIFA tickets
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {data.matches.map((match) => (
                <article
                  className="rounded-2xl border border-border bg-card p-5"
                  key={match.matchId}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">
                      {match.status}
                    </span>
                    {match.score && (
                      <span className="font-mono text-lg font-bold">
                        {match.score}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-5 font-display text-2xl font-bold">
                    {match.homeTeam}{" "}
                    <span className="text-muted-foreground">vs</span>{" "}
                    {match.awayTeam}
                  </h2>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {formatDate(match.kickoffAt)}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {match.venueName}
                  </p>
                  <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                    {match.ticketStatus}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {data && section === "venues" && (
          <section aria-label="Tournament venues" className="grid gap-5">
            <div className="grid gap-5 lg:grid-cols-3">
              {data.venues.map((venue) => (
                <article
                  className="rounded-2xl border border-border bg-card p-6"
                  key={venue.venueId}
                >
                  <MapPinned
                    aria-hidden="true"
                    className="size-6 text-primary"
                  />
                  <h2 className="mt-5 font-display text-2xl font-bold">
                    {venue.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {venue.city}, {venue.country} ·{" "}
                    {venue.capacity.toLocaleString()} seats
                  </p>
                  <p className="mt-4 text-sm leading-6">
                    {venue.address} · {venue.mapLabel}
                  </p>
                  <h3 className="mt-5 font-bold">Gates</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {venue.gates.join(" · ")}
                  </p>
                  <h3 className="mt-4 font-bold">Seating</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {venue.seatingHighlights.join(" · ")}
                  </p>
                </article>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                className="rounded-2xl border border-primary/35 bg-primary/8 p-6 font-bold"
                to="/demo"
              >
                Open the interactive venue heatmap{" "}
                <ArrowRight aria-hidden="true" className="ml-2 inline size-4" />
              </Link>
              <Link
                className="rounded-2xl border border-accent/35 bg-accent/8 p-6 font-bold"
                to="/wayfinding"
              >
                Search gates, seats, and accessible routes{" "}
                <ArrowRight aria-hidden="true" className="ml-2 inline size-4" />
              </Link>
            </div>
          </section>
        )}

        {data && section === "accessibility" && (
          <section className="grid gap-5">
            <div className="grid gap-4 lg:grid-cols-3">
              {data.venues.map((venue) => (
                <article
                  className="rounded-2xl border border-border bg-card p-6"
                  key={venue.venueId}
                >
                  <Accessibility
                    aria-hidden="true"
                    className="size-6 text-primary"
                  />
                  <h2 className="mt-5 font-display text-xl font-bold">
                    {venue.name}
                  </h2>
                  <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    {venue.accessibilityFeatures.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                className="rounded-2xl border border-primary/35 bg-primary/8 p-6 font-bold"
                to="/wayfinding"
              >
                Build a personalized accessible route{" "}
                <ArrowRight aria-hidden="true" className="ml-2 inline size-4" />
              </Link>
              <Link
                className="rounded-2xl border border-accent/35 bg-accent/8 p-6 font-bold"
                to="/concierge"
              >
                Ask an accessibility question{" "}
                <ArrowRight aria-hidden="true" className="ml-2 inline size-4" />
              </Link>
            </div>
          </section>
        )}

        {data && section === "amenities" && (
          <section
            aria-label="Venue amenities"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {data.amenities.map((amenity) => {
              const Icon = amenityIcon(amenity.category);
              return (
                <article
                  className="rounded-2xl border border-border bg-card p-5"
                  key={amenity.amenityId}
                >
                  <Icon aria-hidden="true" className="size-6 text-accent" />
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {amenity.category} · {amenity.zone}
                  </p>
                  <h2 className="mt-2 font-display text-xl font-bold">
                    {amenity.name}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {amenity.openingNote}
                  </p>
                  <p className="mt-3 border-t border-border pt-3 text-sm leading-6">
                    {amenity.accessibilityNote}
                  </p>
                </article>
              );
            })}
          </section>
        )}

        {data && section === "events" && (
          <section
            aria-label="Fan events"
            className="grid gap-4 lg:grid-cols-3"
          >
            {data.fanEvents.map((event) => (
              <article
                className="rounded-2xl border border-border bg-card p-6"
                key={event.eventId}
              >
                <CalendarDays
                  aria-hidden="true"
                  className="size-6 text-primary"
                />
                <h2 className="mt-5 font-display text-xl font-bold">
                  {event.title}
                </h2>
                <p className="mt-2 text-sm font-semibold">
                  {formatDate(event.startsAt)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.location}
                </p>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {event.description}
                </p>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-primary">
                  {event.ticketRequired
                    ? "Ticket required"
                    : "No event ticket required"}
                </p>
              </article>
            ))}
          </section>
        )}

        {data && section === "sustainability" && (
          <section className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.sustainability.map((metric) => (
                <article
                  className="rounded-2xl border border-border bg-card p-5"
                  key={metric.metricId}
                >
                  <Leaf aria-hidden="true" className="size-6 text-primary" />
                  <p className="mt-5 font-display text-3xl font-bold">
                    {metric.value}
                  </p>
                  <h2 className="mt-2 font-bold">{metric.label}</h2>
                  <p className="mt-2 text-sm font-semibold text-primary">
                    {metric.trend}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    {metric.explanation}
                  </p>
                </article>
              ))}
            </div>
            <Link
              className="rounded-2xl border border-primary/35 bg-primary/8 p-6 font-bold"
              to="/travel"
            >
              Get lower-impact travel suggestions{" "}
              <ArrowRight aria-hidden="true" className="ml-2 inline size-4" />
            </Link>
          </section>
        )}

        {data && section === "alerts" && (
          <section aria-label="Current safety notices" className="grid gap-4">
            {data.alerts.map((alert) => (
              <article
                className="rounded-2xl border border-border bg-card p-5 sm:flex sm:items-start sm:gap-5"
                key={alert.alertId}
              >
                <AlertTriangle
                  aria-hidden="true"
                  className={
                    alert.severity === "urgent"
                      ? "size-6 text-destructive"
                      : "size-6 text-accent"
                  }
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {alert.severity} · {alert.zone} ·{" "}
                    {formatDate(alert.issuedAt)}
                  </p>
                  <h2 className="mt-2 font-display text-xl font-bold">
                    {alert.title}
                  </h2>
                  <p className="mt-2 leading-7 text-muted-foreground">
                    {alert.message}
                  </p>
                </div>
              </article>
            ))}
            <p className="rounded-xl border border-destructive/30 bg-destructive/8 p-4 text-sm">
              For an actual emergency, follow on-site staff instructions and
              contact local emergency services. StadiumPulse is not an emergency
              channel.
            </p>
          </section>
        )}

        {data && section === "help" && (
          <section
            aria-label="Frequently asked questions"
            className="grid gap-3"
          >
            {data.faq.map((entry) => (
              <details
                className="rounded-2xl border border-border bg-card p-5"
                key={entry.question}
              >
                <summary className="cursor-pointer font-bold">
                  <CircleHelp
                    aria-hidden="true"
                    className="mr-2 inline size-4 text-primary"
                  />
                  {entry.question}
                </summary>
                <p className="mt-4 max-w-4xl leading-7 text-muted-foreground">
                  {entry.answer}
                </p>
              </details>
            ))}
            <Link
              className="mt-4 inline-flex min-h-11 items-center gap-2 font-bold text-primary"
              to="/concierge"
            >
              Ask the multilingual concierge{" "}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </section>
        )}
      </div>
    </AppShell>
  );
}
