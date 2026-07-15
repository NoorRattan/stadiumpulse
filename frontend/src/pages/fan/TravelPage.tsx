import { useState } from "react";
import { ArrowRight, CarFront, Leaf, Train } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { AppShell, PageHero } from "@/components/layout";
import { FadeInView } from "@/components/motion/FadeInView";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMatches } from "@/hooks/useMatches";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { apiRequest } from "@/services/apiClient";
import type { TravelSuggestionsResponse } from "@/types/api";
import type { Match, TravelSuggestion } from "@/types/domain";

function ModeIcon({ mode }: { mode: string }): JSX.Element {
  if (mode.includes("rail") || mode.includes("transit"))
    return <Train aria-hidden="true" className="size-5" />;
  if (mode.includes("share") || mode.includes("car"))
    return <CarFront aria-hidden="true" className="size-5" />;
  return <Leaf aria-hidden="true" className="size-5" />;
}

function accentForMode(mode: string): string {
  const match = Object.entries({
    rail: "var(--brand-cyan)",
    transit: "var(--brand-cyan)",
    share: "var(--brand-amber)",
    car: "var(--brand-amber)",
  }).find(([key]) => mode.toLowerCase().includes(key));
  return match?.[1] ?? "var(--brand-magenta)";
}

function useTravelSuggestions() {
  const [matchId, setMatchId] = useState("");
  const [suggestions, setSuggestions] = useState<TravelSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    if (!matchId) {
      toast.error("Choose a match before loading travel suggestions.");
      return;
    }
    setLoading(true);
    try {
      const response = await apiRequest<TravelSuggestionsResponse>(
        `/api/travel/suggestions?matchId=${encodeURIComponent(matchId)}`,
      );
      setSuggestions(response.suggestions);
      toast.success("Travel suggestions loaded.");
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Travel suggestions could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  };
  return { load, loading, matchId, setMatchId, suggestions };
}

function TravelForm({
  load,
  loading,
  matchId,
  matches,
  matchesLoading,
  select,
}: {
  load: () => Promise<void>;
  loading: boolean;
  matchId: string;
  matches: Match[];
  matchesLoading: boolean;
  select: (value: string) => void;
}): JSX.Element {
  return (
    <FadeInView>
      <section
        aria-labelledby="travel-form-heading"
        className="border border-border p-6 md:p-8"
      >
        <h2
          className="font-display text-sm uppercase tracking-widest text-muted-foreground"
          id="travel-form-heading"
        >
          Match Selector
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="grid gap-1">
            <span
              className="text-xs uppercase tracking-widest text-muted-foreground"
              id="match-select-label"
            >
              Match
            </span>
            <Select onValueChange={select} value={matchId}>
              <SelectTrigger
                aria-labelledby="match-select-label"
                className="min-h-12 w-full rounded-none border-0 border-b border-input bg-transparent focus:border-primary"
              >
                <SelectValue
                  placeholder={
                    matchesLoading ? "Loading matches..." : "Select a match"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {matches.map((match) => (
                  <SelectItem key={match.matchId} value={match.matchId}>
                    {match.homeTeam} vs. {match.awayTeam}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            className="inline-flex min-h-12 items-center gap-2 bg-primary px-6 font-semibold text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
            disabled={matchesLoading || loading}
            onClick={() => void load()}
            type="button"
          >
            {loading ? "Loading..." : "Load suggestions"}
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </section>
    </FadeInView>
  );
}

function SuggestionCard({
  index,
  reducedMotion,
  suggestion,
}: {
  index: number;
  reducedMotion: boolean;
  suggestion: TravelSuggestion;
}): JSX.Element {
  const accent = accentForMode(suggestion.mode);
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-6 border-b border-border p-6 last:border-0">
        <span
          className="grid size-11 shrink-0 place-content-center border"
          style={{
            borderColor: `color-mix(in srgb, ${accent} 25%, transparent)`,
            color: accent,
          }}
        >
          <ModeIcon mode={suggestion.mode} />
        </span>
        <div>
          <p className="font-display text-lg font-bold">{suggestion.mode}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {suggestion.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function TravelResults({
  suggestions,
}: {
  suggestions: TravelSuggestion[];
}): JSX.Element | null {
  const reducedMotion = useReducedMotionSafe();
  if (suggestions.length === 0) return null;
  return (
    <section
      aria-label="Travel suggestions"
      className="grid border border-border"
    >
      {suggestions.map((suggestion, index) => (
        <SuggestionCard
          index={index}
          key={`${suggestion.mode}-${suggestion.description}`}
          reducedMotion={reducedMotion}
          suggestion={suggestion}
        />
      ))}
    </section>
  );
}

/** Match-specific sustainable travel planning without a guessed default. */
export default function TravelPage(): JSX.Element {
  const { matches, loading: matchesLoading } = useMatches();
  const travel = useTravelSuggestions();
  const badge = (
    <span className="inline-flex items-center gap-2 border border-secondary/25 bg-secondary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-secondary">
      Arrival planning
    </span>
  );
  const title = (
    <>
      Transport & <br />
      <span className="text-gradient">Parking</span>
    </>
  );
  return (
    <AppShell shader="subtle">
      <div className="grid gap-12">
        <PageHero
          badge={badge}
          description="Select a scheduled match for rail, shuttle, shared-trip, walking, and park-and-ride guidance. The page never guesses a default match."
          title={title}
        />
        <TravelForm
          load={travel.load}
          loading={travel.loading}
          matchId={travel.matchId}
          matches={matches}
          matchesLoading={matchesLoading}
          select={travel.setMatchId}
        />
        {!travel.matchId && !travel.loading && (
          <p className="border-l-2 border-border pl-4 text-sm text-muted-foreground">
            Choose a match to see transit, park-and-ride, carpool, and
            lower-congestion suggestions. Stadium curb parking is never
            guaranteed.
          </p>
        )}
        <TravelResults suggestions={travel.suggestions} />
      </div>
    </AppShell>
  );
}
