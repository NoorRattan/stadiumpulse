import { useEffect, useRef } from "react";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

interface AtmosphericShaderProps {
  className?: string;
  intensity?: "subtle" | "vivid";
}

/** Full-bleed animated gradient shader used as the global atmospheric backdrop. */
export function AtmosphericShader({
  className,
  intensity = "subtle",
}: AtmosphericShaderProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotionSafe();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let animationId = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;

      const time = reducedMotion ? 0 : frame * 0.004;
      const gradient = context.createRadialGradient(
        width * (0.35 + Math.sin(time * 0.7) * 0.08),
        height * (0.25 + Math.cos(time * 0.5) * 0.06),
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85,
      );

      if (intensity === "vivid") {
        gradient.addColorStop(0, "rgba(0, 255, 136, 0.22)");
        gradient.addColorStop(0.35, "rgba(0, 212, 255, 0.14)");
        gradient.addColorStop(0.65, "rgba(255, 107, 53, 0.08)");
        gradient.addColorStop(1, "rgba(3, 3, 3, 0)");
      } else {
        gradient.addColorStop(0, "rgba(0, 255, 136, 0.12)");
        gradient.addColorStop(0.4, "rgba(0, 212, 255, 0.08)");
        gradient.addColorStop(0.7, "rgba(120, 80, 255, 0.05)");
        gradient.addColorStop(1, "rgba(3, 3, 3, 0)");
      }

      context.clearRect(0, 0, width, height);
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      const meshGradient = context.createLinearGradient(
        width * Math.sin(time * 0.3),
        0,
        width,
        height,
      );
      meshGradient.addColorStop(0, "rgba(255, 255, 255, 0.02)");
      meshGradient.addColorStop(0.5, "rgba(0, 212, 255, 0.04)");
      meshGradient.addColorStop(1, "rgba(0, 255, 136, 0.03)");
      context.globalCompositeOperation = "screen";
      context.fillStyle = meshGradient;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";

      frame += 1;
      if (!reducedMotion) {
        animationId = window.requestAnimationFrame(draw);
      }
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationId);
    };
  }, [intensity, reducedMotion]);

  return (
    <canvas
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
      ref={canvasRef}
    />
  );
}
