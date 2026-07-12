import { memo, type ReactNode } from "react";

import { AccessibilityToggle } from "@/components/accessibility";
import { BrandLogo } from "@/components/brand/BrandLogo";
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
    <div className="relative min-h-screen overflow-x-hidden bg-transparent text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_8%_8%,var(--glow-primary),transparent_34rem),radial-gradient(circle_at_94%_14%,var(--glow-accent),transparent_30rem),linear-gradient(115deg,transparent_0%,rgb(255_255_255/0.08)_48%,transparent_62%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-px bg-foreground/60"
      />
      <SkipLink />
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 shadow-[0_6px_0_rgb(0_0_0/0.12)] backdrop-blur-xl dark:shadow-[0_6px_0_rgb(247_243_232/0.05)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="min-w-0 shrink-0">
            <BrandLogo tagline />
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
      <footer className="relative border-t border-border bg-card/80 pb-24 backdrop-blur-xl md:pb-0">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-7 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <BrandLogo />
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
