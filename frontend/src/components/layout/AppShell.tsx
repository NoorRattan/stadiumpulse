import { memo, type ReactNode } from "react";

import { AccessibilityToggle } from "@/components/accessibility";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

import { Navbar } from "./Navbar";
import { SkipLink } from "./SkipLink";

/** Props for the shared application shell. */
export interface AppShellProps {
  children: ReactNode;
}

/** Shared header, navigation, accessibility controls, and main landmark. */
export const AppShell = memo(function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,var(--glow-primary),transparent_36%),radial-gradient(circle_at_90%_20%,var(--glow-accent),transparent_30%)]" />
      <SkipLink />
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="min-w-0 shrink-0">
            <p className="font-display text-xl font-black tracking-tight text-foreground md:text-2xl">
              StadiumPulse
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Know the venue. Move with confidence.
            </p>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <Navbar />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main
        className="relative mx-auto w-full max-w-7xl px-4 py-8 pb-28 md:pb-16 lg:px-8 lg:py-12"
        id="main-content"
      >
        {children}
      </main>
      <footer className="relative border-t border-border/70 bg-card/55 pb-24 md:pb-0">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-7 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="font-display text-lg font-bold">StadiumPulse</p>
            <p className="text-sm text-muted-foreground">
              Accessible match-day intelligence for every fan and operator.
            </p>
          </div>
          <AccessibilityToggle />
        </div>
      </footer>
      <Toaster />
    </div>
  );
});
