import { memo, useEffect, useRef } from "react";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useTheme } from "@/hooks/useTheme";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

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
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const reduced = useReducedMotionSafe();
  const { theme } = useTheme();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let particles: Particle[] = [];
    let active = !document.hidden;
    const rootStyles = window.getComputedStyle(document.documentElement);
    const readToken = (name: string) =>
      rootStyles.getPropertyValue(name).trim();
    const colors = [
      readToken("--brand-cyan"),
      readToken("--brand-magenta"),
      readToken("--brand-amber"),
      readToken("--foreground"),
    ].filter(Boolean);
    const connectionColor = readToken("--brand-cyan");

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(W * pixelRatio));
      canvas.height = Math.max(1, Math.floor(H * pixelRatio));
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const spawn = (): Particle => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      size: Math.random() * 1.6 + 0.4,
      opacity: Math.random() * 0.5 + 0.1,
      color:
        colors[Math.floor(Math.random() * colors.length)] ?? connectionColor,
    });

    const init = () => {
      particles = Array.from({ length: count }, spawn);
    };

    const draw = () => {
      if (!active) return;
      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse repel
        if (mouseRepel) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared > 0 && distanceSquared < 10_000) {
            const dist = Math.sqrt(distanceSquared);
            const force = (100 - dist) / 100;
            p.vx += (dx / dist) * force * 0.3;
            p.vy += (dy / dist) * force * 0.3;
          }
        }

        // Dampen velocity
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < 6_400) {
            const d = Math.sqrt(distanceSquared);
            const alpha = (1 - d / 80) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = connectionColor;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    const handleVisibilityChange = () => {
      active = !document.hidden;
      if (active) {
        cancelAnimationFrame(animRef.current);
        animRef.current = requestAnimationFrame(draw);
      }
    };

    resize();
    init();
    draw();

    const ro = new ResizeObserver(() => {
      resize();
      init();
    });
    ro.observe(canvas);

    if (mouseRepel) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      canvas.addEventListener("mouseleave", handleMouseLeave);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      if (mouseRepel) {
        window.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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
