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

interface VenueNode {
  city: string;
  code: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface ProjectedNode extends VenueNode {
  screenX: number;
  screenY: number;
  depth: number;
}

const venues: VenueNode[] = [
  {
    city: "Vancouver",
    code: "YVR",
    country: "Canada",
    latitude: 49.28,
    longitude: -123.12,
  },
  {
    city: "Toronto",
    code: "YYZ",
    country: "Canada",
    latitude: 43.65,
    longitude: -79.38,
  },
  {
    city: "Mexico City",
    code: "MEX",
    country: "Mexico",
    latitude: 19.43,
    longitude: -99.13,
  },
  {
    city: "Guadalajara",
    code: "GDL",
    country: "Mexico",
    latitude: 20.67,
    longitude: -103.35,
  },
  {
    city: "Monterrey",
    code: "MTY",
    country: "Mexico",
    latitude: 25.69,
    longitude: -100.32,
  },
  {
    city: "Atlanta",
    code: "ATL",
    country: "United States",
    latitude: 33.75,
    longitude: -84.39,
  },
  {
    city: "Boston",
    code: "BOS",
    country: "United States",
    latitude: 42.36,
    longitude: -71.06,
  },
  {
    city: "Dallas",
    code: "DFW",
    country: "United States",
    latitude: 32.78,
    longitude: -96.8,
  },
  {
    city: "Houston",
    code: "HOU",
    country: "United States",
    latitude: 29.76,
    longitude: -95.37,
  },
  {
    city: "Kansas City",
    code: "KC",
    country: "United States",
    latitude: 39.1,
    longitude: -94.58,
  },
  {
    city: "Los Angeles",
    code: "LA",
    country: "United States",
    latitude: 34.05,
    longitude: -118.24,
  },
  {
    city: "Miami",
    code: "MIA",
    country: "United States",
    latitude: 25.76,
    longitude: -80.19,
  },
  {
    city: "New York / New Jersey",
    code: "NYNJ",
    country: "United States",
    latitude: 40.81,
    longitude: -74.07,
  },
  {
    city: "Philadelphia",
    code: "PHL",
    country: "United States",
    latitude: 39.95,
    longitude: -75.17,
  },
  {
    city: "San Francisco Bay Area",
    code: "SF",
    country: "United States",
    latitude: 37.77,
    longitude: -122.42,
  },
  {
    city: "Seattle",
    code: "SEA",
    country: "United States",
    latitude: 47.61,
    longitude: -122.33,
  },
];

const radians = (degrees: number) => (degrees * Math.PI) / 180;

function rotatePoint(
  latitude: number,
  longitude: number,
  rotationX: number,
  rotationY: number,
): { x: number; y: number; z: number } {
  const lat = radians(latitude);
  const lon = radians(longitude);
  const x = Math.cos(lat) * Math.sin(lon);
  const y = Math.sin(lat);
  const z = Math.cos(lat) * Math.cos(lon);
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);
  const rotatedX = x * cosY + z * sinY;
  const rotatedZ = z * cosY - x * sinY;
  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);
  return {
    x: rotatedX,
    y: y * cosX - rotatedZ * sinX,
    z: y * sinX + rotatedZ * cosX,
  };
}

