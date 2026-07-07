import { collection, limit, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";

import { firestoreDb } from "../services/firebaseConfig";
import type { Zone, ZoneType } from "../types/domain";

/** State returned by the live crowd-density listener. */
export interface CrowdDensityState {
  zones: Zone[];
  loading: boolean;
  error: Error | null;
}

function zoneFromSnapshot(id: string, data: Record<string, unknown>): Zone {
  const name = typeof data.name === "string" ? data.name : "";
  const lastUpdated =
    typeof data.lastUpdated === "object" &&
    data.lastUpdated !== null &&
    "toDate" in data.lastUpdated
      ? (data.lastUpdated as { toDate: () => Date }).toDate().toISOString()
      : "";

  return {
    zoneId: id,
    name,
    type: data.type as ZoneType,
    capacity: Number(data.capacity ?? 0),
    currentDensityPct: Number(data.currentDensityPct ?? 0),
    lastUpdated,
    coordinates: data.coordinates as Zone["coordinates"],
  };
}

/** Listens to the staff/volunteer Firestore zone feed with cleanup on unmount. */
export function useCrowdDensity(maxZones = 50): CrowdDensityState {
  const [state, setState] = useState<CrowdDensityState>({
    zones: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const zonesQuery = query(collection(firestoreDb, "zones"), limit(maxZones));
    return onSnapshot(
      zonesQuery,
      (snapshot) => {
        setState({
          zones: snapshot.docs.map((doc) =>
            zoneFromSnapshot(doc.id, doc.data()),
          ),
          loading: false,
          error: null,
        });
      },
      (error) => setState({ zones: [], loading: false, error }),
    );
  }, [maxZones]);

  return state;
}
