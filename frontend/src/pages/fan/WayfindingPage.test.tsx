import { screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { createAuthValue, renderWithAuth } from "@/testUtils";

import WayfindingPage from "./WayfindingPage";

vi.mock("@/hooks/useZoneOptions", () => ({
  useZoneOptions: () => ({
    zones: [
      { zoneId: "gate-2", name: "Gate 2", type: "gate" },
      { zoneId: "seat-block-114", name: "Section 114", type: "seating-block" },
    ],
    loading: false,
    error: null,
  }),
}));

vi.mock("@/hooks/useWayfinding", () => ({
  useWayfinding: () => ({
    route: null,
    loading: false,
    error: null,
    getRoute: vi.fn(),
    reset: vi.fn(),
  }),
}));

const authValue = createAuthValue();

describe("WayfindingPage", () => {
  it("renders one h1 and has no axe violations", async () => {
    const { container } = renderWithAuth(<WayfindingPage />, { authValue });

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Find Your Way",
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
