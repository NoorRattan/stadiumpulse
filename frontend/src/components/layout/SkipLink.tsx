import { memo } from "react";

/** Keyboard-visible skip link targeting the page main landmark. */
export const SkipLink = memo(function SkipLink() {
  return (
    <a
      className="sr-only z-50 rounded-md bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      href="#main-content"
      onClick={() => document.getElementById("main-content")?.focus()}
    >
      Skip to main content
    </a>
  );
});
