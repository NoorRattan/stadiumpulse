import { memo, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Activity,
  BotMessageSquare,
  ClipboardList,
  LogIn,
  Map,
  Menu,
  Sparkles,
  Train,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavigationItem {
  href: string;
  label: string;
  description: string;
  icon: typeof BotMessageSquare;
}

const fanItems: readonly NavigationItem[] = [
  {
    href: "/",
    label: "Home",
    description: "Match-day overview",
    icon: Activity,
  },
  {
    href: "/demo",
    label: "Live demo",
    description: "Explore the connected system",
    icon: Sparkles,
  },
  {
    href: "/wayfinding",
    label: "Plan a route",
    description: "Find a calmer accessible path",
    icon: Map,
  },
  {
    href: "/concierge",
    label: "Ask for help",
    description: "Multilingual venue answers",
    icon: BotMessageSquare,
  },
  {
    href: "/travel",
    label: "Travel",
    description: "Plan a lower-congestion arrival",
    icon: Train,
  },
];

const opsItems: readonly NavigationItem[] = [
  {
    href: "/ops",
    label: "Crowd",
    description: "Live venue overview",
    icon: Activity,
  },
  {
    href: "/ops/incidents",
    label: "Incidents",
    description: "Human-reviewed response drafts",
    icon: ClipboardList,
  },
  {
    href: "/ops/briefings",
    label: "Briefings",
    description: "Volunteer guidance",
    icon: BotMessageSquare,
  },
];

/** Role-aware navigation with a labelled mobile menu and a compact desktop bar. */
export const Navbar = memo(function Navbar() {
  const { role, user } = useAuth();
  const [open, setOpen] = useState(false);
  const items = role === "fan" ? fanItems : opsItems;

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className="hidden items-center gap-1 lg:flex"
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "relative inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive &&
                    "bg-muted text-foreground after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-primary",
                )
              }
              end={item.href === "/" || item.href === "/ops"}
              key={item.href}
              to={item.href}
            >
              <Icon aria-hidden="true" className="size-4" />
              {item.label}
            </NavLink>
          );
        })}
        {user ? (
          <Link
            className="ml-2 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-bold text-foreground"
            to="/account"
          >
            <UserRound aria-hidden="true" className="size-4" />
            Account
          </Link>
        ) : (
          <Link
            className="ml-2 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"
            to="/login"
          >
            <LogIn aria-hidden="true" className="size-4" />
            Sign in
          </Link>
        )}
      </nav>

      <button
        aria-controls="mobile-navigation-panel"
        aria-expanded={open}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-bold text-foreground shadow-sm lg:hidden"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? (
          <X aria-hidden="true" className="size-4" />
        ) : (
          <Menu aria-hidden="true" className="size-4" />
        )}
        {open ? "Close" : "Menu"}
      </button>

      {open && (
        <nav
          aria-label="Mobile navigation"
          className="fixed inset-x-3 top-[4.75rem] z-50 rounded-2xl border border-border bg-popover p-2 shadow-lg lg:hidden"
          id="mobile-navigation-panel"
        >
          <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {role === "fan" ? "Match-day tools" : "Operations tools"}
          </p>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "flex min-h-14 items-center gap-3 rounded-xl px-3 text-foreground transition-colors hover:bg-muted",
                    isActive && "bg-muted",
                  )
                }
                end={item.href === "/" || item.href === "/ops"}
                key={item.href}
                onClick={() => setOpen(false)}
                to={item.href}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-content-center rounded-lg bg-muted text-muted-foreground",
                        isActive && "bg-primary text-primary-foreground",
                      )}
                    >
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold">
                        {item.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
          {user ? (
            <Link
              className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground"
              onClick={() => setOpen(false)}
              to="/account"
            >
              <UserRound aria-hidden="true" className="size-4" />
              Account
            </Link>
          ) : (
            <Link
              className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
              onClick={() => setOpen(false)}
              to="/login"
            >
              <LogIn aria-hidden="true" className="size-4" />
              Sign in
            </Link>
          )}
        </nav>
      )}
    </>
  );
});
