import { memo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";

import { AccessibilityToggle } from "@/components/accessibility";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { PulseConciergeDock } from "@/components/concierge/PulseConciergeDock";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";

import { Navbar } from "./Navbar";
import { SkipLink } from "./SkipLink";

export interface AppShellProps {
  children: ReactNode;
  shader?: "subtle" | "vivid" | "none";
  flush?: boolean;
}

const platformLinks = [
  ["Fan Companion", "/fan"],
  ["Volunteer Hub", "/volunteer"],
  ["Staff Operations", "/staff"],
  ["Organizer Command Center", "/organizer"],
] as const;

const matchDayLinks = [
  ["Live Concierge", "/concierge"],
  ["Crowd Insights", "/demo"],
  ["Sustainability", "/sustainability"],
  ["Accessibility", "/accessibility"],
] as const;

const additionalLinks = [
  ["Matches & Tickets", "/matches"],
  ["Venues", "/venues"],
  ["Amenities", "/amenities"],
  ["Fan Events", "/events"],
  ["Alerts", "/alerts"],
  ["Wayfinding", "/wayfinding"],
  ["Travel", "/travel"],
  ["Help", "/help"],
  ["About", "/about"],
  ["Sign In", "/login"],
] as const;

type FooterLink = readonly [label: string, href: string];

function FooterLinkGroup({
  label,
  links,
  twoColumns = false,
}: {
  label: string;
  links: readonly FooterLink[];
  twoColumns?: boolean;
}): JSX.Element {
  return (
    <nav aria-label={`${label} links`}>
      <h2 className="font-display text-sm font-bold">{label}</h2>
      <ul
        className={`mt-4 grid gap-3 text-sm text-muted-foreground ${twoColumns ? "grid-cols-2 lg:grid-cols-1" : ""}`}
      >
        {links.map(([linkLabel, href]) => (
          <li key={href}>
            <Link className="hover:text-primary" to={href}>
              {linkLabel}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Shared reference-matched shell used by copied and StadiumPulse-only pages. */
export const AppShell = memo(function AppShell({
  children,
  flush = false,
}: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-70 [background-image:linear-gradient(var(--grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--grid-line)_1px,transparent_1px)] [background-size:80px_80px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_85%_5%,var(--glow-primary),transparent_28%),radial-gradient(circle_at_5%_55%,var(--glow-accent),transparent_23%)]"
      />

      <SkipLink />

      <header className="sticky top-0 z-40 border-b border-border bg-[var(--glass-strong)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <BrandLogo tagline />
          <div className="flex items-center gap-2">
            <Navbar />
            <ThemeToggle />
            <Link
              to="/login"
              className="navbar-login-btn"
              aria-label="Sign in to your account"
            >
              <LogIn aria-hidden="true" className="size-3.5" />
              <span>Login</span>
            </Link>
          </div>
        </div>
      </header>

      <main
        className={`relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${flush ? "" : "py-10 md:py-14"}`}
        id="main-content"
        tabIndex={-1}
      >
        {children}
      </main>

      <footer className="relative z-10 border-t border-border bg-[var(--glass-strong)] backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_.75fr_.75fr_.75fr] lg:px-8">
          <div>
            <BrandLogo tagline />
            <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
              StadiumPulse is a GenAI-powered match-day intelligence platform
              for FIFA World Cup 2026 venues — helping fans navigate confidently
              and operators run venues safely, accessibly, and efficiently.
            </p>
            <p className="mt-4 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
              Connected demo · Synthetic venue signals · Human-approved ops
            </p>
          </div>
          <FooterLinkGroup label="Platform" links={platformLinks} />
          <FooterLinkGroup label="Match day" links={matchDayLinks} />
          <FooterLinkGroup
            label="More StadiumPulse"
            links={additionalLinks}
            twoColumns
          />
        </div>
        <div className="border-t border-border px-4 py-5">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-muted-foreground">
              © 2026 StadiumPulse · Match-day intelligence · Unofficial demo
            </p>
            <AccessibilityToggle />
          </div>
        </div>
      </footer>

      <PulseConciergeDock />
      <Toaster />
    </div>
  );
});
