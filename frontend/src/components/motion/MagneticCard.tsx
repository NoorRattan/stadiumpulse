import {
  useRef,
  type ReactNode,
  type MouseEvent,
  type CSSProperties,
} from "react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

interface MagneticCardProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

/**
 * Wraps children in a div that tilts and shifts slightly
 * toward the mouse cursor on hover - a magnetic "3D tilt" effect.
 */
export function MagneticCard({
  children,
  className = "",
  strength = 12,
}: MagneticCardProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionSafe();

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -strength * 0.5;
    const rotY = ((x - cx) / cx) * strength * 0.5;
    const tx = ((x - cx) / cx) * strength * 0.3;
    const ty = ((y - cy) / cy) * strength * 0.3;

    ref.current.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translate(${tx}px, ${ty}px) scale(1.02)`;
    ref.current.style.setProperty(
      "--mouse-x",
      `${Math.round((x / rect.width) * 100)}%`,
    );
    ref.current.style.setProperty(
      "--mouse-y",
      `${Math.round((y / rect.height) * 100)}%`,
    );
  };

  const handleLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform =
      "perspective(800px) rotateX(0deg) rotateY(0deg) translate(0px, 0px) scale(1)";
  };

  const style: CSSProperties = {
    transition: reduced
      ? "none"
      : "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
    willChange: "transform",
    transformStyle: "preserve-3d",
  };

  return (
    <div
      className={className}
      onMouseLeave={handleLeave}
      onMouseMove={handleMove}
      ref={ref}
      style={style}
    >
      {children}
    </div>
  );
}
