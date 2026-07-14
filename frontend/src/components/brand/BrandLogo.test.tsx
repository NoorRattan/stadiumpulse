import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { BrandLogo } from "./BrandLogo";

describe("BrandLogo", () => {
  it("renders the supplied wordmark as the accessible home link", () => {
    render(
      <MemoryRouter>
        <BrandLogo tagline />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "StadiumPulse home" });
    expect(link).toHaveAttribute("href", "/");
    expect(link).toHaveAttribute("data-tagline", "visible");
    expect(link.querySelector("img")).toHaveAttribute(
      "src",
      "/stadiumpulse-logo.png",
    );
  });
});
