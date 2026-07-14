import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { Navbar } from "./Navbar";

describe("Navbar", () => {
  it("exposes every copied reference route on desktop", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    for (const label of ["Home", "Fan", "Volunteer", "Staff", "Organizer"]) {
      expect(
        within(navigation).getByRole("link", { name: label }),
      ).toBeVisible();
    }
    expect(
      within(navigation).getByRole("link", { name: "Get Tickets" }),
    ).toHaveAttribute("href", "https://www.fifa.com/tickets");
  });

  it("opens the reference-style mobile menu and closes after navigation", () => {
    render(
      <MemoryRouter initialEntries={["/volunteer"]}>
        <Navbar />
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole("button", { name: "Toggle menu" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menuButton);

    const mobileNavigation = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(
      within(mobileNavigation).getByRole("link", { name: "Volunteer" }),
    ).toHaveAttribute("aria-current", "page");

    fireEvent.click(
      within(mobileNavigation).getByRole("link", { name: "Organizer" }),
    );
    expect(
      screen.queryByRole("navigation", { name: "Mobile navigation" }),
    ).not.toBeInTheDocument();
  });
});
