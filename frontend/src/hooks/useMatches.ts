import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { firestoreDb } from "@/services/firebaseConfig";
import type { Match } from "@/types/domain";

let cachedMatches: Match[] | null = null;
type TimestampLike = { toDate: () => Date };

/** State returned by the cached public match-schedule hook. */
export interface MatchesState {
  matches: Match[];
  loading: boolean;
  error: Error | null;
}

function timestampToIso(value: unknown): string {
  const maybeTimestamp = value as Partial<TimestampLike> | null;
  if (typeof maybeTimestamp?.toDate === "function") {
    return maybeTimestamp.toDate().toISOString();
  }
  return typeof value === "string" ? value : "";
}

function matchFromSnapshot(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): Match {
  const data = snapshot.data() as Record<string, unknown>;
  return {
    matchId: snapshot.id,
    venueZoneIds: Array.isArray(data.venueZoneIds)
      ? data.venueZoneIds.filter(
          (zoneId): zoneId is string => typeof zoneId === "string",
        )
      : [],
    kickoffAt: timestampToIso(data.kickoffAt),
    homeTeam: typeof data.homeTeam === "string" ? data.homeTeam : "",
    awayTeam: typeof data.awayTeam === "string" ? data.awayTeam : "",
    transitLoadEstimate:
      data.transitLoadEstimate === "low" ||
      data.transitLoadEstimate === "medium" ||
      data.transitLoadEstimate === "high"
        ? data.transitLoadEstimate
        : "medium",
  };
}

/** Reads public match reference data once with an explicit limit. */
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
    const matchesQuery = query(
      collection(firestoreDb, "matches"),
      orderBy("kickoffAt", "asc"),
      limit(maxMatches),
    );

    void getDocs(matchesQuery)
      .then((snapshot) => {
        const matches = snapshot.docs.map(matchFromSnapshot);
        cachedMatches = matches;
        if (active) {
          setState({ matches, loading: false, error: null });
        }
      })
      .catch((caught: unknown) => {
        const error =
          caught instanceof Error
            ? caught
            : new Error("Match schedule could not be loaded.");
        if (active) {
          setState({ matches: [], loading: false, error });
        }
      });

    return () => {
      active = false;
    };
  }, [maxMatches]);

  return state;
}
