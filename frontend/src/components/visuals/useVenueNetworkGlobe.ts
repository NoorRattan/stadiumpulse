import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
  type PointerEvent,
} from "react";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

import {
  createVenueStars,
  radians,
  renderVenueScene,
  venueNodes,
  type ProjectedNode,
} from "./venueNetworkScene";

function useVenueRenderer(selectedIndex: number) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef({ x: radians(-12), y: radians(104) });
  const projectedRef = useRef<ProjectedNode[]>([]);
  const pulseRef = useRef(0);
  const selected = venueNodes[selectedIndex];
  const stars = useMemo(() => createVenueStars(), []);
  const draw = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    projectedRef.current = renderVenueScene({
      canvas: canvasRef.current,
      container: containerRef.current,
      pulse: pulseRef.current,
      rotation: rotationRef.current,
      selected,
      stars,
    });
  }, [selected, stars]);
  const advanceFrame = useCallback((delta: number) => {
    rotationRef.current.y += delta * 0.00013;
    pulseRef.current += 1;
  }, []);
  const rotateBy = useCallback(
    (deltaX: number, deltaY: number) => {
      rotationRef.current.y += deltaX * 0.008;
      rotationRef.current.x = Math.max(
        radians(-65),
        Math.min(radians(65), rotationRef.current.x + deltaY * 0.006),
      );
      draw();
    },
    [draw],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(draw);
    observer.observe(containerRef.current);
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
  return {
    advanceFrame,
    canvasRef,
    containerRef,
    draw,
    projectedRef,
    rotateBy,
    selected,
  };
}

function useVenueAnimation({
  advanceFrame,
  dragging,
  draw,
  reducedMotion,
}: {
  advanceFrame: (delta: number) => void;
  dragging: boolean;
  draw: () => void;
  reducedMotion: boolean;
}) {
  const animationRef = useRef<number>();
  useEffect(() => {
    let previous = performance.now();
    const animate = (now: number) => {
      if (!reducedMotion && !dragging) {
        advanceFrame(Math.min(now - previous, 40));
      }
      previous = now;
      draw();
      if (!reducedMotion) animationRef.current = requestAnimationFrame(animate);
    };
    draw();
    if (!reducedMotion) animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current !== undefined)
        cancelAnimationFrame(animationRef.current);
    };
  }, [advanceFrame, dragging, draw, reducedMotion]);
}

interface PointerControlOptions {
  projectedRef: MutableRefObject<ProjectedNode[]>;
  rotateBy: (deltaX: number, deltaY: number) => void;
  setDragging: (dragging: boolean) => void;
  setSelectedIndex: (index: number) => void;
}

function usePointerControls({
  projectedRef,
  rotateBy,
  setDragging,
  setSelectedIndex,
}: PointerControlOptions) {
  const pointerRef = useRef({ id: -1, x: 0, y: 0, moved: false });
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
    rotateBy(deltaX, deltaY);
    pointerRef.current.x = event.clientX;
    pointerRef.current.y = event.clientY;
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
        .sort((first, second) => first.distance - second.distance)[0];
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
  return { handlePointerDown, handlePointerMove, handlePointerUp };
}

export function useVenueNetworkGlobe() {
  const [selectedIndex, setSelectedIndex] = useState(12);
  const [dragging, setDragging] = useState(false);
  const reducedMotion = useReducedMotionSafe();
  const renderer = useVenueRenderer(selectedIndex);
  useVenueAnimation({ dragging, reducedMotion, ...renderer });
  const pointer = usePointerControls({
    setDragging,
    setSelectedIndex,
    ...renderer,
  });
  const selectRelative = (offset: number) =>
    setSelectedIndex(
      (current) => (current + offset + venueNodes.length) % venueNodes.length,
    );
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const offset = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
      event.key
    ];
    if (!offset) return;
    event.preventDefault();
    selectRelative(offset);
  };
  return {
    ...pointer,
    ...renderer,
    detailId: `venue-detail-${renderer.selected.code}`,
    dragging,
    handleKeyDown,
    reducedMotion,
    selectedIndex,
    selectRelative,
  };
}
