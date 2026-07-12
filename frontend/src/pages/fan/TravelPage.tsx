import { useState } from "react";
import { CarFront, Leaf, Train } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMatches } from "@/hooks/useMatches";
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

/** Sustainable travel page with public match selection and inline cards. */
export default function TravelPage(): JSX.Element {
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
    <AppShell>
      <div className="grid gap-6">
        <section className="grid gap-3">
          <p className="w-fit rounded-md border border-border bg-card px-3 py-1 text-xs font-black uppercase text-primary">
            Arrival planning
          </p>
          <h1 className="font-display text-5xl font-black uppercase leading-none text-foreground">
            Getting Here Sustainably
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Select a scheduled match before requesting travel suggestions. The
            page never guesses a default match.
          </p>
        </section>

        <section
          aria-labelledby="travel-form-heading"
          className="grid gap-4 rounded-lg border border-border bg-card/92 p-5 shadow-[8px_8px_0_rgb(0_0_0/0.16)] dark:shadow-[8px_8px_0_rgb(247_243_232/0.08)]"
        >
          <h2
            className="font-display text-2xl font-black uppercase text-foreground"
            id="travel-form-heading"
          >
            Match Selector
          </h2>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="grid gap-2">
              <Label id="match-select-label">Match</Label>
              <Select value={matchId} onValueChange={setMatchId}>
                <SelectTrigger
                  aria-labelledby="match-select-label"
                  className="min-h-11 w-full"
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
            <Button
              className="min-h-11"
              disabled={loading || suggestionsLoading}
              onClick={() => void fetchSuggestions()}
              type="button"
            >
              Load suggestions
            </Button>
          </div>
        </section>

        {!matchId && (
          <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Choose a match to see transit, carpool, and lower-congestion travel
            suggestions.
          </p>
        )}
        {suggestionsLoading && (
          <p className="text-sm text-accent" role="status">
            Loading travel suggestions...
          </p>
        )}
        {matchId && suggestions.length === 0 && !suggestionsLoading && (
          <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            No travel suggestions loaded for this match yet.
          </p>
        )}
        <section
          aria-label="Travel suggestions"
          className="grid gap-4 md:grid-cols-2"
        >
          {suggestions.map((suggestion) => {
            const Icon = iconForMode(suggestion.mode);
            return (
              <Card key={`${suggestion.mode}-${suggestion.description}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon aria-hidden="true" className="size-5 text-success" />
                    {suggestion.mode}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {suggestion.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
