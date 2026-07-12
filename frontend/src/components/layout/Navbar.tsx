import { memo } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Activity,
  BotMessageSquare,
  ClipboardList,
  LogIn,
  Map,
  Sparkles,
  Train,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavigationItem {
  href: string;
  label: string;
  icon: typeof BotMessageSquare;
}

const fanItems: readonly NavigationItem[] = [
  { href: "/", label: "Home", icon: Activity },
  { href: "/demo", label: "Demo", icon: Sparkles },
  { href: "/concierge", label: "Concierge", icon: BotMessageSquare },
  { href: "/wayfinding", label: "Wayfinding", icon: Map },
  { href: "/travel", label: "Travel", icon: Train },
];

const opsItems: readonly NavigationItem[] = [
  { href: "/ops", label: "Crowd", icon: Activity },
  { href: "/ops/incidents", label: "Incidents", icon: ClipboardList },
  { href: "/ops/briefings", label: "Briefings", icon: BotMessageSquare },
];

/** Role-aware navigation - ghost links on desktop, icon bar on mobile. */
export const Navbar = memo(function Navbar() {
  const { role, user } = useAuth();
  const items = role === "fan" ? fanItems : opsItems;

  return (
    <>
      {/* Desktop: ghost text nav */}
      <nav
        aria-label="Primary navigation"
        className="hidden items-center gap-1 md:flex"
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "relative inline-flex min-h-9 items-center gap-1.5 px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground",
                  isActive && "text-foreground",
                  // Active underline
                  isActive &&
                    "after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-primary after:content-['']",
                )
              }
              end={item.href === "/" || item.href === "/ops"}
              key={item.href}
              to={item.href}
            >
              <Icon aria-hidden="true" className="size-3.5" />
              {item.label}
            </NavLink>
          );
        })}
        {!user && (
          <Link
            className="ml-2 inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-primary/40 bg-primary/5 px-4 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
            to="/login"
          >
            <LogIn aria-hidden="true" className="size-3.5" />
            Sign in
          </Link>
        )}
      </nav>

      {/* Mobile: bottom icon bar */}
      <nav
        aria-label="Mobile navigation"
        className="no-scrollbar fixed inset-x-3 bottom-3 z-50 flex items-center justify-around gap-0 overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/80 p-2 shadow-[0_8px_40px_rgba(0,0,0,0.7)] backdrop-blur-2xl md:hidden"
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "flex min-h-10 min-w-[3.5rem] flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-medium text-muted-foreground transition-colors duration-200",
                  isActive && "text-primary",
                )
              }
              end={item.href === "/" || item.href === "/ops"}
              key={item.href}
              to={item.href}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "grid size-8 place-content-center rounded-lg transition-colors",
                      isActive && "bg-primary/10",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="hidden sm:block">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
        {!user && (
          <NavLink
            aria-label="Sign in"
            className="flex min-h-10 min-w-[3.5rem] flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-medium text-muted-foreground transition-colors"
            to="/login"
          >
            <span className="grid size-8 place-content-center rounded-lg">
              <LogIn aria-hidden="true" className="size-4" />
            </span>
          </NavLink>
        )}
      </nav>
    </>
  );
});
