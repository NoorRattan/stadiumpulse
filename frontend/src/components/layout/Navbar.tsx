import { memo, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

const primaryItems = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Live Demo" },
  { href: "/fan", label: "Fan" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/staff", label: "Staff" },
  { href: "/organizer", label: "Organizer" },
] as const;

function DesktopNavigation(): JSX.Element {
  return (
    <nav
      aria-label="Primary navigation"
      className="hidden items-center gap-1 lg:flex"
    >
      {primaryItems.map((item) => (
        <NavLink
          className={({ isActive }) =>
            cn(
              "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground",
              isActive &&
                "bg-primary text-primary-foreground shadow-[0_0_26px_var(--glow-primary)]",
            )
          }
          end={item.href === "/"}
          key={item.href}
          to={item.href}
        >
          {item.label}
        </NavLink>
      ))}
      <a
        className="brand-gradient-surface ml-2 inline-flex min-h-10 items-center rounded-full px-5 text-sm font-extrabold shadow-[0_0_24px_var(--glow-accent)] transition-transform hover:-translate-y-0.5"
        href="https://www.fifa.com/tickets"
        rel="noreferrer"
        target="_blank"
      >
        Get Tickets
      </a>
    </nav>
  );
}

function MobileMenuToggle({
  onToggle,
  open,
}: {
  onToggle: () => void;
  open: boolean;
}): JSX.Element {
  const Icon = open ? X : Menu;
  return (
    <button
      aria-controls="mobile-navigation-panel"
      aria-expanded={open}
      aria-label="Toggle menu"
      className="grid size-11 place-content-center rounded-lg border border-border bg-card text-foreground lg:hidden"
      onClick={onToggle}
      type="button"
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}

function MobileNavigation({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 top-16 z-50 border-b border-border bg-background px-6 py-4 shadow-[var(--shadow-popover)] lg:hidden"
      id="mobile-navigation-panel"
    >
      <div className="mx-auto grid max-w-7xl gap-1">
        {primaryItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                "flex min-h-12 items-center rounded-lg px-4 text-sm font-semibold text-foreground hover:bg-muted",
                isActive && "bg-primary text-primary-foreground",
              )
            }
            end={item.href === "/"}
            key={item.href}
            onClick={onNavigate}
            to={item.href}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/** Primary navigation with an evaluator-visible demo path and mobile drawer. */
export const Navbar = memo(function Navbar() {
  const [open, setOpen] = useState(false);

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
      <DesktopNavigation />
      <MobileMenuToggle
        onToggle={() => setOpen((current) => !current)}
        open={open}
      />
      {open && <MobileNavigation onNavigate={() => setOpen(false)} />}
    </>
  );
});
