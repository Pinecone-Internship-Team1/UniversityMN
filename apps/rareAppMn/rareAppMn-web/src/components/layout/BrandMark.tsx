import { useId } from "react";
import { cn } from "@/lib/utils";

/*
 * The Oyutan MN mark, measured from public/brand/oyutan-icon.png (512 units):
 * an open ring (centre 256, outer r 168, inner r 111) with a thin slit at
 * ~238°, and the orange dot (r 37) on the ring's centre line at 332°, set in a
 * cut-out (r 52) so the background shows around it. Drawn as SVG so it stays
 * sharp at any size; the ring is currentColor (ink, light in dark mode) and the
 * dot is the accent color.
 */
const C = 256;
const RING_R = 139.5; // centre line between r 111 and r 168
const RING_W = 57;
const DOT_ANGLE = (332 * Math.PI) / 180;
const DOT = { x: C + RING_R * Math.cos(DOT_ANGLE), y: C + RING_R * Math.sin(DOT_ANGLE), r: 37 };
const DOT_CUTOUT_R = 52;
const SLIT_ANGLE = 238;
const SLIT_W = 17;

export interface BrandMarkProps {
  className?: string;
  /** Slow "breathing" of the mark and a soft pulse from the dot (off for reduced motion). */
  animated?: boolean;
}

export function BrandMark({ className, animated = false }: BrandMarkProps) {
  const maskId = useId();
  return (
    <svg
      viewBox="0 0 512 512"
      aria-hidden="true"
      focusable="false"
      className={cn("text-ink", animated && "brand-breathe", className)}
    >
      <defs>
        <mask id={maskId}>
          <rect width="512" height="512" fill="white" />
          {/* The slit: a radial cut through the ring. */}
          <rect
            x={C + 100}
            y={-SLIT_W / 2}
            width="80"
            height={SLIT_W}
            fill="black"
            transform={`translate(0 ${C}) rotate(${SLIT_ANGLE} ${C} 0)`}
          />
          {/* The gap around the dot. */}
          <circle cx={DOT.x} cy={DOT.y} r={DOT_CUTOUT_R} fill="black" />
        </mask>
      </defs>
      <circle cx={C} cy={C} r={RING_R} fill="none" stroke="currentColor" strokeWidth={RING_W} mask={`url(#${maskId})`} />
      {animated && <circle cx={DOT.x} cy={DOT.y} r={DOT.r} className="brand-dot-pulse fill-accent" />}
      <circle cx={DOT.x} cy={DOT.y} r={DOT.r} className="fill-accent" />
    </svg>
  );
}