function readColor(name: string, fallback: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

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
  const reducedMotion = useReducedMotionSafe();
  const selected = venues[selectedIndex];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(320, rect.width);
    const height = Math.max(390, rect.height);
    if (
      canvas.width !== Math.round(width * ratio) ||
      canvas.height !== Math.round(height * ratio)
    ) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    const cyan = readColor("--brand-cyan", "#00f0ff");
    const magenta = readColor("--brand-magenta", "#ff007f");
    const amber = readColor("--brand-amber", "#fbbf24");
    const foreground = readColor("--foreground", "#f1f5f9");
    const border = readColor("--border-bright", "#334155");
    const centerX = width / 2;
    const centerY = height * 0.49;
    const radius = Math.min(width * 0.35, height * 0.35);

    const glow = context.createRadialGradient(
      centerX,
      centerY,
      radius * 0.1,
      centerX,
      centerY,
      radius * 1.45,
    );
    glow.addColorStop(0, `${cyan}22`);
    glow.addColorStop(0.55, `${magenta}0d`);
    glow.addColorStop(1, "transparent");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    const sphere = context.createRadialGradient(
      centerX - radius * 0.28,
      centerY - radius * 0.3,
      radius * 0.08,
      centerX,
      centerY,
      radius,
    );
    sphere.addColorStop(0, `${cyan}24`);
    sphere.addColorStop(0.52, `${border}18`);
    sphere.addColorStop(1, `${magenta}08`);
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fillStyle = sphere;
    context.fill();

    const project = (latitude: number, longitude: number) => {
      const point = rotatePoint(
        latitude,
        longitude,
        rotationRef.current.x,
        rotationRef.current.y,
      );
      const perspective = 0.9 + point.z * 0.11;
      return {
        x: centerX + point.x * radius * perspective,
        y: centerY - point.y * radius * perspective,
        z: point.z,
      };
    };

    const drawGridLine = (
      points: Array<{ latitude: number; longitude: number }>,
    ) => {
      for (let index = 1; index < points.length; index += 1) {
        const previous = project(
          points[index - 1].latitude,
          points[index - 1].longitude,
        );
        const current = project(
          points[index].latitude,
          points[index].longitude,
        );
        const depth = (previous.z + current.z) / 2;
        context.beginPath();
        context.moveTo(previous.x, previous.y);
        context.lineTo(current.x, current.y);
        context.strokeStyle = depth > 0 ? `${cyan}7a` : `${border}42`;
        context.lineWidth = depth > 0 ? 1.15 : 0.7;
        context.stroke();
      }
    };

    for (let latitude = -75; latitude <= 75; latitude += 15) {
      drawGridLine(
        Array.from({ length: 73 }, (_, index) => ({
          latitude,
          longitude: -180 + index * 5,
        })),
      );
    }
    for (let longitude = -180; longitude < 180; longitude += 15) {
      drawGridLine(
        Array.from({ length: 37 }, (_, index) => ({
          latitude: -90 + index * 5,
          longitude,
        })),
      );
    }

    context.save();
    context.translate(centerX, centerY);
    context.rotate(radians(-11));
    context.scale(1, 0.23);
    const orbit = context.createLinearGradient(
      -radius * 1.45,
      0,
      radius * 1.45,
      0,
    );
    orbit.addColorStop(0, cyan);
    orbit.addColorStop(0.55, magenta);
    orbit.addColorStop(1, amber);
    context.beginPath();
    context.ellipse(0, 0, radius * 1.45, radius * 1.45, 0, 0, Math.PI * 2);
    context.strokeStyle = orbit;
    context.lineWidth = 3;
    context.stroke();
    context.restore();

    const projected = venues
      .map((venue) => {
        const point = project(venue.latitude, venue.longitude);
        return {
          ...venue,
          screenX: point.x,
          screenY: point.y,
          depth: point.z,
        };
      })
      .sort((a, b) => a.depth - b.depth);
    projectedRef.current = projected;

    for (const node of projected) {
      const active = node.code === selected.code;
      const visible = node.depth > -0.15;
      if (!visible && !active) continue;
      const size = active ? 7 : 3.5 + Math.max(0, node.depth) * 2;
      context.beginPath();
      context.arc(
        node.screenX,
        node.screenY,
        active ? size * 2.4 : size * 1.8,
        0,
        Math.PI * 2,
      );
      context.fillStyle = active ? `${magenta}28` : `${cyan}18`;
      context.fill();
      context.beginPath();
      context.arc(node.screenX, node.screenY, size, 0, Math.PI * 2);
      context.fillStyle = active ? magenta : cyan;
      context.shadowBlur = active ? 22 : 10;
      context.shadowColor = active ? magenta : cyan;
      context.fill();
      context.shadowBlur = 0;
      if (active) {
        context.font = "700 11px 'JetBrains Mono Variable', monospace";
        context.fillStyle = foreground;
        context.textAlign = "center";
        context.fillText(node.code, node.screenX, node.screenY - 18);
      }
    }
  }, [selected.code]);

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
      (current) => (current + offset + venues.length) % venues.length,
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
        const index = venues.findIndex(
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
      <div className="pointer-events-none absolute inset-x-5 top-5 z-10 flex justify-between font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground sm:inset-x-7 sm:top-7">
        <span>· Network · WC26</span>
        <span className="text-primary">◆ Live 16 venues</span>
      </div>
      {reducedMotion ? (
        <div
          aria-describedby={detailId}
          aria-label="Static 3D World Cup host-city network. Use arrow keys to select venues."
          aria-valuemax={venues.length - 1}
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
          aria-valuemax={venues.length - 1}
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
            className="grid size-10 place-content-center rounded-lg border border-border bg-card hover:border-primary/60"
            onClick={() => selectRelative(-1)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <button
            aria-label="Select next host city"
            className="grid size-10 place-content-center rounded-lg border border-border bg-card hover:border-primary/60"
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
