"use client";

import { GraduationCap, Plus, Scale, School, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "urql";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { MAX_COMPARE_ITEMS, compareHref, type CompareMode } from "@/lib/compare";
import {
  examSubjectLines,
  formatAmount,
  formatAvailability,
  formatDegreeType,
  formatMajorTuition,
  formatSchoolTuition,
  formatCutOff,
} from "@/lib/format";
import {
  COMPARE_ITEMS_QUERY,
  MAJORS_QUERY,
  SCHOOLS_QUERY,
  type CompareItemsResult,
  type CompareItemsVariables,
  type CompareMajor,
  type CompareSchool,
  type MajorsQueryResult,
  type MajorsQueryVariables,
  type SchoolsQueryResult,
  type SchoolsQueryVariables,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";
import { getUniversityBySchoolId, getUniversitySlug } from "@/lib/university-logos";
import { cn } from "@/lib/utils";

export interface CompareExplorerProps {
  mode: CompareMode;
  ids: string[];
}

interface Selection {
  mode: CompareMode;
  ids: string[];
}

interface CompareRow<T> {
  label: string;
  render: (item: T) => ReactNode;
}

const MODES: { id: CompareMode; label: string; icon: typeof School }[] = [
  { id: "schools", label: "Сургууль", icon: School },
  { id: "majors", label: "Мэргэжил", icon: GraduationCap },
];

const PICKER_LIMIT = 6;

function schoolShortName(school: { id: string; name: string }): string {
  return getUniversityBySchoolId(school.id)?.short ?? school.name;
}

function universityHref(school: { id: string }): string {
  return `/university/${getUniversitySlug(school.id) ?? school.id}`;
}

const SCHOOL_ROWS: CompareRow<CompareSchool>[] = [
  { label: "Байршил", render: (school) => school.location ?? "—" },
  { label: "Сургалтын төлбөр", render: (school) => formatSchoolTuition(school) },
  { label: "Мэргэжлийн тоо", render: (school) => school.majors.length },
  {
    label: "Дотуур байр",
    render: (school) => {
      if (!school.dormAvailable) return formatAvailability(school.dormAvailable);
      const cheapest = (pick: (dormitory: CompareSchool["dormitories"][number]) => number | null) => {
        const fees = school.dormitories
          .filter((dormitory) => !dormitory.currency || dormitory.currency === "MNT")
          .map(pick)
          .filter((fee): fee is number => fee != null);
        return fees.length > 0 ? Math.min(...fees) : null;
      };
      const monthly = cheapest((dormitory) => dormitory.feePerMonth);
      if (monthly != null) return `Боломжтой · ${formatAmount(monthly)}/сар`;
      const yearly = cheapest((dormitory) => dormitory.feePerYear);
      return yearly != null ? `Боломжтой · ${formatAmount(yearly)}/жилээс` : "Боломжтой";
    },
  },
  {
    label: "Тэтгэлэг",
    render: (school) =>
      school.scholarshipAvailable
        ? `Боломжтой (${school.scholarships.length})`
        : formatAvailability(school.scholarshipAvailable),
  },
  {
    label: "Вэбсайт",
    render: (school) =>
      school.website ? (
        <a
          href={school.website}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-accent hover:underline"
        >
          Нээх
        </a>
      ) : (
        "—"
      ),
  },
];

const MAJOR_ROWS: CompareRow<CompareMajor>[] = [
  {
    label: "Сургууль",
    render: (major) => (
      <Link href={universityHref(major.school)} className="font-semibold hover:text-accent">
        {schoolShortName(major.school)}
      </Link>
    ),
  },
  { label: "Чиглэл", render: (major) => major.category ?? "—" },
  { label: "Зэрэг", render: (major) => formatDegreeType(major.degreeType) ?? "—" },
  { label: "Босго оноо", render: (major) => formatCutOff(major) ?? "—" },
  {
    label: "Шалгалтын хичээл",
    render: (major) => {
      const exams = examSubjectLines(major);
      if (exams.length === 0 && !major.examNote) return "—";
      return (
        <>
          {exams.map((exam) => (
            <span key={exam.label} className="block">
              {exam.label}: {exam.text}
            </span>
          ))}
          {major.examNote && <span className="block text-ink/60">{major.examNote}</span>}
        </>
      );
    },
  },
  { label: "Сургалтын төлбөр", render: (major) => formatMajorTuition(major) },
];

function CompareTable<T extends { id: string }>({
  items,
  rows,
  title,
  onRemove,
}: {
  items: T[];
  rows: CompareRow<T>[];
  title: (item: T) => ReactNode;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-card">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10">
            <th className="w-40 p-4 text-[11px] font-bold uppercase tracking-wider text-ink/50">
              Үзүүлэлт
            </th>
            {items.map((item) => (
              <th key={item.id} className="p-4 align-top">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 text-sm font-bold text-ink">{title(item)}</div>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label="Харьцуулалтаас хасах"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-ink/10 last:border-b-0">
              <th className="p-4 text-xs font-semibold text-ink/60">{row.label}</th>
              {items.map((item) => (
                <td key={item.id} className="p-4 text-xs text-ink/80">
                  {row.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CompareExplorer({ mode, ids }: CompareExplorerProps) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>({ mode, ids });
  const [syncedProps, setSyncedProps] = useState<Selection>({ mode, ids });
  if (syncedProps.mode !== mode || syncedProps.ids.join(",") !== ids.join(",")) {
    setSyncedProps({ mode, ids });
    setSelection({ mode, ids });
  }

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const isFull = selection.ids.length >= MAX_COMPARE_ITEMS;

  const [schoolSearch] = useQuery<SchoolsQueryResult, SchoolsQueryVariables>({
    query: SCHOOLS_QUERY,
    variables: { filter: { search: debouncedSearch, limit: PICKER_LIMIT } },
    pause: selection.mode !== "schools" || !debouncedSearch,
  });
  const [majorSearch] = useQuery<MajorsQueryResult, MajorsQueryVariables>({
    query: MAJORS_QUERY,
    variables: { filter: { search: debouncedSearch, limit: PICKER_LIMIT } },
    pause: selection.mode !== "majors" || !debouncedSearch,
  });

  const [compareResult, reexecuteCompare] = useQuery<CompareItemsResult, CompareItemsVariables>({
    query: COMPARE_ITEMS_QUERY,
    variables: {
      ids: selection.ids,
      type: selection.mode === "schools" ? "SCHOOL" : "MAJOR",
    },
    pause: selection.ids.length === 0,
  });

  function update(next: Selection) {
    setSelection(next);
    router.replace(compareHref(next.mode, next.ids), { scroll: false });
  }

  const compareItems = compareResult.data?.compareItems ?? [];
  const compareSettled = !compareResult.fetching && !compareResult.stale && !compareResult.error;

  useEffect(() => {
    if (!compareSettled || !compareResult.data || selection.ids.length === 0) return;
    const foundIds = compareResult.data.compareItems.map((item) => item.id);
    if (!foundIds.every((id) => selection.ids.includes(id))) return;
    if (foundIds.length < selection.ids.length) {
      const remaining = selection.ids.filter((id) => foundIds.includes(id));
      setSelection({ mode: selection.mode, ids: remaining });
      router.replace(compareHref(selection.mode, remaining), { scroll: false });
    }
  }, [compareSettled, compareResult.data, selection, router]);

  const pickerResults =
    selection.mode === "schools"
      ? (schoolSearch.data?.schools.items ?? []).map((school) => ({
          id: school.id,
          title: schoolShortName(school),
          subtitle: school.location ?? school.name,
        }))
      : (majorSearch.data?.majors.items ?? []).map((major) => ({
          id: major.id,
          title: major.name,
          subtitle: [schoolShortName(major.school), major.category]
            .filter(Boolean)
            .join(" · "),
        }));
  const pickerFetching =
    selection.mode === "schools" ? schoolSearch.fetching : majorSearch.fetching;
  const pickerError = selection.mode === "schools" ? schoolSearch.error : majorSearch.error;

  const schools = compareItems.filter(
    (item): item is CompareSchool => item.__typename === "School",
  );
  const majors = compareItems.filter(
    (item): item is CompareMajor => item.__typename === "Major",
  );
  const remove = (id: string) =>
    update({ mode: selection.mode, ids: selection.ids.filter((current) => current !== id) });

  return (
    <div>
      <div className="inline-flex rounded-xl border border-ink/10 bg-card p-1">
        {MODES.map((tab) => {
          const Icon = tab.icon;
          const active = selection.mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (active) return;
                setSearch("");
                update({ mode: tab.id, ids: [] });
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200",
                active ? "bg-ink text-paper" : "text-ink/60 hover:text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-ink/10 bg-card p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              selection.mode === "schools"
                ? "Харьцуулах сургуулиа хайж нэмэх..."
                : "Харьцуулах мэргэжлээ хайж нэмэх..."
            }
            className="pl-11"
            aria-label="Харьцуулах зүйл хайх"
          />
        </div>
        <p className="mt-2 text-xs text-ink/50">
          {selection.ids.length}/{MAX_COMPARE_ITEMS} сонгосон
          {isFull ? " · Дээд хязгаарт хүрсэн" : ""}
        </p>

        {debouncedSearch && (
          <div className="mt-4">
            {pickerError ? (
              <p className="text-xs font-medium text-destructive">{getErrorMessage(pickerError)}</p>
            ) : pickerFetching && pickerResults.length === 0 ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : pickerResults.length === 0 ? (
              <p className="text-xs text-ink/60">Илэрц олдсонгүй.</p>
            ) : (
              <ul className="space-y-2">
                {pickerResults.map((result) => {
                  const selected = selection.ids.includes(result.id);
                  return (
                    <li
                      key={result.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-paper px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{result.title}</p>
                        <p className="truncate text-xs text-ink/60">{result.subtitle}</p>
                      </div>
                      <button
                        type="button"
                        disabled={selected || isFull}
                        onClick={() =>
                          update({ mode: selection.mode, ids: [...selection.ids, result.id] })
                        }
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                        {selected ? "Нэмэгдсэн" : "Нэмэх"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="mt-8">
        {selection.ids.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Харьцуулах зүйлээ сонгоно уу"
            description="Дээрх хайлтаас дор хаяж хоёр сургууль эсвэл мэргэжил нэмж харьцуулаарай."
          />
        ) : compareResult.error ? (
          <ErrorState
            description={getErrorMessage(compareResult.error)}
            onRetry={() => reexecuteCompare({ requestPolicy: "network-only" })}
          />
        ) : compareResult.fetching && compareItems.length === 0 ? (
          <Skeleton className="h-72 w-full rounded-2xl" />
        ) : (
          <>
            {selection.ids.length === 1 && (
              <p className="mb-4 text-xs font-medium text-ink/60">
                Харьцуулахын тулд дахин нэгийг нэмнэ үү.
              </p>
            )}
            {selection.mode === "schools" ? (
              <CompareTable
                items={schools}
                rows={SCHOOL_ROWS}
                onRemove={remove}
                title={(school) => (
                  <Link href={universityHref(school)} className="hover:text-accent">
                    {schoolShortName(school)}
                  </Link>
                )}
              />
            ) : (
              <CompareTable
                items={majors}
                rows={MAJOR_ROWS}
                onRemove={remove}
                title={(major) => major.name}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
