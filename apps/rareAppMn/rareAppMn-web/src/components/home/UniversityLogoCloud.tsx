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
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 hidden lg:block">
        <LayoutGroup layout={DESKTOP_LAYOUT} size={124} />
      </div>
      <div className="absolute inset-0 hidden md:block lg:hidden">
        <LayoutGroup layout={TABLET_LAYOUT} size={104} />
      </div>
      <div className="absolute inset-0 md:hidden">
        <LayoutGroup layout={MOBILE_LAYOUT} size={80} />
      </div>
    </div>
  );
}
