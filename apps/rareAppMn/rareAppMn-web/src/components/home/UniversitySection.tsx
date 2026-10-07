import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SchoolCardSkeletonRow } from "@/components/ui/Skeleton";
import { SectionLabel } from "./SectionLabel";
import { UniversityCarouselLoader } from "./UniversityCarouselLoader";

export function UniversitySection() {
  return (
    <section
      id="discovery"
      className="border-t border-ink/10 bg-paper py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <SectionLabel>Сургуулиуд</SectionLabel>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
              Монголын тэргүүлэх их, дээд сургуулиуд
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/70 sm:text-base">
              Элсэлтийн ерөнхий шалгалтын босго оноо, сургалтын төлбөр болон
              онцлох чиглэлүүдийг харьцуулан хараарай.
            </p>
          </div>

          <Link
            href="/schools"
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-ink/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink transition-all hover:border-ink hover:bg-ink hover:text-paper sm:self-auto"
          >
            Бүгдийг харах
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <Suspense fallback={<SchoolCardSkeletonRow count={4} />}>
          <UniversityCarouselLoader />
        </Suspense>
      </div>
    </section>
  );
}
