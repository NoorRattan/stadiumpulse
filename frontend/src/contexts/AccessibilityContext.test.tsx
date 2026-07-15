import { act, render, screen } from "@testing-library/react";
import { useContext } from "react";

import {
  AccessibilityContext,
  AccessibilityProvider,
} from "./AccessibilityContext";

type MediaChangeListener = (event: MediaQueryListEvent) => void;

function PreferenceProbe(): JSX.Element {
  const preferences = useContext(AccessibilityContext);
  return <span>{preferences?.reducedMotion ? "reduced" : "full"}</span>;
}

describe("AccessibilityProvider", () => {
  it("tracks the operating-system reduced-motion preference", () => {
    let matches = true;
    let listener: MediaChangeListener | undefined;
    vi.mocked(window.matchMedia).mockImplementation(
      (query: string): MediaQueryList => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_type, nextListener) => {
          listener = nextListener as MediaChangeListener;
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    );

    const { unmount } = render(
      <AccessibilityProvider>
        <PreferenceProbe />
      </AccessibilityProvider>,
    );

    expect(screen.getByText("reduced")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("data-motion", "reduced");

    matches = false;
    act(() => listener?.({ matches } as MediaQueryListEvent));

    expect(screen.getByText("full")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("data-motion", "full");
    unmount();
  });
});
