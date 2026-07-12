import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AtmosphericPanelProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  intensity?: "soft" | "strong";
}

/** Layered glass panel with animated shader accents for high-emphasis sections. */
export function AtmosphericPanel({
  children,
  className,
  contentClassName,
  intensity = "soft",
}: AtmosphericPanelProps): JSX.Element {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] text-card-foreground backdrop-blur-xl",
        intensity === "strong" && "shadow-[0_0_60px_rgba(0,255,136,0.06)]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(0,255,136,0.15),transparent_35%),radial-gradient(circle_at_78%_10%,rgba(0,212,255,0.12),transparent_38%)]",
          intensity === "soft" && "opacity-60",
        )}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:40px_40px]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 -top-20 size-64 rounded-full border border-white/10"
      />
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </section>
  );
}
