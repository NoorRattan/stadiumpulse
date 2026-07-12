import { memo } from "react";
import { Link } from "react-router-dom";

interface BrandLogoProps {
  tagline?: boolean;
}

/** StadiumPulse brand mark with animated pulse ring. */
export const BrandLogo = memo(function BrandLogo({
  tagline = false,
}: BrandLogoProps) {
  return (
    <Link className="group flex min-w-0 items-center gap-3" to="/">
      <div className="relative shrink-0">
        <svg
          aria-hidden="true"
          className="size-10 text-foreground transition group-hover:text-primary"
          fill="none"
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            height="40"
            rx="8"
            stroke="currentColor"
            strokeWidth="1.5"
            width="40"
            x="4"
            y="4"
          />
          <circle
            className="text-primary"
            cx="24"
            cy="24"
            fill="currentColor"
            r="6"
          />
          <path
            className="text-accent"
            d="M12 32c3-6 7-9 12-9s9 3 12 9"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            className="text-secondary"
            d="M14 36c2-3 5-5 10-5s8 2 10 5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary live-pulse"
        />
      </div>
      <div className="min-w-0">
        <p className="font-display text-lg font-bold tracking-tight text-foreground md:text-xl">
          Stadium<span className="text-primary">Pulse</span>
        </p>
        {tagline ? (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            FIFA 2026 venue nervous system
          </p>
        ) : null}
      </div>
    </Link>
  );
});
