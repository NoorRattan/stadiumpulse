import { screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { createAuthValue, renderWithAuth } from "@/testUtils";

import ConciergePage from "./ConciergePage";

const authValue = createAuthValue();

describe("ConciergePage", () => {
  it("renders one h1 and has no axe violations", async () => {
    const { container } = renderWithAuth(<ConciergePage />, { authValue });

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Ask StadiumPulse",
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
