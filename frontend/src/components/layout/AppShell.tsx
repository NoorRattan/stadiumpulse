import { memo, type ReactNode } from "react";

import { AccessibilityToggle } from "@/components/accessibility";
import { Toaster } from "@/components/ui/sonner";

import { Navbar } from "./Navbar";
import { SkipLink } from "./SkipLink";

/** Props for the shared application shell. */
export interface AppShellProps {
  children: ReactNode;
}

/** Shared header, navigation, accessibility controls, and main landmark. */
export const AppShell = memo(function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SkipLink />
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold text-foreground">
              StadiumPulse
            </p>
            <p className="text-sm text-muted-foreground">
              Live intelligence for match-day operations.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Navbar />
            <AccessibilityToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6" id="main-content">
        {children}
      </main>
      <Toaster />
    </div>
  );
});
