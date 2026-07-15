import { memo, useEffect, useRef } from "react";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useTheme } from "@/hooks/useTheme";

import { startParticleScene } from "./particleScene";

interface ParticleCanvasProps {
  className?: string;
  count?: number;
  mouseRepel?: boolean;
}

/** Full-canvas animated particle field with mouse-repel and connection lines. */
export const ParticleCanvas = memo(function ParticleCanvas({
  className = "",
  count = 120,
  mouseRepel = true,
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotionSafe();
  const { theme } = useTheme();

  useEffect(() => {
    if (reduced || !canvasRef.current) return;
    return startParticleScene(canvasRef.current, count, mouseRepel);
  }, [count, mouseRepel, reduced, theme]);

  if (reduced) return null;
  return (
    <canvas
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
});
