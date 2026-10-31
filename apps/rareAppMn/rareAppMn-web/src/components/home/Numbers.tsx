import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { getHomeSchools, getMajorCount, getScholarshipDirectory } from "@/lib/home-data";
import { LogoStrip } from "./LogoStrip";
import { StatGrid, StatGridSkeleton } from "./StatGrid";

function NumbersFrame({ children }: { children: ReactNode }) {
  return (
    <section aria-labelledby="numbers-title" className="border-y border-border-ink bg-card/60 py-12 md:py-16">
      <Container>
        <h2 id="numbers-title" className="sr-only">
          Oyutan MN тоогоор
        </h2>
        {children}
      </Container>
      <LogoStrip />
    </section>
  );
}

/** Instant trust: the size of the catalog, counted from the live data. */
export async function Numbers() {
  const [{ total: schools }, majors, { total: scholarships }] = await Promise.all([
    getHomeSchools(),
    getMajorCount(),
    getScholarshipDirectory(),
  ]);
  return (
    <NumbersFrame>
      <StatGrid initial={{ schools, majors, scholarships }} />
    </NumbersFrame>
  );
}

export function NumbersSkeleton() {
  return (
    <NumbersFrame>
      <StatGridSkeleton />
    </NumbersFrame>
  );
}
