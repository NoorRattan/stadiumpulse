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
    <nav aria-label="Primary navigation" className="flex flex-wrap gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            className={({ isActive }) =>
              cn(
                "inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive && "bg-muted text-foreground",
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
