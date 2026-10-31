import Image from "next/image";
import type { CSSProperties } from "react";
import { UNIVERSITIES } from "@/lib/university-logos";
import { cn } from "@/lib/utils";

interface Placement {
  id: keyof typeof UNIVERSITIES;
  /** Centre, as % of the hero's width / height. */
  x: number;
  y: number;
  size: number;
  rotate: number;
  /** Float cycle length in seconds (they drift out of step). */
  duration: number;
}

/*
 * Wide screens: the logos orbit the brand mark (HeroMark); these two sit in the
 * page margin left of the text on very wide screens (xl only).
 */
const WIDE_MARGIN: Placement[] = [
  { id: "suis", x: 4, y: 22, size: 54, rotate: 11, duration: 8 },
  { id: "huree", x: 5, y: 80, size: 50, rotate: -8, duration: 9.5 },
];
/*
 * Phones (no brand mark there): two small, faint logos peeking in at the
 * right edge, beside the short first line of the headline and in the empty
 * space below the buttons, clear of all text.
 */
const MOBILE: Placement[] = [
  { id: "shutis", x: 96, y: 7, size: 44, rotate: 8, duration: 8 },
  { id: "muis", x: 94, y: 97, size: 44, rotate: -9, duration: 7 },
];

function Logo({ placement, index }: { placement: Placement; index: number }) {
  const university = UNIVERSITIES[placement.id];
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${placement.x}%`, top: `${placement.y}%`, width: placement.size, height: placement.size }}
    >
      <div
        className="hero-float h-full w-full rounded-2xl bg-white/70 p-1.5 shadow-[0_8px_24px_-12px_rgb(22_20_15/0.35)] dark:bg-white/85"
        style={
          {
            "--float-rotate": `${placement.rotate}deg`,
            animationDuration: `${placement.duration}s`,
            animationDelay: `${-index * 1.3}s`,
          } as CSSProperties
        }
      >
        <Image
          src={university.image}
          alt=""
          width={placement.size}
          height={placement.size}
          sizes={`${placement.size}px`}
          fetchPriority="low"
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}

/**
 * The school logos floating behind the hero: a background layer only (behind
 * the text, never over the headline, score box or buttons), decorative, and
 * still when the visitor prefers reduced motion. Each set is display:none
 * outside its breakpoint, so its lazy images aren't downloaded there.
 */
export function HeroLogos() {
  const set = (placements: Placement[], className: string) => (
    <div className={cn("absolute inset-0", className)}>
      {placements.map((placement, index) => (
        <Logo key={placement.id} placement={placement} index={index} />
      ))}
    </div>
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">
      {set(MOBILE, "opacity-35 md:hidden")}
      {set(WIDE_MARGIN, "hidden opacity-45 xl:block")}
    </div>
  );
}
