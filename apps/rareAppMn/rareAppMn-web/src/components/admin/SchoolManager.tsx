"use client";

import { ChevronLeft, ChevronRight, ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "urql";
import { FacultyManager } from "@/components/admin/FacultyManager";
import { InlineConfirm } from "@/components/admin/InlineConfirm";
import { SchoolForm } from "@/components/admin/SchoolForm";
import { Button } from "@/components/ui/Button";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
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

type PanelTab = "faculties" | "details";

const PANEL_TABS: { id: PanelTab; label: string }[] = [
  { id: "faculties", label: "Сургууль, мэргэжил" },
  { id: "details", label: "Ерөнхий мэдээлэл" },
];

export function SchoolManager() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminSchool | "new" | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("faculties");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
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
      toast.error("Их сургуулийг устгаж чадсангүй", { description: getErrorMessage(result.error) });
      return;
    }
    setSelected(null);
    setConfirmingDelete(false);
    toast.success(`${school.name} устгагдлаа`);
  }

  function select(school: AdminSchool | "new") {
    setSelected(school);
    setConfirmingDelete(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <aside className="space-y-3 lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Их сургууль хайх..."
              className="pl-11"
              aria-label="Их сургууль хайх"
            />
          </div>
          <Button variant="outline" size="md" onClick={() => select("new")}>
            <Plus className="h-3.5 w-3.5" />
            Шинэ
          </Button>
        </div>

        {error ? (
          <ErrorState
            description={getErrorMessage(error)}
            onRetry={() => reexecute({ requestPolicy: "network-only" })}
          />
        ) : fetching && !data ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : schools.length === 0 ? (
          <EmptyState title="Их сургууль олдсонгүй" />
        ) : (
          <>
            <ul className="divide-y divide-ink/[0.07] overflow-hidden rounded-xl border border-ink/10 bg-card">
              {schools.map((school) => {
                const active = selectedSchool?.id === school.id;
                return (
                  <li key={school.id}>
                    <button
                      type="button"
                      onClick={() => select(school)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "w-full border-l-2 px-4 py-2.5 text-left transition-colors",
                        active
                          ? "border-accent bg-accent-soft"
                          : "border-transparent hover:bg-ink/[0.03]",
                      )}
                    >
                      <p className="truncate text-sm font-semibold text-ink">{school.name}</p>
                      <p className="truncate text-[11px] text-ink/55">
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
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </aside>

      <section className="lg:col-span-8">
        {selected === null ? (
          <EmptyState
            title="Их сургууль сонгоно уу"
            description="Зүүн талын жагсаалтаас их сургууль сонгож засах, эсвэл шинээр нэмнэ үү."
          />
        ) : selected === "new" ? (
          <div className="rounded-2xl border border-ink/10 bg-card p-5 sm:p-6">
            <h2 className="mb-5 text-lg font-bold text-ink">Шинэ их сургууль</h2>
            <SchoolForm
              key="new"
              school={null}
              onSaved={(school) => {
                select(school);
                setPanelTab("faculties");
              }}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-ink/10 bg-card">
            <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-ink">{selected.name}</h2>
                <p className="truncate text-xs text-ink/55">
                  {selected.location ?? "Байршил тодорхойгүй"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/university/${getUniversitySlug(selected.id) ?? selected.id}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold uppercase tracking-wider text-ink/60 transition-colors hover:bg-ink/[0.06] hover:text-ink"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Хуудас
                </Link>
                <DropdownMenu
                  label={`${selected.name}: үйлдлүүд`}
                  items={[
                    {
                      label: "Их сургуулийг устгах",
                      icon: Trash2,
                      destructive: true,
                      onSelect: () => setConfirmingDelete(true),
                    },
                  ]}
                />
              </div>
            </div>

            {confirmingDelete && (
              <InlineConfirm
                className="mx-5 mt-4 sm:mx-6"
                message={`“${selected.name}” болон түүний бүх сургууль, мэргэжлийг устгах уу?`}
                busy={deleting}
                onConfirm={() => handleDelete(selected)}
                onCancel={() => setConfirmingDelete(false)}
              />
            )}

            <div role="tablist" className="mt-4 flex gap-1 border-b border-ink/10 px-5 sm:px-6">
              {PANEL_TABS.map((tab) => {
                const active = panelTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setPanelTab(tab.id)}
                    className={cn(
                      "-mb-px border-b-2 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors",
                      active
                        ? "border-accent text-ink"
                        : "border-transparent text-ink/50 hover:text-ink",
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div role="tabpanel" className="p-5 sm:p-6">
              {panelTab === "faculties" ? (
                <FacultyManager key={selected.id} schoolId={selected.id} />
              ) : (
                <SchoolForm
                  key={selected.id}
                  school={selected}
                  onSaved={(school) => setSelected(school)}
                />
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
