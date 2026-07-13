import { memo } from "react";
import { Link } from "react-router-dom";

interface BrandLogoProps {
  tagline?: boolean;
}

/** Compact top-down football stadium wordmark used across the app shell. */
export const BrandLogo = memo(function BrandLogo({
  tagline = false,
}: BrandLogoProps) {
  return (
    <Link
      aria-label="StadiumPulse home"
      className="group flex min-w-0 items-center gap-2.5"
      to="/"
    >
      <div className="shrink-0">
        <svg
          aria-hidden="true"
          className="size-10 drop-shadow-[0_8px_18px_rgb(0_0_0/0.2)] transition-transform duration-200 group-hover:scale-[1.03]"
          fill="none"
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            fill="#102f24"
            height="44"
            rx="14"
            stroke="#35e59a"
            strokeOpacity="0.38"
            strokeWidth="1.5"
            width="44"
            x="2"
            y="2"
          />
          <ellipse
            cx="24"
            cy="24"
            fill="#0b2219"
            rx="16.5"
            ry="13"
            stroke="#f2f7f5"
            strokeWidth="2.2"
          />
          <rect
            height="13"
            rx="1.5"
            stroke="#35e59a"
            strokeWidth="2"
            width="17"
            x="15.5"
            y="17.5"
          />
          <path
            d="M24 17.5v13"
            stroke="#35e59a"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
          <circle cx="24" cy="24" r="2.4" stroke="#4dd3ff" strokeWidth="1.5" />
          <path
            d="M11.5 18h2.2m-3.2 6h3m-2 6h2.2M34.3 18h2.2m-2 6h3m-3.2 6h2.2"
            stroke="#a6b2ae"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="font-display text-base font-bold leading-none tracking-[-0.045em] text-foreground sm:text-lg md:text-xl">
          Stadium<span className="text-primary">Pulse</span>
        </p>
        {tagline ? (
          <p
            aria-hidden="true"
            className="mt-1 hidden truncate text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted-foreground xl:block"
          >
            Match-day intelligence
          </p>
        ) : null}
      </div>
    </Link>
  );
});
