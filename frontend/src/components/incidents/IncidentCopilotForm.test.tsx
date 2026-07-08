import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { IncidentReport, Zone } from "@/types/domain";

import { IncidentCopilotForm } from "./IncidentCopilotForm";

const zones: Zone[] = [
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

const draft: IncidentReport = {
  incidentId: "incident-1",
  zoneId: "gate-4",
  status: "draft",
  rawInput: "Large crowd at Gate 4.",
  aiDraftSummary: "Gate 4 crowd buildup needs staff review.",
  severity: "medium",
  reportedByUid: "staff-1",
  createdAt: "2026-06-15T18:42:00Z",
  submittedAt: null,
  resolvedAt: null,
};

describe("IncidentCopilotForm", () => {
  it("names every control and keeps draft generation separate from submission", async () => {
    const onGenerateDraft = vi.fn().mockResolvedValue(draft);
    const onSubmitReport = vi.fn().mockResolvedValue(undefined);

    render(
      <IncidentCopilotForm
        zones={zones}
        onGenerateDraft={onGenerateDraft}
        onSubmitReport={onSubmitReport}
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "Affected zone" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Incident notes"), {
      target: { value: "Large crowd at Gate 4." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));

    await waitFor(() => expect(onGenerateDraft).toHaveBeenCalledOnce());
    expect(onSubmitReport).not.toHaveBeenCalled();

    fireEvent.click(
      await screen.findByRole("button", { name: "Submit Report" }),
    );
    await waitFor(() => expect(onSubmitReport).toHaveBeenCalledWith(draft));
  });
});
