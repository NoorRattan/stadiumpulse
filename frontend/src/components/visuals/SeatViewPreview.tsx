export default function SeatViewPreview({
  sectionName,
}: {
  sectionName: string;
}): JSX.Element {
  return (
    <section
      className="overflow-hidden rounded-3xl border border-border bg-card"
      aria-labelledby="seat-view-title"
    >
      <div className="grid gap-1 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
          Accessible arrival confidence
        </p>
        <h2 className="font-display text-2xl font-bold" id="seat-view-title">
          Sightline from {sectionName}
        </h2>
        <p className="text-sm text-muted-foreground">
          A lightweight preview checks that the pitch remains visible from the
          demo accessible seating position without requiring WebGL.
        </p>
      </div>
      <div
        className="relative min-h-72 overflow-hidden"
        role="img"
        aria-label={`Static demo sightline from ${sectionName}: an unobstructed view over the seating row toward the football pitch`}
        style={{
          background:
            "linear-gradient(180deg, var(--visual-sky) 0%, var(--visual-sky-haze) 42%, var(--visual-stadium) 43%, var(--visual-stadium) 100%)",
        }}
      >
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 800 360"
        >
          <path
            d="M0 154 400 95l400 59v60L400 138 0 214Z"
            fill="var(--visual-stadium)"
          />
          <path
            d="M112 214 400 144l288 70-116 114H228Z"
            fill="var(--visual-field)"
            stroke="var(--visual-field-line)"
            strokeWidth="4"
          />
          <path
            d="M400 144v184M228 328l344-114"
            stroke="var(--visual-field-line)"
            strokeWidth="3"
          />
          <ellipse
            cx="400"
            cy="236"
            fill="none"
            rx="52"
            ry="30"
            stroke="var(--visual-field-line)"
            strokeWidth="3"
          />
          <path
            d="M0 292c148-52 652-52 800 0v68H0Z"
            fill="var(--visual-stadium)"
          />
          {[90, 215, 340, 465, 590, 715].map((x) => (
            <g key={x}>
              <path
                d={`M${x - 34} 302h68l16 58H${x - 50}Z`}
                fill="var(--visual-seat)"
              />
              <circle cx={x} cy="284" fill="var(--visual-sky-haze)" r="12" />
            </g>
          ))}
          <path
            d="M400 330 500 225"
            stroke="var(--visual-marker)"
            strokeDasharray="9 8"
            strokeWidth="5"
          />
        </svg>
        <span className="absolute bottom-4 right-4 rounded-full bg-background/90 px-3 py-1.5 text-xs font-bold text-accent backdrop-blur">
          Clear sightline
        </span>
      </div>
      <p className="border-t border-border px-5 py-3 text-xs font-semibold text-muted-foreground">
        Preview validates sightline only. Follow the generated step-free route
        for physical access.
      </p>
    </section>
  );
}
