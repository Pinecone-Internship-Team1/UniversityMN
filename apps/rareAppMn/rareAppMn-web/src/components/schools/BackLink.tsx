"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * «Буцах»: back in history when the visitor came from another page of this
 * site (e.g. filtered results keep their state), else to /schools.
 */
export function BackLink() {
  const router = useRouter();
  return (
    <Link
      href="/schools"
      onClick={(event) => {
        const cameFromSite = document.referrer.startsWith(window.location.origin);
        if (cameFromSite && window.history.length > 1) {
          event.preventDefault();
          router.back();
        }
      }}
      className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-base font-bold text-ink-2 transition-colors hover:text-ink"
    >
      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      Буцах
    </Link>
  );
}
