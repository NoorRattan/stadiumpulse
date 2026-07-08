import { memo } from "react";
import { motion } from "motion/react";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import type { RouteOption } from "@/types/domain";

/** Props for the route-line visualizer. */
export interface RouteLineProps {
  route: RouteOption | null;
  generatedBy?: "ai" | "fallback";
}

/** Animated route line with an instant equivalent for reduced motion. */
export const RouteLine = memo(function RouteLine({
  route,
  generatedBy = "ai",
}: RouteLineProps) {
  const reducedMotion = useReducedMotionSafe();
  const steps = route?.steps ?? [];

  if (!route || steps.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Select a start and destination to preview a route.
      </div>
    );
  }

  const path = "M24 96 C 96 24, 168 168, 240 96 S 384 24, 456 96";

  return (
    <figure
      aria-label={`Route preview with ${steps.length} steps`}
      className="rounded-lg border border-border bg-card p-4"
      data-motion={reducedMotion ? "static" : "animated"}
    >
      {generatedBy === "fallback" && (
        <p className="mb-3 text-sm text-secondary">
          Showing the standard route. Live directions are temporarily
          unavailable.
        </p>
      )}
      <svg
        aria-hidden="true"
        className="h-40 w-full"
        focusable="false"
        role="img"
        viewBox="0 0 480 192"
      >
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-muted"
          strokeLinecap="round"
        />
        <motion.path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-accent"
          strokeLinecap="round"
          initial={reducedMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 1.2 }}
        />
        {steps.map((step, index) => {
          const x = 24 + index * (432 / Math.max(steps.length - 1, 1));
          return (
            <circle
              className="text-secondary"
              cx={x}
              cy={index % 2 === 0 ? 96 : 72}
              fill="currentColor"
              key={`${step.zoneId}-${index}`}
              r="7"
            />
          );
        })}
      </svg>
      <figcaption className="mt-2 text-sm text-muted-foreground">
        Estimated time: {route.estimatedMinutes} minutes. Congestion:{" "}
        {route.congestionLevel}.
      </figcaption>
    </figure>
  );
});
