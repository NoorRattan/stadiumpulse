import { useCallback, useEffect, useRef } from "react";
import { Moon, Sun } from "lucide-react";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useTheme } from "@/hooks/useTheme";

type ThemeName = "light" | "dark";

function drawWave(
  context: CanvasRenderingContext2D,
  {
    amplitude,
    originX,
    originY,
    phase,
    radius,
  }: {
    amplitude: number;
    originX: number;
    originY: number;
    phase: number;
    radius: number;
  },
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

function createWaveCanvas(theme: ThemeName) {
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
  const context = canvas.getContext("2d");
  context?.scale(pixelRatio, pixelRatio);
  if (context) context.fillStyle = theme === "dark" ? "#0b1121" : "#f0f4f8";
  return { canvas, context };
}

interface WaveAnimationOptions {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  event: React.MouseEvent<HTMLButtonElement>;
  finish: () => void;
  schedule: (callback: FrameRequestCallback) => void;
}

function startWaveAnimation({
  canvas,
  context,
  event,
  finish,
  schedule,
}: WaveAnimationOptions) {
  const originX = event.clientX;
  const originY = event.clientY;
  const farthestX = Math.max(originX, window.innerWidth - originX);
  const farthestY = Math.max(originY, window.innerHeight - originY);
  const maxRadius = Math.hypot(farthestX, farthestY) + 72;
  const startedAt = performance.now();
  const animate = (now: number) => {
    const progress = Math.min((now - startedAt) / 680, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawWave(context, {
      amplitude: 18 * (1 - progress) + 3,
      originX,
      originY,
      phase: progress * Math.PI * 5,
      radius: maxRadius * eased,
    });
    if (progress < 1) {
      schedule(animate);
      return;
    }
    finish();
    canvas.style.transition = "opacity 140ms ease-out";
    schedule(() => {
      canvas.style.opacity = "0";
    });
  };
  schedule(animate);
}

function useThemeTransition(
  reducedMotion: boolean,
  setTheme: (theme: ThemeName) => void,
) {
  const animationFrame = useRef<number>();
  const overlay = useRef<HTMLCanvasElement | null>(null);
  const removeOverlay = useCallback(() => {
    if (animationFrame.current !== undefined) {
      window.cancelAnimationFrame(animationFrame.current);
      animationFrame.current = undefined;
    }
    overlay.current?.remove();
    overlay.current = null;
  }, []);
  useEffect(() => removeOverlay, [removeOverlay]);

  return (
    event: React.MouseEvent<HTMLButtonElement>,
    incomingTheme: ThemeName,
  ) => {
    removeOverlay();
    if (reducedMotion) {
      setTheme(incomingTheme);
      return;
    }
    const { canvas, context } = createWaveCanvas(incomingTheme);
    overlay.current = canvas;
    if (!context) {
      removeOverlay();
      setTheme(incomingTheme);
      return;
    }
    const schedule = (callback: FrameRequestCallback) => {
      animationFrame.current = window.requestAnimationFrame(callback);
    };
    startWaveAnimation({
      canvas,
      context,
      event,
      finish: () => {
        setTheme(incomingTheme);
        window.setTimeout(removeOverlay, 160);
      },
      schedule,
    });
  };
}

export function ThemeToggle(): JSX.Element {
  const { theme, setTheme } = useTheme();
  const reducedMotion = useReducedMotionSafe();
  const isDark = theme === "dark";
  const next = isDark ? "light" : "dark";
  const transitionTheme = useThemeTransition(reducedMotion, setTheme);
  const Icon = isDark ? Moon : Sun;
  return (
    <button
      aria-label={`Switch to ${next} theme`}
      className="theme-toggle-pill"
      onClick={(event) => transitionTheme(event, next)}
      title={`Switch to ${next} theme`}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`theme-toggle-thumb ${isDark ? "theme-toggle-thumb--dark" : "theme-toggle-thumb--light"}`}
      >
        <Icon className="size-3.5" strokeWidth={2} />
      </span>
      <span className="theme-toggle-text" aria-hidden="true">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
