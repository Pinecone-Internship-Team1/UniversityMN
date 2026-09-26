"use client";

import {
  UNIVERSITIES,
  DESKTOP_LAYOUT,
  TABLET_LAYOUT,
  MOBILE_LAYOUT,
  type LogoPlacement,
} from "@/lib/university-logos";
import { FloatingUniversityLogo } from "./FloatingUniversityLogo";

function LayoutGroup({
  layout,
  size,
}: {
  layout: LogoPlacement[];
  size: number;
}) {
  return (
    <>
      {layout.map((placement) => {
        const university = UNIVERSITIES[placement.id];
        if (!university) return null;
        return (
          <FloatingUniversityLogo
            key={placement.id}
            university={university}
            placement={placement}
            size={size}
          />
        );
      })}
    </>
  );
}

export function UniversityLogoCloud() {
  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden opacity-90 pointer-events-none"
      aria-hidden="true"
    >
      <div className="absolute inset-0 hidden lg:block">
        <LayoutGroup layout={DESKTOP_LAYOUT} size={116} />
      </div>
      <div className="absolute inset-0 hidden md:block lg:hidden">
        <LayoutGroup layout={TABLET_LAYOUT} size={96} />
      </div>
      <div className="absolute inset-0 md:hidden">
        <LayoutGroup layout={MOBILE_LAYOUT} size={76} />
      </div>
    </div>
  );
}
