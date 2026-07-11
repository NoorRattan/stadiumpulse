import { memo } from "react";

interface BrandLogoProps {
  tagline?: boolean;
}

/** StadiumPulse brand mark and wordmark. */
export const BrandLogo = memo(function BrandLogo({
  tagline = false,
}: BrandLogoProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <svg
        aria-hidden="true"
        className="size-11 shrink-0 text-primary"
        fill="none"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          className="fill-background"
          height="44"
          rx="12"
          stroke="currentColor"
          strokeWidth="2.5"
          width="44"
          x="2"
          y="2"
        />
        <path
          className="stroke-accent"
          d="M11 29c4.2-7.4 9.3-11.1 15.2-11.1 4.7 0 8.4 2 10.8 6.1"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <path
          className="stroke-secondary"
          d="M13 34c2.9-4.4 6.3-6.6 10.2-6.6 3.1 0 5.9 1.4 8.3 4.1"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <circle className="fill-primary" cx="32.5" cy="15.5" r="4.5" />
        <path
          className="stroke-primary"
          d="M16 15.5h5.5M16 21h9.5M16 26.5h5.5"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
      </svg>
      <div className="min-w-0">
        <p className="font-display text-xl font-black leading-tight tracking-normal text-foreground md:text-2xl">
          StadiumPulse
        </p>
        {tagline ? (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            Know the venue. Move with confidence.
          </p>
        ) : null}
      </div>
    </div>
  );
});
