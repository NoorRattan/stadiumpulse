import { useEffect, useRef } from "react";
import { Moon, Sun } from "lucide-react";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useTheme } from "@/hooks/useTheme";

function drawWave(
  context: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  radius: number,
  amplitude: number,
  phase: number,
): void {
  const points = 96;
  context.beginPath();
  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * Math.PI * 2;
    const ripple = amplitude * Math.sin(angle * 7 + phase);
    const x = originX + Math.cos(angle) * (radius + ripple);
    const y = originY + Math.sin(angle) * (radius + ripple);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fill();
}

export function ThemeToggle(): JSX.Element {
  const { theme, setTheme } = useTheme();
  const reducedMotion = useReducedMotionSafe();
  const animationFrame = useRef<number>();
  const overlay = useRef<HTMLCanvasElement | null>(null);
  const isDark = theme === "dark";
  const next = isDark ? "light" : "dark";

  const removeOverlay = () => {
    if (animationFrame.current !== undefined) {
      window.cancelAnimationFrame(animationFrame.current);
      animationFrame.current = undefined;
    }
    overlay.current?.remove();
    overlay.current = null;
  };

  useEffect(() => removeOverlay, []);

  const handleThemeChange = (event: React.MouseEvent<HTMLButtonElement>) => {
    const incomingTheme = next;
    removeOverlay();
    if (reducedMotion) {
      setTheme(incomingTheme);
      return;
    }

    const canvas = document.createElement("canvas");
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(window.innerWidth * pixelRatio);
    canvas.height = Math.ceil(window.innerHeight * pixelRatio);
    canvas.dataset.themeWaveOverlay = "true";
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "9999",
      pointerEvents: "none",
    });
    document.body.append(canvas);
    overlay.current = canvas;

    const context = canvas.getContext("2d");
    if (!context) {
      removeOverlay();
      setTheme(incomingTheme);
      return;
    }
    context.scale(pixelRatio, pixelRatio);
    context.fillStyle = incomingTheme === "dark" ? "#0b1121" : "#f0f4f8";

    const originX = event.clientX;
    const originY = event.clientY;
    const farthestX = Math.max(originX, window.innerWidth - originX);
    const farthestY = Math.max(originY, window.innerHeight - originY);
    const maxRadius = Math.hypot(farthestX, farthestY) + 72;
    const startedAt = performance.now();
    const duration = 680;

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      drawWave(
        context,
        originX,
        originY,
        maxRadius * eased,
        18 * (1 - progress) + 3,
        progress * Math.PI * 5,
      );
      if (progress < 1) {
        animationFrame.current = window.requestAnimationFrame(animate);
        return;
      }
      setTheme(incomingTheme);
      canvas.style.transition = "opacity 140ms ease-out";
      animationFrame.current = window.requestAnimationFrame(() => {
        canvas.style.opacity = "0";
        window.setTimeout(removeOverlay, 160);
      });
    };
    animationFrame.current = window.requestAnimationFrame(animate);
  };

  return (
    <button
      aria-label={`Switch to ${next} theme`}
      onClick={handleThemeChange}
      title={`Switch to ${next} theme`}
      type="button"
      className="theme-toggle-pill"
    >
      {/* Sliding thumb */}
      <span
        className={`theme-toggle-thumb ${isDark ? "theme-toggle-thumb--dark" : "theme-toggle-thumb--light"}`}
        aria-hidden="true"
      >
        {isDark ? (
          <Moon className="size-3.5" strokeWidth={2} />
        ) : (
          <Sun className="size-3.5" strokeWidth={2} />
        )}
      </span>
      {/* Label */}
      <span className="theme-toggle-text" aria-hidden="true">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
