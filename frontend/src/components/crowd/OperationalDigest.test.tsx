import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { apiRequest } from "@/services/apiClient";

import { OperationalDigest } from "./OperationalDigest";

vi.mock("@/services/apiClient", () => ({ apiRequest: vi.fn() }));

const mockApiRequest = vi.mocked(apiRequest);

describe("OperationalDigest", () => {
  it("renders ranked actions with the human approval boundary", async () => {
    mockApiRequest.mockResolvedValue({
      generatedAt: "2026-07-12T12:00:00Z",
      minutesAhead: 15,
      headline: "1 zone needs attention",
      narrative: "Gate 4 is the highest projected pressure point.",
      dataStatus: "simulated",
      items: [
        {
          zoneId: "gate-4",
          zoneName: "Gate 4",
          currentDensityPct: 82,
          projectedDensityPct: 94,
          projectedBand: "critical",
          direction: "rising",
          confidence: "medium",
          priority: "urgent",
          recommendedAction:
            "Hold new inflow and prepare a supervised reroute.",
          requiresSupervisorApproval: true,
        },
      ],
    });

    const { container } = render(<OperationalDigest />);

    expect(
      await screen.findByText("1 zone needs attention"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Supervisor approval required"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no action is executed automatically/i),
    ).toBeInTheDocument();
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("preserves the zone dashboard when the digest is unavailable", async () => {
    mockApiRequest.mockRejectedValue(new Error("offline"));

    render(<OperationalDigest />);

    expect(
      await screen.findByText(/temporarily unavailable/i),
    ).toBeInTheDocument();
  });
});
