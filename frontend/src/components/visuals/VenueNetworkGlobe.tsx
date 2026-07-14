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

// Seeded pseudo-random for deterministic star positions
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
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
  const pulseRef = useRef(0); // for pulsing animation
  const reducedMotion = useReducedMotionSafe();
  const selected = venues[selectedIndex];

  // Stable star positions
  const stars = useMemo(() => {
    const rand = seededRandom(42);
    return Array.from({ length: 120 }, () => ({
      x: rand(),
      y: rand(),
      r: rand() * 1.4 + 0.3,
      opacity: rand() * 0.6 + 0.15,
    }));
  }, []);

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
    const background = readColor("--background", "#0b1121");
    // Dark mode has a very dark background starting with #0
    const bgRaw = background.replace(/\s/g, "");
    const isDark =
      bgRaw.startsWith("#0") ||
      bgRaw.startsWith("#1") ||
      bgRaw.startsWith("rgb(1") ||
      bgRaw.startsWith("rgb(0");

    const centerX = width / 2;
    const centerY = height * 0.47;
    const radius = Math.min(width * 0.36, height * 0.36);

    // ── Background (respect the card bg, not re-fill) ──────────────────────────
    // Draw stars
    for (const star of stars) {
      const sx = star.x * width;
      const sy = star.y * (height * 0.88);
      const distFromCenter = Math.hypot(sx - centerX, sy - centerY);
      // Fade stars near the globe
      const starOpacity =
        star.opacity * Math.min(1, distFromCenter / (radius * 0.7));
      if (starOpacity < 0.02) continue;
      context.beginPath();
      context.arc(sx, sy, star.r, 0, Math.PI * 2);
      context.fillStyle = isDark
        ? `rgba(200,230,255,${starOpacity})`
        : `rgba(0,100,140,${starOpacity * 0.35})`;
      context.fill();
    }

    // ── Atmospheric radial glow — centered on the sphere ─────────────────────
    const glow = context.createRadialGradient(
      centerX,
      centerY,
      radius * 0.2,
      centerX,
      centerY,
      radius * 1.45,
    );
    if (isDark) {
      glow.addColorStop(0, `${magenta}1a`);
      glow.addColorStop(0.45, `${cyan}12`);
      glow.addColorStop(0.75, `${amber}08`);
      glow.addColorStop(1, "transparent");
    } else {
      glow.addColorStop(0, `${magenta}12`);
      glow.addColorStop(0.5, `${cyan}0a`);
      glow.addColorStop(1, "transparent");
    }
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    // ── Sphere fill with volumetric shading ───────────────────────────────────
    const sphere = context.createRadialGradient(
      centerX - radius * 0.32,
      centerY - radius * 0.34,
      radius * 0.04,
      centerX,
      centerY,
      radius * 1.05,
    );
    if (isDark) {
      sphere.addColorStop(0, `${cyan}30`);
      sphere.addColorStop(0.28, `${magenta}18`);
      sphere.addColorStop(0.62, `rgba(8,20,50,0.55)`);
      sphere.addColorStop(1, `${magenta}10`);
    } else {
      sphere.addColorStop(0, `${cyan}22`);
      sphere.addColorStop(0.35, `${magenta}12`);
      sphere.addColorStop(0.72, `rgba(200,230,245,0.3)`);
      sphere.addColorStop(1, `${amber}08`);
    }
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fillStyle = sphere;
    context.fill();

    // Sphere rim highlight (specular top-left)
    const specular = context.createRadialGradient(
      centerX - radius * 0.38,
      centerY - radius * 0.42,
      0,
      centerX - radius * 0.38,
      centerY - radius * 0.42,
      radius * 0.55,
    );
    specular.addColorStop(0, `rgba(255,255,255,${isDark ? 0.12 : 0.22})`);
    specular.addColorStop(1, "transparent");
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fillStyle = specular;
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
        if (depth > 0) {
          context.strokeStyle = isDark ? `${cyan}85` : `${cyan}60`;
          context.lineWidth = 1.1;
        } else {
          context.strokeStyle = isDark
            ? `rgba(50,80,100,0.45)`
            : `rgba(0,120,160,0.22)`;
          context.lineWidth = 0.65;
        }
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

    // ── Orbit ring 1 – cyan→magenta→amber (main equatorial) ──────────────────
    context.save();
    context.translate(centerX, centerY);
    context.rotate(radians(-11));
    context.scale(1, 0.22);
    const orbit1 = context.createLinearGradient(
      -radius * 1.48,
      0,
      radius * 1.48,
      0,
    );
    orbit1.addColorStop(0, cyan);
    orbit1.addColorStop(0.45, magenta);
    orbit1.addColorStop(1, amber);
    context.beginPath();
    context.ellipse(0, 0, radius * 1.48, radius * 1.48, 0, 0, Math.PI * 2);
    context.strokeStyle = orbit1;
    context.lineWidth = 2.8;
    context.shadowBlur = isDark ? 18 : 8;
    context.shadowColor = magenta;
    context.stroke();
    context.shadowBlur = 0;
    context.restore();

    // ── Orbit ring 2 – cyan only, different angle ─────────────────────────────
    context.save();
    context.translate(centerX, centerY);
    context.rotate(radians(22));
    context.scale(1, 0.18);
    context.beginPath();
    context.ellipse(0, 0, radius * 1.35, radius * 1.35, 0, 0, Math.PI * 2);
    context.strokeStyle = isDark ? `${cyan}90` : `${cyan}70`;
    context.lineWidth = 1.8;
    context.shadowBlur = isDark ? 10 : 4;
    context.shadowColor = cyan;
    context.stroke();
    context.shadowBlur = 0;
    context.restore();

    // ── Venue nodes ───────────────────────────────────────────────────────────
    const pulse = pulseRef.current;
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
      const depthFactor = Math.max(0, node.depth);
      const size = active ? 7.5 : 3 + depthFactor * 2.5;

      // Outer halo (pulsing for active)
      const haloScale = active ? 1 + 0.35 * Math.sin(pulse * 0.06) : 1;
      context.beginPath();
      context.arc(
        node.screenX,
        node.screenY,
        (active ? size * 2.8 : size * 2) * haloScale,
        0,
        Math.PI * 2,
      );
      const haloGrad = context.createRadialGradient(
        node.screenX,
        node.screenY,
        0,
        node.screenX,
        node.screenY,
        (active ? size * 2.8 : size * 2) * haloScale,
      );
      haloGrad.addColorStop(0, active ? `${magenta}40` : `${cyan}28`);
      haloGrad.addColorStop(1, "transparent");
      context.fillStyle = haloGrad;
      context.fill();

      // Node core
      context.beginPath();
      context.arc(node.screenX, node.screenY, size, 0, Math.PI * 2);
      context.fillStyle = active ? magenta : isDark ? cyan : `${cyan}cc`;
      context.shadowBlur = active ? 28 : 14;
      context.shadowColor = active ? magenta : cyan;
      context.fill();
      context.shadowBlur = 0;

      // Active node label
      if (active) {
        context.font = "700 11px 'JetBrains Mono Variable', monospace";
        context.fillStyle = foreground;
        context.textAlign = "center";
        context.shadowBlur = 8;
        context.shadowColor = magenta;
        context.fillText(node.code, node.screenX, node.screenY - 20);
        context.shadowBlur = 0;
      }
    }

    // ── Bottom HUD: LAT / LNG / PULSE-OK ─────────────────────────────────────
    const hudY = height - 14;
    const hudOpacity = isDark ? 0.55 : 0.5;
    context.font = "700 9px 'JetBrains Mono Variable', monospace";
    context.fillStyle = isDark
      ? `rgba(148,163,184,${hudOpacity})`
      : `rgba(71,85,105,${hudOpacity})`;
    context.textAlign = "left";
    context.fillText(
      `LAT ${selected.latitude.toFixed(2)} · LNG ${selected.longitude.toFixed(2)}`,
      18,
      hudY,
    );

    // PULSE-OK with segments
    const segCount = 8;
    const segW = 6;
    const segH = 10;
    const segGap = 2;
    const pulseOkX = width - 18 - segCount * (segW + segGap) - 56;
    context.textAlign = "right";
    context.fillStyle = isDark
      ? `rgba(0,240,255,${hudOpacity + 0.1})`
      : `rgba(0,108,117,${hudOpacity + 0.1})`;
    context.fillText("PULSE-OK", pulseOkX, hudY);
    // Draw LED segments
    for (let seg = 0; seg < segCount; seg++) {
      const sx = pulseOkX + 8 + seg * (segW + segGap);
      const active2 = seg < 6;
      const sy = hudY - segH + 2;
      context.fillStyle = active2
        ? isDark
          ? `rgba(0,240,255,0.75)`
          : `rgba(0,108,117,0.75)`
        : isDark
          ? `rgba(0,240,255,0.18)`
          : `rgba(0,108,117,0.18)`;
      context.beginPath();
      context.roundRect(sx, sy, segW, segH, 1.5);
      context.fill();
    }
  }, [selected.code, selected.latitude, selected.longitude, stars]);

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
