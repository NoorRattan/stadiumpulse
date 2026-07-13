import { useEffect, useRef } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useTheme } from "@/hooks/useTheme";

const THEME_BACKGROUND = {
  light: "#f7faf9",
  dark: "#07110d",
} as const;

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
  const next = theme === "dark" ? "light" : "dark";

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
    context.fillStyle = THEME_BACKGROUND[incomingTheme];
    const originX = event.clientX;
    const originY = event.clientY;
    const farthestX = Math.max(originX, window.innerWidth - originX);
    const farthestY = Math.max(originY, window.innerHeight - originY);
    const maxRadius = Math.hypot(farthestX, farthestY) + 72;
    const startedAt = performance.now();
    const duration = 620;

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      drawWave(
        context,
        originX,
        originY,
        maxRadius * eased,
        16 * (1 - progress) + 4,
        progress * Math.PI * 4,
      );
      if (progress < 1) {
        animationFrame.current = window.requestAnimationFrame(animate);
        return;
      }
      setTheme(incomingTheme);
      canvas.style.transition = "opacity 120ms ease-out";
      animationFrame.current = window.requestAnimationFrame(() => {
        canvas.style.opacity = "0";
        window.setTimeout(removeOverlay, 140);
      });
    };
    animationFrame.current = window.requestAnimationFrame(animate);
  };

  return (
    <Button
      aria-label={`Switch to ${next} theme`}
      className="relative size-11 shrink-0 overflow-hidden rounded-lg border-border bg-card text-foreground shadow-sm hover:bg-muted"
      onClick={handleThemeChange}
      size="icon"
      type="button"
      variant="outline"
    >
      {theme === "dark" ? (
        <Sun aria-hidden="true" className="relative z-10" />
      ) : (
        <Moon aria-hidden="true" className="relative z-10" />
      )}
    </Button>
  );
}
