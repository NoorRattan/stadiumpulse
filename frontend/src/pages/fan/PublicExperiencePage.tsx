import { RefreshCw, Sparkles } from "lucide-react";

import { AppShell, PageHero } from "@/components/layout";
import { usePublicExperience } from "@/hooks/useExperience";
import { PublicExperienceContent } from "@/pages/fan/PublicExperienceSections";

export type PublicExperienceSection =
  | "matches"
  | "venues"
  | "accessibility"
  | "amenities"
  | "events"
  | "sustainability"
  | "alerts"
  | "help";

const sectionCopy = {
  matches: [
    "Schedule and official ticket handoff",
    "Matches & Tickets",
    "Follow the synthetic schedule and continue to FIFA's official ticketing channel for availability or purchases.",
  ],
  venues: [
    "Stadium finder",
    "Venues, Gates & Seating",
    "Compare venue locations, capacities, gate groups, seating areas, and accessible facilities before match day.",
  ],
  accessibility: [
    "Accessibility hub",
    "Plan Around Your Needs",
    "Find step-free gates, sensory-friendly facilities, assistive services, and personalized route tools in one place.",
  ],
  amenities: [
    "Inside the venue",
    "Food, Retail & Amenities",
    "Find food, tournament retail, medical help, accessible restrooms, and guest services by venue zone.",
  ],
  events: [
    "Beyond the match",
    "Fan Zones & Events",
    "Explore a curated synthetic programme of fan activities, accessible previews, and sustainability experiences.",
  ],
  sustainability: [
    "Public sustainability dashboard",
    "A Lower-Impact Match Day",
    "See simulated transport, energy, refill, and waste indicators and turn them into practical fan choices.",
  ],
  alerts: [
    "Safety notices",
    "Alerts That Explain What to Do",
    "Review current synthetic advisories with a clear zone, severity, timestamp, and recommended fan response.",
  ],
  help: [
    "Help center",
    "Questions, Answered Clearly",
    "Get direct answers about tickets, accessibility, safety, language support, routes, and urgent help.",
  ],
} satisfies Record<PublicExperienceSection, readonly [string, string, string]>;

function RequestState({
  error,
  loading,
  retry,
}: {
  error: string | null;
  loading: boolean;
  retry: () => Promise<void>;
}): JSX.Element | null {
  if (loading)
    return (
      <p className="rounded-xl border border-border bg-card p-5" role="status">
        Loading match-day information…
      </p>
    );
  if (!error) return null;
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive/40 bg-destructive/10 p-5"
      role="alert"
    >
      <p>{error}</p>
      <button
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 font-bold"
        onClick={() => void retry()}
        type="button"
      >
        <RefreshCw aria-hidden="true" className="size-4" />
        Retry
      </button>
    </div>
  );
}

/** Route-specific public information pages backed by one experience API. */
export default function PublicExperiencePage({
  section,
}: {
  section: PublicExperienceSection;
}): JSX.Element {
  const { data, error, loading, refresh } = usePublicExperience();
  const [badge, title, description] = sectionCopy[section];
  const badgeContent = (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
      <Sparkles aria-hidden="true" className="size-4" />
      {badge}
    </span>
  );
  const meta = (
    <span>
      Data status: <strong>curated and simulated</strong>
    </span>
  );
  return (
    <AppShell shader="subtle">
      <div className="grid gap-10">
        <PageHero
          badge={badgeContent}
          description={description}
          meta={meta}
          title={title}
        />
        <RequestState error={error} loading={loading} retry={refresh} />
        {data && <PublicExperienceContent data={data} section={section} />}
      </div>
    </AppShell>
  );
}
