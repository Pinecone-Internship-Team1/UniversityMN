import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function UniversityDetailLoading() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-6 py-12 sm:px-8 sm:py-20">
        <Skeleton className="h-4 w-20" />

        <div className="mt-8 flex flex-col gap-8 rounded-3xl border border-ink/10 bg-card p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <Skeleton className="h-20 w-20 rounded-2xl sm:h-24 sm:w-24" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-12">
          <div className="space-y-8 md:col-span-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-ink/10 bg-card p-6 sm:p-8"
              >
                <Skeleton className="h-6 w-40" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-5/6" />
              </div>
            ))}
          </div>
          <div className="md:col-span-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
