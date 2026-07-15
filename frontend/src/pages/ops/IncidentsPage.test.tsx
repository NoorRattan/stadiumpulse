import { screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { createAuthValue, renderWithAuth } from "@/testUtils";

import IncidentsPage from "./IncidentsPage";

vi.mock("@/hooks/useZoneOptions", () => ({
  useZoneOptions: () => ({
    zones: [{ zoneId: "gate-4", name: "Gate 4", type: "gate" }],
    loading: false,
    error: null,
  }),
}));

vi.mock("@/services/apiClient", () => ({
  apiRequest: vi
    .fn()
    .mockResolvedValue({ items: [], limit: 20, nextPageToken: null }),
}));

const authValue = createAuthValue({ role: "staff" });

describe("IncidentsPage", () => {
  it("renders one h1 and has no axe violations", async () => {
    const { container } = renderWithAuth(<IncidentsPage />, { authValue });

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Incidents",
    );
    await screen.findByText("No incidents match the selected filters.");
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
