import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { MemoryRouter } from "react-router-dom";

import CockpitPage, { type CockpitKind } from "./CockpitPage";

vi.mock("@/hooks/useExperience", () => ({
  usePublicExperience: () => ({
    data: {
      matches: [],
      venues: [],
      alerts: [],
      amenities: [],
      fanEvents: [],
      sustainability: [],
    },
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/services/apiClient", () => ({
  apiRequest: vi.fn(() => Promise.reject(new Error("offline in unit test"))),
}));

vi.mock("@/hooks/useReducedMotionSafe", () => ({
  useReducedMotionSafe: () => true,
}));

const expectations: Array<[CockpitKind, string]> = [
  ["fan", "Your match day, one tap away."],
  ["volunteer", "Shift-ready. Zone-aware."],
  ["staff", "Operate safely. See everything."],
  ["organizer", "Command every venue, in real time."],
];

describe("CockpitPage", () => {
  it.each(expectations)(
    "renders the copied %s page hierarchy",
    async (kind, title) => {
      render(
        <MemoryRouter initialEntries={[`/${kind}`]}>
          <CockpitPage kind={kind} />
        </MemoryRouter>,
      );

      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        title,
      );
      if (kind !== "volunteer") {
        await screen.findByText(/demo snapshot unavailable/i);
      }
    },
  );

  it("keeps the copied volunteer cockpit accessible", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/volunteer"]}>
        <CockpitPage kind="volunteer" />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
