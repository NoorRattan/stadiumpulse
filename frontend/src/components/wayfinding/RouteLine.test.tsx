import { render, screen } from "@testing-library/react";

import type { RouteOption } from "@/types/domain";

import { RouteLine } from "./RouteLine";

vi.mock("@/hooks/useReducedMotionSafe", () => ({
  useReducedMotionSafe: () => true,
}));

const route: RouteOption = {
  steps: [
    { instruction: "Start at Gate 2.", zoneId: "gate-2" },
    { instruction: "Continue to Section 114.", zoneId: "seat-block-114" },
  ],
  estimatedMinutes: 6,
  congestionLevel: "medium",
};

describe("RouteLine", () => {
  it("renders the static reduced-motion route equivalent", () => {
    render(<RouteLine route={route} />);

    expect(screen.getByLabelText("Route preview with 2 steps")).toHaveAttribute(
      "data-motion",
      "static",
    );
  });
});
