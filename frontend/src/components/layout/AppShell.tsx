import { memo, type ReactNode } from "react";

import { AtmosphericShader } from "@/components/visuals/AtmosphericShader";
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
        {renderDecorativeBackground && (
          <ParticleCanvas
            className="absolute inset-0 h-full w-full"
            count={80}
          />
        )}
        {/* Atmospheric WebGL shader */}
        {renderDecorativeBackground && shader !== "none" && (
          <AtmosphericShader intensity={shader} />
        )}
        {/* Radial gradient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,255,136,0.07),transparent)]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:80px_80px]" />
      </div>

      <SkipLink />

      {/* -- Header -- */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 lg:px-10">
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
        className="relative z-10 mx-auto w-full max-w-7xl px-5 py-10 pb-32 md:pb-16 lg:px-10 lg:py-14"
        id="main-content"
      >
        {children}
      </main>

      {/* -- Footer -- */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-black/60 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10">
          <div>
            <BrandLogo />
            <p className="mt-2 text-xs text-muted-foreground">
              GenAI venue intelligence for FIFA World Cup 2026 match days.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/50">
              Synthetic demo data - no physical sensor claims.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <AccessibilityToggle />
          </div>
        </div>
        {/* Bottom rule */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </footer>

      <Toaster />
    </div>
  );
});
