import { memo, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Activity,
  Accessibility,
  Bell,
  BotMessageSquare,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  Command,
  Leaf,
  LogIn,
  Map,
  MapPin,
  Menu,
  ShoppingBag,
  Sparkles,
  Train,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavigationItem {
  href: string;
  label: string;
  description: string;
  icon: typeof BotMessageSquare;
  desktop?: boolean;
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
    href: "/matches",
    label: "Matches",
    description: "Schedule and official tickets",
    icon: CalendarDays,
  },
  {
    href: "/venues",
    label: "Venues",
    description: "Stadiums, gates, and seating",
    icon: MapPin,
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
  {
    href: "/accessibility",
    label: "Accessibility",
    description: "Facilities and personalized routes",
    icon: Accessibility,
    desktop: false,
  },
  {
    href: "/amenities",
    label: "Amenities",
    description: "Food, retail, medical, and services",
    icon: ShoppingBag,
    desktop: false,
  },
  {
    href: "/events",
    label: "Fan events",
    description: "Fan zones and match-day programme",
    icon: Sparkles,
    desktop: false,
  },
  {
    href: "/sustainability",
    label: "Sustainability",
    description: "Public impact dashboard",
    icon: Leaf,
    desktop: false,
  },
  {
    href: "/alerts",
    label: "Alerts",
    description: "Safety notices and guidance",
    icon: Bell,
    desktop: false,
  },
  {
    href: "/help",
    label: "Help",
    description: "FAQ and support",
    icon: CircleHelp,
    desktop: false,
  },
];

const volunteerItems: readonly NavigationItem[] = [
  {
    href: "/volunteer",
    label: "My shift",
    description: "Schedule, tasks, and training",
    icon: CalendarDays,
  },
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

const staffItems: readonly NavigationItem[] = [
  {
    href: "/ops/command",
    label: "Command",
    description: "Control-room recommendations",
    icon: Command,
  },
  {
    href: "/ops/organizer",
    label: "Organizer",
    description: "Connected operating picture",
    icon: Activity,
  },
  {
    href: "/ops/venue-staff",
    label: "Venue teams",
    description: "Security, medical, and cleaning",
    icon: Users,
  },
  ...volunteerItems,
];

/** Role-aware navigation with a labelled mobile menu and a compact desktop bar. */
export const Navbar = memo(function Navbar() {
  const { role, user } = useAuth();
  const [open, setOpen] = useState(false);
  const items =
    role === "fan"
      ? fanItems
      : role === "volunteer"
        ? volunteerItems
        : staffItems;
  const desktopItems = items.filter((item) => item.desktop !== false);

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
        {desktopItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "relative inline-flex min-h-11 items-center gap-2 rounded-lg border border-transparent px-3 text-sm font-semibold text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground",
                  isActive &&
                    "border-primary/30 bg-primary/10 text-primary shadow-[0_0_24px_var(--glow-primary)]",
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
            className="ml-2 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-bold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            to="/account"
          >
            <UserRound aria-hidden="true" className="size-4" />
            Account
          </Link>
        ) : (
          <Link
            className="brand-gradient-surface ml-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-extrabold transition-transform hover:-translate-y-0.5"
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
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary/50 lg:hidden"
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
          className="fixed inset-x-3 top-[4.75rem] z-50 max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-2xl border border-border bg-popover p-2 shadow-[var(--shadow-popover)] lg:hidden"
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
                    isActive && "bg-primary/10 text-primary",
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
              className="brand-gradient-surface mt-2 flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold"
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
