import { ChevronLeft, ChevronRight, Rotate3D } from "lucide-react";

import { venueNodes } from "./venueNetworkScene";
import { useVenueNetworkGlobe } from "./useVenueNetworkGlobe";

type GlobeState = ReturnType<typeof useVenueNetworkGlobe>;
type SelectionProps = Pick<
  GlobeState,
  "detailId" | "selected" | "selectedIndex"
>;

function NetworkHeader(): JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-x-5 top-5 z-10 flex justify-between font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground sm:inset-x-7 sm:top-7">
      <span>· Network · WC26</span>
      <span className="flex items-center gap-1.5 text-primary">
        <span className="inline-block h-1.5 w-1.5 animate-[live-pulse_2s_ease-in-out_infinite] rounded-full bg-primary" />
        Live 16 venues
      </span>
    </div>
  );
}

function StaticGlobeGrid(): JSX.Element {
  return (
    <>
      <defs>
        <radialGradient id="static-globe-fill" cx="35%" cy="30%">
          <stop offset="0" stopColor="var(--brand-cyan)" stopOpacity=".2" />
          <stop offset="1" stopColor="var(--brand-magenta)" stopOpacity=".04" />
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
    </>
  );
}

function StaticGlobe({
  detailId,
  handleKeyDown,
  selected,
  selectedIndex,
}: SelectionProps & Pick<GlobeState, "handleKeyDown">) {
  return (
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
        <StaticGlobeGrid />
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
  );
}

type InteractiveProps = SelectionProps &
  Pick<
    GlobeState,
    | "canvasRef"
    | "dragging"
    | "handleKeyDown"
    | "handlePointerDown"
    | "handlePointerMove"
    | "handlePointerUp"
  >;

function InteractiveGlobe(props: InteractiveProps) {
  const {
    canvasRef,
    detailId,
    dragging,
    handleKeyDown,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    selected,
    selectedIndex,
  } = props;
  return (
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
  );
}

function VenueDetails({
  detailId,
  selected,
  selectRelative,
}: Pick<GlobeState, "detailId" | "selected" | "selectRelative">) {
  return (
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
  );
}

/** Lightweight real-time 3D projection with drag, keyboard, and venue selection. */
export function VenueNetworkGlobe(): JSX.Element {
  const {
    canvasRef,
    containerRef,
    detailId,
    dragging,
    handleKeyDown,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    reducedMotion,
    selected,
    selectedIndex,
    selectRelative,
  } = useVenueNetworkGlobe();
  const common = { detailId, selected, selectedIndex };
  return (
    <section
      aria-labelledby={detailId}
      className="pulse-network relative aspect-square min-h-[390px] overflow-hidden rounded-2xl border border-border bg-card/55 shadow-[var(--shadow-card)]"
      ref={containerRef}
    >
      <NetworkHeader />
      {reducedMotion ? (
        <StaticGlobe {...common} handleKeyDown={handleKeyDown} />
      ) : (
        <InteractiveGlobe
          {...common}
          canvasRef={canvasRef}
          dragging={dragging}
          handleKeyDown={handleKeyDown}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
        />
      )}
      <VenueDetails
        detailId={detailId}
        selected={selected}
        selectRelative={selectRelative}
      />
    </section>
  );
}
