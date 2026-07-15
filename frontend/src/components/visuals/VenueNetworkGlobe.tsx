import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { ChevronLeft, ChevronRight, Rotate3D } from "lucide-react";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

import {
  createVenueStars,
  radians,
  renderVenueScene,
  venueNodes,
  type ProjectedNode,
} from "./venueNetworkScene";

/** Lightweight real-time 3D projection with drag, keyboard, and venue selection. */
export function VenueNetworkGlobe(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const rotationRef = useRef({ x: radians(-12), y: radians(104) });
  const pointerRef = useRef({ id: -1, x: 0, y: 0, moved: false });
  const projectedRef = useRef<ProjectedNode[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(12);
  const [dragging, setDragging] = useState(false);
  const pulseRef = useRef(0); // for pulsing animation
  const reducedMotion = useReducedMotionSafe();
  const selected = venueNodes[selectedIndex];

  const stars = useMemo(() => createVenueStars(), []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    projectedRef.current = renderVenueScene({
      canvas,
      container,
      pulse: pulseRef.current,
      rotation: rotationRef.current,
      selected,
      stars,
    });
  }, [selected, stars]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    const themeObserver = new MutationObserver(draw);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-contrast"],
    });
    return () => {
      observer.disconnect();
      themeObserver.disconnect();
    };
  }, [draw]);

  useEffect(() => {
    let previous = performance.now();
    const animate = (now: number) => {
      if (!reducedMotion && !dragging) {
        const delta = Math.min(now - previous, 40);
        rotationRef.current.y += delta * 0.00013;
        pulseRef.current += 1;
      }
      previous = now;
      draw();
      if (!reducedMotion) animationRef.current = requestAnimationFrame(animate);
    };
    draw();
    if (!reducedMotion) animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dragging, draw, reducedMotion]);

  const selectRelative = (offset: number) => {
    setSelectedIndex(
      (current) => (current + offset + venueNodes.length) % venueNodes.length,
    );
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (pointerRef.current.id !== event.pointerId) return;
    const deltaX = event.clientX - pointerRef.current.x;
    const deltaY = event.clientY - pointerRef.current.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 2)
      pointerRef.current.moved = true;
    rotationRef.current.y += deltaX * 0.008;
    rotationRef.current.x = Math.max(
      radians(-65),
      Math.min(radians(65), rotationRef.current.x + deltaY * 0.006),
    );
    pointerRef.current.x = event.clientX;
    pointerRef.current.y = event.clientY;
    draw();
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (pointerRef.current.id !== event.pointerId) return;
    if (!pointerRef.current.moved) {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const target = projectedRef.current
        .filter((node) => node.depth > -0.15)
        .map((node) => ({
          node,
          distance: Math.hypot(node.screenX - x, node.screenY - y),
        }))
        .sort((a, b) => a.distance - b.distance)[0];
      if (target && target.distance <= 20) {
        const index = venueNodes.findIndex(
          (venue) => venue.code === target.node.code,
        );
        if (index >= 0) setSelectedIndex(index);
      }
    }
    pointerRef.current.id = -1;
    setDragging(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      selectRelative(1);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      selectRelative(-1);
    }
  };

  const detailId = useMemo(
    () => `venue-detail-${selected.code}`,
    [selected.code],
  );

  return (
    <section
      aria-labelledby={detailId}
      className="pulse-network relative aspect-square min-h-[390px] overflow-hidden rounded-2xl border border-border bg-card/55 shadow-[var(--shadow-card)]"
      ref={containerRef}
    >
      {/* Top HUD */}
      <div className="pointer-events-none absolute inset-x-5 top-5 z-10 flex justify-between font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground sm:inset-x-7 sm:top-7">
        <span>· Network · WC26</span>
        <span className="flex items-center gap-1.5 text-primary">
          <span className="inline-block h-1.5 w-1.5 animate-[live-pulse_2s_ease-in-out_infinite] rounded-full bg-primary" />
          Live 16 venues
        </span>
      </div>

      {reducedMotion ? (
        <div
          aria-describedby={detailId}
          aria-label="Static 3D World Cup host-city network. Use arrow keys to select venues."
          aria-valuemax={venueNodes.length - 1}
          aria-valuemin={0}
          aria-valuenow={selectedIndex}
          aria-valuetext={`${selected.city}, ${selected.country}`}
          className="absolute inset-0 grid size-full place-items-center outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          onKeyDown={handleKeyDown}
          role="slider"
          tabIndex={0}
        >
          <svg
            aria-hidden="true"
            className="h-[72%] w-[82%]"
            fill="none"
            viewBox="0 0 420 420"
          >
            <defs>
              <radialGradient id="static-globe-fill" cx="35%" cy="30%">
                <stop
                  offset="0"
                  stopColor="var(--brand-cyan)"
                  stopOpacity=".2"
                />
                <stop
                  offset="1"
                  stopColor="var(--brand-magenta)"
                  stopOpacity=".04"
                />
              </radialGradient>
              <linearGradient id="static-orbit" x1="0" x2="1">
                <stop stopColor="var(--brand-cyan)" />
                <stop offset=".55" stopColor="var(--brand-magenta)" />
                <stop offset="1" stopColor="var(--brand-amber)" />
              </linearGradient>
            </defs>
            <circle cx="210" cy="205" fill="url(#static-globe-fill)" r="142" />
            <circle
              cx="210"
              cy="205"
              r="142"
              stroke="var(--brand-cyan)"
              strokeOpacity=".75"
            />
            {[52, 96, 126].map((radius) => (
              <ellipse
                cx="210"
                cy="205"
                key={radius}
                rx={radius}
                ry="142"
                stroke="var(--brand-cyan)"
                strokeOpacity=".38"
              />
            ))}
            {[-84, -42, 0, 42, 84].map((offset) => (
              <ellipse
                cx="210"
                cy={205 + offset}
                key={offset}
                rx={Math.sqrt(142 ** 2 - offset ** 2)}
                ry="26"
                stroke="var(--brand-cyan)"
                strokeOpacity=".38"
              />
            ))}
            <ellipse
              cx="210"
              cy="205"
              rx="198"
              ry="48"
              stroke="url(#static-orbit)"
              strokeWidth="2"
              transform="rotate(-11 210 205)"
            />
            <circle cx="254" cy="112" fill="var(--brand-magenta)" r="7" />
            <circle
              cx="254"
              cy="112"
              r="14"
              stroke="var(--brand-magenta)"
              strokeOpacity=".45"
            />
            <text
              fill="var(--foreground)"
              fontFamily="monospace"
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              x="254"
              y="91"
            >
              {selected.code}
            </text>
          </svg>
        </div>
      ) : (
        <canvas
          aria-describedby={detailId}
          aria-label="Interactive 3D World Cup host-city network. Drag to rotate and use arrow keys to select venues."
          aria-valuemax={venueNodes.length - 1}
          aria-valuemin={0}
          aria-valuenow={selectedIndex}
          aria-valuetext={`${selected.city}, ${selected.country}`}
          className={`absolute inset-0 size-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          onKeyDown={handleKeyDown}
          onPointerCancel={handlePointerUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          ref={canvasRef}
          role="slider"
          tabIndex={0}
        />
      )}

      {/* Bottom node info panel */}
      <div className="absolute inset-x-4 bottom-4 z-10 flex items-end justify-between gap-3 rounded-xl border border-border bg-background/80 p-3 backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:p-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-primary">
            <Rotate3D aria-hidden="true" className="size-3.5" /> Selected node
          </p>
          <h2
            className="mt-1 truncate font-display text-base font-bold"
            id={detailId}
          >
            {selected.city}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {selected.country} · {selected.latitude.toFixed(2)},{" "}
            {selected.longitude.toFixed(2)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2 sm:mr-32">
          <button
            aria-label="Select previous host city"
            className="grid size-10 place-content-center rounded-lg border border-border bg-card transition-colors hover:border-primary/60 hover:bg-primary/10"
            onClick={() => selectRelative(-1)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <button
            aria-label="Select next host city"
            className="grid size-10 place-content-center rounded-lg border border-border bg-card transition-colors hover:border-primary/60 hover:bg-primary/10"
            onClick={() => selectRelative(1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
