import { render, screen } from "@testing-library/react";

import type { IncidentReport, Zone } from "@/types/domain";

import { IncidentList } from "./IncidentList";

const listZones: Zone[] = [
  {
    zoneId: "gate-4",
    name: "Gate 4",
    type: "gate",
    capacity: 1200,
    currentDensityPct: 82,
    lastUpdated: "2026-06-15T18:42:00Z",
    coordinates: { lat: 1, lng: 1 },
  },
];

const incidents: IncidentReport[] = [
  {
    incidentId: "incident-1",
    zoneId: "gate-4",
    status: "draft",
    rawInput: "Turnstile down.",
    aiDraftSummary: null,
    severity: null,
    reportedByUid: "vol-1",
    createdAt: "2026-06-15T18:42:00Z",
    submittedAt: null,
    resolvedAt: null,
  },
];

describe("IncidentList", () => {
  it("renders accessible filter controls", () => {
    render(<IncidentList incidents={incidents} zones={listZones} />);

    expect(
      screen.getByRole("combobox", { name: "Filter incidents by zone" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Filter incidents by status" }),
    ).toBeInTheDocument();
  });
});
