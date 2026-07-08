import { render, screen } from "@testing-library/react";

import { SkipLink } from "./SkipLink";

describe("SkipLink", () => {
  it("renders a named link to the main content landmark", () => {
    render(<SkipLink />);

    expect(
      screen.getByRole("link", { name: "Skip to main content" }),
    ).toHaveAttribute("href", "#main-content");
  });
});
