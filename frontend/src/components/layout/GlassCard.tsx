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
      "hover:shadow-[0_0_50px_rgba(0,255,136,0.1)] hover:border-[rgba(0,255,136,0.2)]",
    accent:
      "hover:shadow-[0_0_50px_rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.2)]",
    secondary:
      "hover:shadow-[0_0_50px_rgba(255,107,53,0.1)] hover:border-[rgba(255,107,53,0.2)]",
  }[accentColor];

  const inner = (
    <div
      className={cn(
        "relative rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl",
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
