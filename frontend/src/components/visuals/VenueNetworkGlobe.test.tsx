import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { VenueNetworkGlobe } from "./VenueNetworkGlobe";

describe("VenueNetworkGlobe", () => {
  it("selects host cities with buttons and keyboard controls", () => {
    render(<VenueNetworkGlobe />);

    expect(
      screen.getByRole("heading", { name: "New York / New Jersey" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Select next host city" }),
    );
    expect(
      screen.getByRole("heading", { name: "Philadelphia" }),
    ).toBeInTheDocument();

    const globe = screen.getByRole("slider");
    fireEvent.keyDown(globe, { key: "ArrowLeft" });
    expect(
      screen.getByRole("heading", { name: "New York / New Jersey" }),
    ).toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(<VenueNetworkGlobe />);

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
