import { render, screen } from "@testing-library/react";

import { LanguageProvider } from "@/contexts/LanguageContext";

import { ConciergeChat } from "./ConciergeChat";

describe("ConciergeChat", () => {
  it("renders a named composer control and submit button", () => {
    render(
      <LanguageProvider>
        <ConciergeChat />
      </LanguageProvider>,
    );

    expect(screen.getByLabelText("Message")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send message" }),
    ).toBeInTheDocument();
  });
});
