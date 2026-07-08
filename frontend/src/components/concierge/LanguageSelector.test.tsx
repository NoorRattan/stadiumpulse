import { fireEvent, render, screen } from "@testing-library/react";

import { LanguageProvider } from "@/contexts/LanguageContext";

import { LanguageSelector } from "./LanguageSelector";

describe("LanguageSelector", () => {
  it("renders an accessible combobox and supports keyboard focus", () => {
    render(
      <LanguageProvider>
        <LanguageSelector />
      </LanguageProvider>,
    );

    const combobox = screen.getByRole("combobox", {
      name: "Conversation language",
    });
    combobox.focus();
    fireEvent.keyDown(combobox, { key: "ArrowDown" });

    expect(combobox).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
  });
});
