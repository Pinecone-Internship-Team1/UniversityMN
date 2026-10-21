"use client";

import { ArrowDown, GraduationCap, Scale, School, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "urql";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { MAX_COMPARE_ITEMS, compareHref, type CompareMode } from "@/lib/compare";
import {
  examSubjectLines,
  formatAmount,
  formatAvailability,
  formatDegreeType,
  formatMajorPlace,
  formatMajorTuition,
  formatSchoolTuition,
  formatCutOff,
} from "@/lib/format";
import {
  COMPARE_ITEMS_QUERY,
  type CompareItemsResult,
  type CompareItemsVariables,
  type CompareMajor,
  type CompareSchool,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";
import { getUniversityBySchoolId, getUniversitySlug } from "@/lib/university-logos";
import { cn } from "@/lib/utils";
import { MajorPicker } from "./MajorPicker";
import {
  SchoolCardPicker,
  SchoolCardPickerSkeleton,
  SchoolOptionsState,
  useSchoolOptions,
} from "./SchoolOptions";

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

/** The table shows once this many are picked. */
const MIN_COMPARE_ITEMS = 2;

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
          className="font-semibold text-accent hover:underline max-lg:tap-target"
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
      <Link href={universityHref(major.school)} className="font-semibold hover:text-accent max-lg:tap-target">
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
            <th className="sticky left-0 z-10 w-40 bg-card p-4 text-[11px] font-bold uppercase tracking-wider text-ink/50 lg:static lg:z-auto lg:bg-transparent">
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
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-destructive/10 hover:text-destructive max-lg:tap-target"
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
              <th className="sticky left-0 z-10 bg-card p-4 text-xs font-semibold text-ink/60 lg:static lg:z-auto lg:bg-transparent">
                {row.label}
              </th>
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

  const schoolOptions = useSchoolOptions();
  const isFull = selection.ids.length >= MAX_COMPARE_ITEMS;
  const canCompare = selection.ids.length >= MIN_COMPARE_ITEMS;
  const noun = selection.mode === "schools" ? "сургууль" : "мэргэжил";

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

  const schools = compareItems.filter(
    (item): item is CompareSchool => item.__typename === "School",
  );
  const majors = compareItems.filter(
    (item): item is CompareMajor => item.__typename === "Major",
  );
  const remove = (id: string) =>
    update({ mode: selection.mode, ids: selection.ids.filter((current) => current !== id) });
  const toggle = (id: string) => {
    if (selection.ids.includes(id)) remove(id);
    else if (!isFull) update({ mode: selection.mode, ids: [...selection.ids, id] });
  };
  // Picked majors in pick order, for the chips above the list.
  const pickedMajors = selection.ids
    .map((id) => majors.find((major) => major.id === id))
    .filter((major): major is CompareMajor => major !== undefined);

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
                update({ mode: tab.id, ids: [] });
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 max-lg:tap-target",
                active ? "bg-ink text-paper" : "text-ink/60 hover:text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-ink/10 bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="text-sm font-bold text-ink" aria-live="polite">
            {selection.ids.length}/{MAX_COMPARE_ITEMS} сонгосон
          </p>
          <div className="flex items-center gap-4">
            {selection.ids.length > 0 && (
              <button
                type="button"
                onClick={() => update({ mode: selection.mode, ids: [] })}
                className="text-xs font-semibold text-ink/60 hover:text-ink max-lg:tap-target"
              >
                Бүгдийг арилгах
              </button>
            )}
            {canCompare && (
              <a
                href="#compare-table"
                className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline max-lg:tap-target lg:hidden"
              >
                Харьцуулалт
                <ArrowDown className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-ink/60">
          {isFull
            ? `Дээд тал нь ${MAX_COMPARE_ITEMS}. Өөрийг сонгох бол нэгийг нь хасна уу.`
            : selection.mode === "schools"
              ? "Сургуулиа товшиж сонгоно, дахин товшвол хасна."
              : "Мэргэжлээ товшиж сонгоно, аль ч сургуулиас холиж болно."}
        </p>

        {selection.mode === "majors" && pickedMajors.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Сонгосон мэргэжлүүд">
            {pickedMajors.map((major) => (
              <li
                key={major.id}
                title={`${major.name} · ${formatMajorPlace(major.faculty, schoolShortName(major.school))}`}
                className="flex min-w-0 max-w-full items-center gap-1 rounded-full border border-accent bg-accent-soft py-1 pl-3 pr-1 text-xs font-semibold text-ink"
              >
                <span className="truncate">
                  {major.name}
                  <span className="font-normal text-ink/60">
                    {" · "}
                    {formatMajorPlace(major.faculty, schoolShortName(major.school))}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => remove(major.id)}
                  aria-label={`${major.name}-г хасах`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive max-lg:tap-target"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          {selection.mode === "schools" ? (
            <SchoolOptionsState
              fetching={schoolOptions.fetching}
              error={schoolOptions.error}
              retry={schoolOptions.retry}
              skeleton={<SchoolCardPickerSkeleton />}
            >
              <SchoolCardPicker
                options={schoolOptions.options}
                selectedIds={selection.ids}
                full={isFull}
                onToggle={toggle}
              />
            </SchoolOptionsState>
          ) : (
            <MajorPicker
              schools={schoolOptions}
              selectedIds={selection.ids}
              full={isFull}
              onToggle={toggle}
            />
          )}
        </div>
      </div>

      <div id="compare-table" className="mt-8 scroll-mt-24">
        {!canCompare ? (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-ink/15 px-5 py-6 text-sm text-ink/60">
            <Scale className="h-5 w-5 shrink-0 text-ink/40" />
            {selection.ids.length === 0
              ? `${MIN_COMPARE_ITEMS}-${MAX_COMPARE_ITEMS} ${noun} сонгоход харьцуулалт энд гарна.`
              : `Дахиад нэг ${noun} сонгоход харьцуулалт энд гарна.`}
          </div>
        ) : compareResult.error ? (
          <ErrorState
            description={getErrorMessage(compareResult.error)}
            onRetry={() => reexecuteCompare({ requestPolicy: "network-only" })}
          />
        ) : compareResult.fetching && compareItems.length === 0 ? (
          <Skeleton className="h-72 w-full rounded-2xl" />
        ) : selection.mode === "schools" ? (
          <CompareTable
            items={schools}
            rows={SCHOOL_ROWS}
            onRemove={remove}
            title={(school) => (
              <Link
                href={universityHref(school)}
                className="hover:text-accent max-lg:tap-target"
              >
                {schoolShortName(school)}
              </Link>
            )}
          />
        ) : (
          <CompareTable
            items={majors}
            rows={MAJOR_ROWS}
            onRemove={remove}
            title={(major) => (
              <>
                {major.name}
                <span className="mt-0.5 block text-[11px] font-normal text-ink/50">
                  {formatMajorPlace(major.faculty, schoolShortName(major.school))}
                </span>
              </>
            )}
          />
        )}
      </div>
    </div>
  );
}
