import { useState } from "react";
import { CarFront, Leaf, Train, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

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
import type { TravelSuggestion } from "@/types/domain";

function iconForMode(mode: string): typeof Train {
  if (mode.includes("rail") || mode.includes("transit")) {
    return Train;
  }
  if (mode.includes("share") || mode.includes("car")) {
    return CarFront;
  }
  return Leaf;
}

const modeAccent: Record<string, string> = {
  rail: "var(--brand-cyan)",
  transit: "var(--brand-cyan)",
  share: "var(--brand-amber)",
  car: "var(--brand-amber)",
};

function accentForMode(mode: string): string {
  for (const [key, color] of Object.entries(modeAccent)) {
    if (mode.toLowerCase().includes(key)) return color;
  }
  return "var(--brand-magenta)";
}

/** Sustainable travel page - brutalist mode tiles with neon accents. */
export default function TravelPage(): JSX.Element {
  const reducedMotion = useReducedMotionSafe();
  const { matches, loading } = useMatches();
  const [matchId, setMatchId] = useState("");
  const [suggestions, setSuggestions] = useState<TravelSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const fetchSuggestions = async () => {
    if (!matchId) {
      toast.error("Choose a match before loading travel suggestions.");
      return;
    }
    setSuggestionsLoading(true);
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
      setSuggestionsLoading(false);
    }
  };

  return (
    <AppShell shader="subtle">
      <div className="grid gap-12">
        <PageHero
          badge={
            <span className="inline-flex items-center gap-2 border border-secondary/25 bg-secondary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-secondary">
              Arrival planning
            </span>
          }
          title={
            <>
              Transport & <br />
              <span className="text-gradient">Parking</span>
            </>
          }
          description="Select a scheduled match for rail, shuttle, shared-trip, walking, and park-and-ride guidance. The page never guesses a default match."
        />

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
                <Select value={matchId} onValueChange={setMatchId}>
                  <SelectTrigger
                    aria-labelledby="match-select-label"
                    className="min-h-12 w-full rounded-none border-0 border-b border-input bg-transparent focus:border-primary"
                  >
                    <SelectValue
                      placeholder={
                        loading ? "Loading matches..." : "Select a match"
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
                className="inline-flex min-h-12 items-center gap-2 bg-primary px-6 font-semibold text-primary-foreground transition disabled:bg-muted disabled:text-muted-foreground"
                disabled={loading || suggestionsLoading}
                onClick={() => void fetchSuggestions()}
                type="button"
              >
                {suggestionsLoading ? "Loading..." : "Load suggestions"}
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </section>
        </FadeInView>

        {!matchId && !suggestionsLoading && (
          <p className="border-l-2 border-border pl-4 text-sm text-muted-foreground">
            Choose a match to see transit, park-and-ride, carpool, and
            lower-congestion travel suggestions. Stadium curb parking is never
            guaranteed by this demo.
          </p>
        )}

        {suggestions.length > 0 && (
          <section
            aria-label="Travel suggestions"
            className="grid gap-0 border border-border"
          >
            {suggestions.map((suggestion, i) => {
              const Icon = iconForMode(suggestion.mode);
              const accent = accentForMode(suggestion.mode);
              return (
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  key={`${suggestion.mode}-${suggestion.description}`}
                >
                  <div className="flex items-start gap-6 border-b border-border p-6 last:border-0">
                    <span
                      className="grid size-11 shrink-0 place-content-center border"
                      style={{
                        borderColor: `color-mix(in srgb, ${accent} 25%, transparent)`,
                        color: accent,
                      }}
                    >
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <div>
                      <p className="font-display text-lg font-bold text-foreground">
                        {suggestion.mode}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </section>
        )}
      </div>
    </AppShell>
  );
}
