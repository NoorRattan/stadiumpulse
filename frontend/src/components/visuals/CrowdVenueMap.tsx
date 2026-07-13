import type { CrowdZoneSummary } from "@/types/domain";

const bandStyle = {
  normal: { color: "#16a36a", label: "Normal" },
  moderate: { color: "#ca8a04", label: "Moderate" },
  high: { color: "#ea580c", label: "High" },
  critical: { color: "#dc264f", label: "Critical" },
} as const;

/** Lightweight, keyboard-native venue map for selecting crowd zones. */
export function CrowdVenueMap({
  zones,
  selectedZoneId,
  onSelectZone,
}: {
  zones: CrowdZoneSummary[];
  selectedZoneId?: string;
  onSelectZone?: (zone: CrowdZoneSummary) => void;
}): JSX.Element {
  return (
    <section
      aria-label="Interactive stadium venue map"
      className="overflow-hidden rounded-3xl border border-border bg-card"
    >
      <div className="grid gap-6 p-5 md:grid-cols-[minmax(15rem,.75fr)_minmax(0,1.25fr)] md:p-6">
        <div className="grid place-content-center rounded-2xl bg-muted p-4">
          <svg
            aria-hidden="true"
            className="mx-auto w-full max-w-72"
            fill="none"
            viewBox="0 0 320 230"
          >
            <ellipse
              cx="160"
              cy="115"
              fill="var(--background)"
              rx="142"
              ry="98"
              stroke="var(--border-bright)"
              strokeWidth="8"
            />
            <ellipse
              cx="160"
              cy="115"
              rx="116"
              ry="74"
              stroke="var(--muted-foreground)"
              strokeDasharray="5 8"
              strokeOpacity=".65"
              strokeWidth="3"
            />
            <rect
              fill="rgb(22 163 106 / .16)"
              height="104"
              rx="8"
              stroke="var(--primary)"
              strokeWidth="3"
              width="166"
              x="77"
              y="63"
            />
            <path d="M160 63v104" stroke="var(--primary)" strokeWidth="2" />
            <circle
              cx="160"
              cy="115"
              r="16"
              stroke="var(--accent)"
              strokeWidth="2"
            />
            <path
              d="M77 91h22v48H77m166-48h-22v48h22"
              stroke="var(--primary)"
              strokeWidth="2"
            />
            {[
              [33, 74],
              [33, 156],
              [160, 24],
              [160, 206],
              [287, 74],
              [287, 156],
            ].map(([cx, cy], index) => {
              const zone = zones[index];
              const color = zone ? bandStyle[zone.band].color : "var(--border)";
              return (
                <g key={`${cx}-${cy}`}>
                  <circle cx={cx} cy={cy} fill={color} opacity=".2" r="14" />
                  <circle cx={cx} cy={cy} fill={color} r="6" />
                </g>
              );
            })}
          </svg>
          <p className="mt-2 text-center text-xs font-semibold text-muted-foreground">
            Top-down venue signal map
          </p>
        </div>

        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Selectable venue signals
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold">
                Crowd pressure by zone
              </h2>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {Object.entries(bandStyle).map(([band, value]) => (
                <span className="inline-flex items-center gap-1.5" key={band}>
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ backgroundColor: value.color }}
                  />
                  {value.label}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {zones.slice(0, 12).map((zone) => {
              const style = bandStyle[zone.band];
              const selected = selectedZoneId === zone.zoneId;
              return (
                <button
                  aria-label={`${zone.name}, ${Math.round(zone.currentDensityPct)} percent density, ${style.label}`}
                  aria-pressed={selected}
                  className="group min-h-16 rounded-xl border border-border bg-background/60 p-3 text-left transition hover:border-primary/50 aria-pressed:border-primary aria-pressed:bg-primary/10"
                  key={zone.zoneId}
                  onClick={() => onSelectZone?.(zone)}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-bold text-foreground">
                      {zone.name}
                    </span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {Math.round(zone.currentDensityPct)}%
                    </span>
                  </span>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted">
                    <span
                      aria-hidden="true"
                      className="block h-full rounded-full transition-[width]"
                      style={{
                        backgroundColor: style.color,
                        width: `${Math.min(100, Math.max(0, zone.currentDensityPct))}%`,
                      }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
