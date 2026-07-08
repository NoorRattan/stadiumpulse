import { memo } from "react";

import type { RouteOption } from "@/types/domain";

/** Props for the accessible route step list. */
export interface StepListProps {
  route: RouteOption | null;
}

/** Complete route rendered as a semantic ordered list. */
export const StepList = memo(function StepList({ route }: StepListProps) {
  const steps = route?.steps ?? [];

  if (steps.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Route steps will appear after a route is generated.
      </p>
    );
  }

  return (
    <ol className="grid gap-3" aria-label="Complete route steps">
      {steps.map((step, index) => (
        <li
          className="rounded-lg border border-border bg-card p-4"
          key={`${step.zoneId}-${index}`}
        >
          <p className="text-xs font-semibold text-accent">Step {index + 1}</p>
          <p className="mt-1 text-sm text-foreground">{step.instruction}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Zone: {step.zoneId}
          </p>
        </li>
      ))}
    </ol>
  );
});
