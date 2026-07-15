import { screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { createAuthValue, renderWithAuth } from "@/testUtils";

import NotFoundPage from "./NotFoundPage";

const authValue = createAuthValue();

describe("NotFoundPage", () => {
  it("renders one h1 and has no axe violations", async () => {
    const { container } = renderWithAuth(<NotFoundPage />, { authValue });

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Page Not Found",
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
