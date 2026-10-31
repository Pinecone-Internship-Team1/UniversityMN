import Image from "next/image";
import { cn } from "@/lib/utils";

// public/brand/oyutan-logo*.png: the wordmark, cropped with a transparent
// background; the -dark file has light text for the dark theme.
const LOGO_WIDTH = 846;
const LOGO_HEIGHT = 112;

interface LogoProps {
  /** Height (and any extra) classes; the width follows the aspect ratio. */
  className?: string;
  /** Load right away (the header logo) instead of lazily. */
  eager?: boolean;
}

// The wordmark is shown at most ~24px tall (≈180px wide), so ask next/image
// for a ~360px file (2x) instead of the 1080/1920px defaults for width 846.
const SIZES = "180px";

export function Logo({ className, eager = false }: LogoProps) {
  const loading = eager ? "eager" : "lazy";
  return (
    <>
      <Image
        src="/brand/oyutan-logo.png"
        alt="Oyutan MN"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        sizes={SIZES}
        loading={loading}
        className={cn("w-auto dark:hidden", className)}
      />
      <Image
        src="/brand/oyutan-logo-dark.png"
        alt="Oyutan MN"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        sizes={SIZES}
        loading={loading}
        className={cn("hidden w-auto dark:block", className)}
      />
    </>
  );
}
