import { lazy, Suspense, type ReactNode } from "react";
import { motion } from "motion/react";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

const WireframeSphere = lazy(
  () => import("@/components/visuals/WireframeSphere"),
);

interface PageHeroProps {
  badge?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  visual?: ReactNode;
  className?: string;
  showSphere?: boolean;
  fullViewport?: boolean;
}

/** Cinematic page hero. Full-viewport option for landing pages, compact for inner pages. */
export function PageHero({
  badge,
  title,
  description,
  actions,
  meta,
  visual,
  className,
  showSphere = false,
  fullViewport = false,
}: PageHeroProps): JSX.Element {
  const reducedMotion = useReducedMotionSafe();

  const content = (
    <div
      className={cn(
        "relative overflow-hidden border-b border-white/[0.06]",
        fullViewport
          ? "flex min-h-[92vh] flex-col items-start justify-end pb-16 pt-24 px-5 lg:px-10"
          : "rounded-xl border border-white/[0.08] bg-white/[0.01] p-6 backdrop-blur-xl md:p-10 lg:grid lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-10",
        className,
      )}
    >
      {/* Background decorations */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_30%,rgba(0,255,136,0.06),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_20%,rgba(0,212,255,0.05),transparent_65%)]" />
        {fullViewport && (
          <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:60px_60px]" />
        )}
      </div>

      <div
        className={cn(
          "relative z-10",
          fullViewport ? "max-w-4xl" : "max-w-2xl",
        )}
      >
        {badge && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {badge}
          </motion.div>
        )}

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        >
          <h1
            className={cn(
              "font-display font-bold leading-none tracking-tight text-foreground",
              fullViewport
                ? "mt-6 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl"
                : "mt-5 text-4xl sm:text-5xl lg:text-6xl",
            )}
          >
            {title}
          </h1>
        </motion.div>

        {description && (
          <motion.p
            className={cn(
              "mt-5 max-w-xl leading-7 text-muted-foreground",
              fullViewport ? "text-base md:text-lg" : "text-base",
            )}
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          >
            {description}
          </motion.p>
        )}

        {actions && (
          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
          >
            {actions}
          </motion.div>
        )}

        {meta && (
          <motion.div
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            {meta}
          </motion.div>
        )}
      </div>

      {(showSphere || visual) && (
        <div className="relative z-10 mt-8 min-h-72 lg:mt-0">
          {visual ??
            (showSphere &&
              (reducedMotion ? (
                <div className="grid h-full min-h-72 place-content-center rounded-xl border border-white/[0.07] bg-white/[0.02] p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Live venue intelligence visualization
                  </p>
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="h-full min-h-72 animate-pulse rounded-xl bg-white/[0.03]" />
                  }
                >
                  <WireframeSphere />
                </Suspense>
              )))}
        </div>
      )}
    </div>
  );

  return content;
}
