import type { ReactNode } from "react";
import { motion } from "motion/react";

import { MagneticCard } from "@/components/motion/MagneticCard";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  magnetic?: boolean;
  accentColor?: "primary" | "accent" | "secondary";
  delay?: number;
}

/** Glassmorphism surface with optional magnetic tilt, glow border, and fade-in entrance. */
export function GlassCard({
  children,
  className,
  hover = false,
  magnetic = false,
  accentColor = "primary",
  delay = 0,
}: GlassCardProps): JSX.Element {
  const reduced = useReducedMotionSafe();

  const glowColor = {
    primary:
      "hover:border-primary/40 hover:shadow-[0_0_40px_var(--glow-primary)]",
    accent: "hover:border-accent/40 hover:shadow-[0_0_40px_var(--glow-accent)]",
    secondary:
      "hover:border-secondary/40 hover:shadow-[0_0_40px_var(--glow-accent)]",
  }[accentColor];

  const inner = (
    <div
      className={cn(
        "relative rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] backdrop-blur-xl",
        hover && cn("cursor-pointer transition-all duration-300", glowColor),
        className,
      )}
    >
      {/* Top accent line */}
      {hover && (
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            accentColor === "primary" &&
              "bg-gradient-to-r from-transparent via-primary/50 to-transparent",
            accentColor === "accent" &&
              "bg-gradient-to-r from-transparent via-accent/50 to-transparent",
            accentColor === "secondary" &&
              "bg-gradient-to-r from-transparent via-secondary/50 to-transparent",
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );

  const wrapped = magnetic ? (
    <MagneticCard className="group">{inner}</MagneticCard>
  ) : (
    <div className="group">{inner}</div>
  );

  if (reduced) return wrapped;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {wrapped}
    </motion.div>
  );
}
