import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "motion/react";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  className?: string;
  duration?: number;
}

/** Live counting metric with spring animation, inspired by v0 compute dashboards. */
export function AnimatedCounter({
  value,
  suffix = "",
  className,
  duration = 1.2,
}: AnimatedCounterProps): JSX.Element {
  const reducedMotion = useReducedMotionSafe();
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [text, setText] = useState("0");
  const displayText = reducedMotion ? String(value) : text;

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    spring.set(value);
    return display.on("change", (latest) => setText(String(latest)));
  }, [display, reducedMotion, spring, value]);

  if (reducedMotion) {
    return (
      <span className={cn("font-mono tabular-nums", className)}>
        {displayText}
        {suffix}
      </span>
    );
  }

  return (
    <motion.span
      className={cn("font-mono tabular-nums", className)}
      key={value}
      initial={{ opacity: 0.6, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {displayText}
      {suffix}
    </motion.span>
  );
}
