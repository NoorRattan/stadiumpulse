import { memo } from "react";
import { Link } from "react-router-dom";

interface BrandLogoProps {
  tagline?: boolean;
}

/** Supplied StadiumPulse wordmark, shared by the header, footer, and error shell. */
export const BrandLogo = memo(function BrandLogo({
  tagline = false,
}: BrandLogoProps) {
  return (
    <Link
      aria-label="StadiumPulse home"
      className="group block shrink-0 overflow-hidden rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      data-tagline={tagline ? "visible" : "hidden"}
      to="/"
    >
      <span className="block h-12 w-[166px] overflow-hidden sm:h-14 sm:w-[188px]">
        <img
          alt=""
          aria-hidden="true"
          className="h-full w-auto max-w-none origin-left object-contain transition-transform duration-200 group-hover:scale-[1.015]"
          decoding="async"
          height="70"
          src="/stadiumpulse-logo.png"
          width="391"
        />
      </span>
    </Link>
  );
});
