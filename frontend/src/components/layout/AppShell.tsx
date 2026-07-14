import { memo, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { ParticleCanvas } from "@/components/visuals/ParticleCanvas";
import { AccessibilityToggle } from "@/components/accessibility";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

import { Navbar } from "./Navbar";
import { SkipLink } from "./SkipLink";

/** Props for the shared application shell. */
export interface AppShellProps {
  children: ReactNode;
  shader?: "subtle" | "vivid" | "none";
}

/** Shared header, navigation, accessibility controls, and main landmark. */
export const AppShell = memo(function AppShell({
  children,
  shader = "subtle",
}: AppShellProps) {
  const renderDecorativeBackground = import.meta.env.MODE !== "test";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* -- Background layers -- */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        {/* Particle field */}
        {renderDecorativeBackground && shader !== "none" && (
          <ParticleCanvas
            className="absolute inset-0 h-full w-full"
            count={shader === "vivid" ? 32 : 18}
            mouseRepel={false}
          />
        )}
        {/* Radial gradient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--glow-primary),transparent)]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:80px_80px]" />
      </div>

      <SkipLink />

      {/* -- Header -- */}
      <header className="sticky top-0 z-40 border-b border-border bg-[var(--glass-strong)] backdrop-blur-2xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <div className="min-w-0 shrink-0">
            <BrandLogo tagline />
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <Navbar />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* -- Main -- */}
      <main
        className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8"
        id="main-content"
        tabIndex={-1}
      >
        {children}
      </main>

      {/* -- Footer -- */}
      <footer className="relative z-10 border-t border-border bg-[var(--glass-strong)] backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8">
          <div>
            <BrandLogo />
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              One connected match-day guide for routes, venue help, travel, and
              human-reviewed operations.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Demo signals are clearly labelled synthetic. No physical sensor
              claims.
            </p>
            <nav
              aria-label="Footer navigation"
              className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4"
            >
              {[
                ["Matches", "/matches"],
                ["Venues", "/venues"],
                ["Accessibility", "/accessibility"],
                ["Amenities", "/amenities"],
                ["Fan events", "/events"],
                ["Sustainability", "/sustainability"],
                ["Alerts", "/alerts"],
                ["Help", "/help"],
                ["About", "/about"],
                ["Contact", "/contact"],
                ["Privacy", "/privacy"],
                ["Terms", "/terms"],
              ].map(([label, href]) => (
                <Link
                  className="font-semibold text-muted-foreground hover:text-primary"
                  key={href}
                  to={href}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <AccessibilityToggle />
          </div>
        </div>
        {/* Bottom rule */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
      </footer>

      <Toaster />
    </div>
  );
});
