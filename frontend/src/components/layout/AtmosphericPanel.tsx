import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AtmosphericPanelProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  intensity?: "soft" | "strong";
}

/** Layered shader-style panel used for high-emphasis page sections. */
export function AtmosphericPanel({
  children,
  className,
  contentClassName,
  intensity = "soft",
}: AtmosphericPanelProps): JSX.Element {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-[12px_12px_0_rgb(0_0_0/0.22)] dark:shadow-[12px_12px_0_rgb(247_243_232/0.08)]",
        intensity === "strong" &&
          "bg-[linear-gradient(135deg,var(--card),var(--background)_72%)]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,var(--primary)_0,transparent_28%),radial-gradient(circle_at_78%_10%,var(--accent)_0,transparent_30%),radial-gradient(circle_at_50%_86%,var(--secondary)_0,transparent_24%)] opacity-45 mix-blend-screen"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgb(255_255_255/0.18)_42%,transparent_63%),linear-gradient(90deg,rgb(255_255_255/0.08)_1px,transparent_1px),linear-gradient(0deg,rgb(255_255_255/0.08)_1px,transparent_1px)] bg-[length:100%_100%,44px_44px,44px_44px] opacity-70"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 size-80 rounded-full border border-current/25"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-28 left-10 h-64 w-96 rotate-[-8deg] border border-current/20"
      />
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </section>
  );
}
