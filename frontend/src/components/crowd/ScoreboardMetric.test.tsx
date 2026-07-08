import { render, screen } from "@testing-library/react";

import { ScoreboardMetric } from "./ScoreboardMetric";

vi.mock("@/hooks/useReducedMotionSafe", () => ({
  useReducedMotionSafe: () => true,
}));

describe("ScoreboardMetric", () => {
  it("renders the current value without animation under reduced motion", () => {
    render(<ScoreboardMetric label="Average density" value={64} suffix="%" />);

    expect(screen.getByLabelText("Average density")).toHaveAttribute(
      "data-motion",
      "static",
    );
    expect(screen.getByText("64%")).toBeInTheDocument();
  });
});
