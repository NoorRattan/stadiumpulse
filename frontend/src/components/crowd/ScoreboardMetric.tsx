import { memo } from "react";
import { motion } from "motion/react";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

/** Props for a live scoreboard metric. */
export interface ScoreboardMetricProps {
  label: string;
  value: number | string;
  suffix?: string;
  helperText?: string;
}

/** Live metric display with instant reduced-motion value swaps. */
export const ScoreboardMetric = memo(function ScoreboardMetric({
  label,
  value,
  suffix = "",
  helperText,
}: ScoreboardMetricProps) {
  const reducedMotion = useReducedMotionSafe();
  const displayValue = `${value}${suffix}`;

  return (
    <section
      aria-label={label}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition hover:border-primary/20"
      data-motion={reducedMotion ? "static" : "animated"}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      {reducedMotion ? (
        <p className="mt-2 font-mono text-4xl font-black text-foreground">
          {displayValue}
        </p>
      ) : (
        <motion.p
          key={displayValue}
          className="mt-2 font-mono text-4xl font-black text-foreground"
          initial={{ rotateX: -70, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {displayValue}
        </motion.p>
      )}
      {helperText && (
        <p className="mt-2 text-sm text-muted-foreground">{helperText}</p>
      )}
    </section>
  );
});
