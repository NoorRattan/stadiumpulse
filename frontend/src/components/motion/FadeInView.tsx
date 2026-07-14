import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

interface FadeInViewProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  children: ReactNode;
  delay?: number;
}

/** Scroll-reveal wrapper with reduced-motion fallback. */
export function FadeInView({
  children,
  className,
  delay = 0,
  style,
  ...props
}: FadeInViewProps): JSX.Element {
  const reducedMotion = useReducedMotionSafe();
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const canObserve = typeof IntersectionObserver !== "undefined";

  useEffect(() => {
    if (reducedMotion || !canObserve) return;
    const element = container.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -60px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [canObserve, reducedMotion]);

  const revealStyle = {
    ...style,
    "--reveal-delay": `${Math.max(0, delay) * 1000}ms`,
  } as CSSProperties;

  return (
    <div
      className={cn("reveal-frame", className)}
      data-visible={visible || reducedMotion || !canObserve}
      ref={container}
      style={revealStyle}
      {...props}
    >
      {children}
    </div>
  );
}
