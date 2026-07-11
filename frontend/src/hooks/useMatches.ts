import { useEffect, useState } from "react";

import { supabase } from "@/services/supabaseConfig";
import type { Match } from "@/types/domain";

let cachedMatches: Match[] | null = null;

/** State returned by the cached public match-schedule hook. */
export interface MatchesState {
  matches: Match[];
  loading: boolean;
  error: Error | null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function matchFromRow(data: Record<string, unknown>): Match {
  return {
    matchId: stringValue(data.id),
    venueZoneIds: Array.isArray(data.venue_zone_ids)
      ? data.venue_zone_ids.filter(
          (zoneId): zoneId is string => typeof zoneId === "string",
        )
      : [],
    kickoffAt: stringValue(data.kickoff_at),
    homeTeam: stringValue(data.home_team),
    awayTeam: stringValue(data.away_team),
    transitLoadEstimate:
      data.transit_load_estimate === "low" ||
      data.transit_load_estimate === "medium" ||
      data.transit_load_estimate === "high"
        ? data.transit_load_estimate
        : "medium",
  };
}

/** Reads public match reference data from Supabase once with an explicit limit. */
export function useMatches(maxMatches = 12): MatchesState {
  const [state, setState] = useState<MatchesState>({
    matches: cachedMatches ?? [],
    loading: cachedMatches === null,
    error: null,
  });

  useEffect(() => {
    if (cachedMatches !== null) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        const { data, error } = await supabase
          .from("matches")
          .select(
            "id,venue_zone_ids,kickoff_at,home_team,away_team,transit_load_estimate",
          )
          .order("kickoff_at", { ascending: true })
          .limit(maxMatches);
        if (error) {
          throw error;
        }
        const matches = (data ?? []).map((row) => matchFromRow(row));
        cachedMatches = matches;
        if (active) {
          setState({ matches, loading: false, error: null });
        }
      } catch (caught: unknown) {
        const error =
          caught instanceof Error
            ? caught
            : new Error("Match schedule could not be loaded.");
        if (active) {
          setState({ matches: [], loading: false, error });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [maxMatches]);

  return state;
}
