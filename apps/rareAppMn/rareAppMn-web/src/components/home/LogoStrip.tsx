import Image from "next/image";
import { UNIVERSITIES } from "@/lib/university-logos";

const LOGOS = Object.values(UNIVERSITIES);

function LogoRow({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center gap-10 pr-10 md:gap-14 md:pr-14" aria-hidden={hidden || undefined}>
      {LOGOS.map((university) => (
        <li key={university.id} className="flex shrink-0 items-center gap-3">
          <Image
            src={university.image}
            alt={hidden ? "" : university.full}
            width={44}
            height={44}
            sizes="44px"
            loading="lazy"
            className="h-11 w-11 object-contain"
          />
          <span className="text-[15px] font-bold whitespace-nowrap text-ink-2">{university.short}</span>
        </li>
      ))}
    </ul>
  );
}

/** The schools on the site, scrolling slowly sideways; the second copy only makes the loop seamless. */
export function LogoStrip() {
  return (
    <div className="relative mt-12 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="marquee flex w-max hover:[animation-play-state:paused]">
        <LogoRow />
        <LogoRow hidden />
      </div>
    </div>
  );
}
