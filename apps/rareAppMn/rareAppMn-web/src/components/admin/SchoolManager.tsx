"use client";

import { ChevronLeft, ChevronRight, ExternalLink, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "urql";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { MajorManager } from "@/components/admin/MajorManager";
import { SchoolForm } from "@/components/admin/SchoolForm";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  ADMIN_SCHOOLS_QUERY,
  CATALOG_CACHE,
  DELETE_SCHOOL_MUTATION,
  type AdminSchool,
  type AdminSchoolsResult,
  type DeleteSchoolResult,
  type IdVariables,
  type SchoolsQueryVariables,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";
import { getUniversitySlug } from "@/lib/university-logos";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export function SchoolManager() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminSchool | "new" | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const [{ data, fetching, error }, reexecute] = useQuery<
    AdminSchoolsResult,
    SchoolsQueryVariables
  >({
    query: ADMIN_SCHOOLS_QUERY,
    variables: {
      filter: {
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      },
    },
  });
  const [{ fetching: deleting }, deleteSchool] = useMutation<
    DeleteSchoolResult,
    IdVariables
  >(DELETE_SCHOOL_MUTATION);

  const schools = data?.schools.items ?? [];
  const totalCount = data?.schools.pageInfo.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const selectedSchool = selected !== "new" ? selected : null;

  async function handleDelete(school: AdminSchool) {
    const result = await deleteSchool({ id: school.id }, CATALOG_CACHE);
    if (result.error) {
      toast.error("Сургуулийг устгаж чадсангүй", { description: getErrorMessage(result.error) });
      return;
    }
    setSelected(null);
    toast.success(`${school.name} устгагдлаа`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <aside className="space-y-4 lg:col-span-4">
        <Button variant="solid" size="md" className="w-full" onClick={() => setSelected("new")}>
          <Plus className="h-3.5 w-3.5" />
          Шинэ сургууль
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Сургууль хайх..."
            className="pl-11"
            aria-label="Сургууль хайх"
          />
        </div>

        {error ? (
          <ErrorState
            description={getErrorMessage(error)}
            onRetry={() => reexecute({ requestPolicy: "network-only" })}
          />
        ) : fetching && !data ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : schools.length === 0 ? (
          <EmptyState title="Сургууль олдсонгүй" />
        ) : (
          <>
            <ul className="space-y-2">
              {schools.map((school) => {
                const active = selectedSchool?.id === school.id;
                return (
                  <li key={school.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(school)}
                      className={cn(
                        "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                        active
                          ? "border-accent bg-accent-soft"
                          : "border-ink/10 bg-card hover:border-ink/25",
                      )}
                    >
                      <p className="truncate text-sm font-semibold text-ink">{school.name}</p>
                      <p className="truncate text-xs text-ink/60">
                        {school.location ?? "Байршил тодорхойгүй"}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  aria-label="Өмнөх хуудас"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-ink/60">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  aria-label="Дараагийн хуудас"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </aside>

      <section className="space-y-6 lg:col-span-8">
        {selected === null ? (
          <EmptyState
            title="Сургууль сонгоно уу"
            description="Зүүн талын жагсаалтаас сургууль сонгож засах, эсвэл шинээр нэмнэ үү."
          />
        ) : (
          <>
            <div className="rounded-2xl border border-ink/10 bg-card p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-ink">
                  {selectedSchool ? selectedSchool.name : "Шинэ сургууль"}
                </h2>
                {selectedSchool && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/university/${getUniversitySlug(selectedSchool.name) ?? selectedSchool.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/60 transition-colors hover:text-accent"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Хуудас үзэх
                    </Link>
                    <ConfirmDeleteButton
                      disabled={deleting}
                      onConfirm={() => handleDelete(selectedSchool)}
                    />
                  </div>
                )}
              </div>
              <SchoolForm
                key={selectedSchool?.id ?? "new"}
                school={selectedSchool}
                onSaved={(school) => setSelected(school)}
              />
            </div>

            {selectedSchool && (
              <div className="rounded-2xl border border-ink/10 bg-card p-6">
                <MajorManager key={selectedSchool.id} schoolId={selectedSchool.id} />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
