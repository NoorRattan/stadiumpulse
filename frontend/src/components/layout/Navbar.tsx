import { memo } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  BotMessageSquare,
  ClipboardList,
  Map,
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
  { href: "/concierge", label: "Concierge", icon: BotMessageSquare },
  { href: "/wayfinding", label: "Wayfinding", icon: Map },
  { href: "/travel", label: "Travel", icon: Train },
];

const opsItems: readonly NavigationItem[] = [
  { href: "/ops", label: "Crowd", icon: Activity },
  { href: "/ops/incidents", label: "Incidents", icon: ClipboardList },
  { href: "/ops/briefings", label: "Briefings", icon: BotMessageSquare },
];

/** Role-aware navigation that omits ops links entirely for fan users. */
export const Navbar = memo(function Navbar() {
  const { role } = useAuth();
  const items = role === "fan" ? fanItems : opsItems;

  return (
    <nav
      aria-label="Primary navigation"
      className="no-scrollbar fixed inset-x-3 bottom-3 z-50 flex max-w-none justify-around gap-1 overflow-x-auto rounded-full border border-border bg-background/94 p-1.5 shadow-2xl backdrop-blur-xl md:static md:max-w-[66vw] md:justify-start md:border-0 md:bg-transparent md:p-0 md:shadow-none"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            className={({ isActive }) =>
              cn(
                "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:text-sm md:gap-2 md:px-3",
                isActive &&
                  "bg-foreground text-background shadow-sm hover:bg-foreground hover:text-background",
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
    </nav>
  );
});
