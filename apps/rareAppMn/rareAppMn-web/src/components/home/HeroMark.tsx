import Image from "next/image";
import type { CSSProperties } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { UNIVERSITIES } from "@/lib/university-logos";
import { cn } from "@/lib/utils";

/*
 * School logos orbiting the mark. Positions are relative to the mark's own box
 * (so they follow it at every size): an angle (0° = right, clockwise) and a
 * distance in mark radii. The left side stays close (angles 125°/235° only),
 * so nothing reaches the text column.
 */
const ORBIT: { id: keyof typeof UNIVERSITIES; angle: number; distance: number; rotate: number; duration: number }[] = [
  { id: "muis", angle: 235, distance: 1.32, rotate: -10, duration: 7 },
  { id: "mubis", angle: 278, distance: 1.3, rotate: 5, duration: 8 },
  { id: "shutis", angle: 322, distance: 1.38, rotate: 7, duration: 8.5 },
  { id: "sezis", angle: 8, distance: 1.36, rotate: -6, duration: 6.5 },
  { id: "khaais", angle: 52, distance: 1.34, rotate: -12, duration: 7.5 },
  { id: "ashuuis", angle: 96, distance: 1.3, rotate: 9, duration: 9 },
  { id: "otgontenger", angle: 125, distance: 1.36, rotate: -4, duration: 8 },
];

/** Logo tiles are this share of the mark's width. */
const LOGO_SHARE = 0.16;

/**
 * The hero's visual on tablet and desktop: the Oyutan MN mark with the school
 * logos floating around it. Decorative only (hidden from screen readers, no
 * pointer events). Hidden on phones, where it would push the call to action
 * down; the header logo already shows the mark there.
 *
 * variant "plain" is the bare mark; "card" sets it on its cream rounded square.
 */
export function HeroMark({ variant = "plain", className }: { variant?: "plain" | "card"; className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-variant={variant}
      className={cn(
        "group pointer-events-none relative isolate hidden aspect-square shrink-0 select-none md:block",
        "w-[220px] lg:w-[320px] xl:w-[400px]",
        className,
      )}
    >
      {/* The orbit sits behind the mark. */}
      <div className="absolute inset-0 -z-10 opacity-70">
        {ORBIT.map((logo, index) => {
          const t = (logo.angle * Math.PI) / 180;
          const university = UNIVERSITIES[logo.id];
          return (
            <div
              key={logo.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${50 + 50 * logo.distance * Math.cos(t)}%`,
                top: `${50 + 50 * logo.distance * Math.sin(t)}%`,
                width: `${LOGO_SHARE * 100}%`,
                height: `${LOGO_SHARE * 100}%`,
              }}
            >
              <div
                className="hero-float h-full w-full rounded-2xl bg-white/80 p-[12%] shadow-[0_8px_24px_-12px_rgb(22_20_15/0.35)] dark:bg-white/85"
                style={
                  {
                    "--float-rotate": `${logo.rotate}deg`,
                    animationDuration: `${logo.duration}s`,
                    animationDelay: `${-index * 1.1}s`,
                  } as CSSProperties
                }
              >
                <Image
                  src={university.image}
                  alt=""
                  width={64}
                  height={64}
                  sizes="64px"
                  fetchPriority="low"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* A soft accent glow under the mark. */}
      <div className="absolute inset-[12%] -z-10 rounded-full bg-accent-soft blur-3xl" />

      {/* Plain: scaled up so the ring (inset ~17% in the icon) fills the box. */}
      <div
        className={cn(
          "relative h-full w-full group-data-[variant=plain]:scale-[1.45]",
          "group-data-[variant=card]:rounded-[20.3%] group-data-[variant=card]:border group-data-[variant=card]:border-border-ink group-data-[variant=card]:bg-card group-data-[variant=card]:shadow-[0_30px_60px_-30px_rgb(22_20_15/0.35),0_8px_20px_-12px_rgb(22_20_15/0.18)]",
        )}
      >
        <BrandMark animated className="h-full w-full" />
      </div>
    </div>
  );
}
