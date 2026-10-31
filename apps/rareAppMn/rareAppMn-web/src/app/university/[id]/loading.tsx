import { PageShell } from "@/components/layout/PageShell";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

/** Same layout as the school page, so nothing jumps when it arrives. */
export default function UniversityDetailLoading() {
  return (
    <PageShell>
      <Container className="pt-3 pb-12 md:pt-6 md:pb-20" role="status" aria-label="Ачаалж байна">
        <Skeleton className="h-11 w-24 rounded-full" />
        <div className="mt-3 flex items-start gap-4 md:mt-4">
          <Skeleton className="h-[72px] w-[72px] rounded-2xl md:h-24 md:w-24" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-3/4 max-w-sm" />
            <Skeleton className="h-5 w-1/2 max-w-xs" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[84px] rounded-2xl" />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:mt-8 md:grid-cols-12 md:gap-8">
          <div className="space-y-4 md:col-span-8">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl md:col-span-4" />
        </div>
      </Container>
    </PageShell>
  );
}
