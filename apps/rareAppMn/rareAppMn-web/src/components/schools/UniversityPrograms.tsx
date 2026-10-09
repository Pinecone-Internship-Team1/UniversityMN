"use client";

import { BookOpen, ChevronRight, GraduationCap } from "lucide-react";
import { useState } from "react";
import { MajorBookmarkButton } from "@/components/schools/MajorBookmarkButton";
import { MajorNotes } from "@/components/schools/MajorNotes";
import { ComingSoon } from "@/components/ui/ComingSoon";
import {
  DEGREE_TYPES,
  OTHER_DEGREE,
  degreeKey,
  examSubjectLines,
  formatDegreeKey,
  formatMajorTuition,
} from "@/lib/format";
import type { Faculty, Major } from "@/lib/graphql/types";
import { cn } from "@/lib/utils";

export interface UniversityProgramsProps {
  faculties: Faculty[];
  majors: Major[];
}

interface FacultyGroup {
  id: string;
  name: string;
  majors: Major[];
}

/**
 * The faculties offering `degree`, in the university's order, each with its
 * majors of that degree. Majors without a known faculty come last under
 * "Бусад" rather than being dropped.
 */
function facultiesOffering(degree: string, faculties: Faculty[], majors: Major[]): FacultyGroup[] {
  const ofDegree = majors.filter((major) => degreeKey(major.degreeType) === degree);
  const groups = faculties
    .map((faculty) => ({
      id: faculty.id,
      name: faculty.name,
      majors: ofDegree.filter((major) => major.facultyId === faculty.id),
    }))
    .filter((group) => group.majors.length > 0);
  const facultyIds = new Set(faculties.map((faculty) => faculty.id));
  const unassigned = ofDegree.filter((major) => !major.facultyId || !facultyIds.has(major.facultyId));
  if (unassigned.length > 0) groups.push({ id: "unassigned", name: "Бусад", majors: unassigned });
  return groups;
}

function MajorCard({ major }: { major: Major }) {
  const exams = examSubjectLines(major);
  return (
    <div className="rounded-xl border border-ink/10 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">{major.name}</p>
          {major.category && <p className="mt-0.5 text-xs text-ink/60">{major.category}</p>}
        </div>
        <MajorBookmarkButton
          majorId={major.id}
          initialSaved={major.isSaved}
          majorName={major.name}
          size="sm"
        />
      </div>
      {exams.length > 0 && (
        <dl className="mt-2 space-y-0.5 text-[11px] text-ink/60">
          {exams.map((exam) => (
            <div key={exam.label}>
              <dt className="inline font-semibold text-ink/70">{exam.label}: </dt>
              <dd className="inline">{exam.text}</dd>
            </div>
          ))}
        </dl>
      )}
      {major.examNote && <p className="mt-2 text-[11px] text-ink/60">{major.examNote}</p>}
      {(major.cutOffScore != null || major.tuitionFee != null) && (
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-ink/70">
          {major.cutOffScore != null && (
            <span className="rounded-full bg-ink/5 px-2.5 py-1">
              Босго оноо: {major.cutOffScore}
            </span>
          )}
          {major.tuitionFee != null && (
            <span className="rounded-full bg-ink/5 px-2.5 py-1">{formatMajorTuition(major)}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The university's programs as a drill-down: pick a degree level first, then
 * the schools (faculties) offering it, then a school's programs.
 */
export function UniversityPrograms({ faculties, majors }: UniversityProgramsProps) {
  const degrees = [...DEGREE_TYPES, OTHER_DEGREE]
    .map((key) => {
      const ofDegree = majors.filter((major) => degreeKey(major.degreeType) === key);
      return {
        key,
        label: formatDegreeKey(key),
        programCount: ofDegree.length,
        schoolCount: new Set(ofDegree.map((major) => major.facultyId ?? "unassigned")).size,
      };
    })
    .filter((degree) => degree.programCount > 0);

  // A single level or a lone school leaves nothing to choose, so it opens right away.
  const initialDegree = degrees.length === 1 ? degrees[0].key : null;
  const openedFor = (key: string | null): ReadonlySet<string> => {
    const offering = key ? facultiesOffering(key, faculties, majors) : [];
    return new Set(offering.length === 1 ? [offering[0].id] : []);
  };
  const [selected, setSelected] = useState<string | null>(initialDegree);
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => openedFor(initialDegree));

  const groups = selected ? facultiesOffering(selected, faculties, majors) : [];
  const selectedLabel = selected ? formatDegreeKey(selected) : null;

  function selectDegree(key: string) {
    setSelected(key);
    setOpenIds(openedFor(key));
  }

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="rounded-2xl border border-ink/10 bg-card p-6 sm:p-8">
      <div className="flex items-center gap-2 text-ink">
        <BookOpen className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-bold tracking-tight">Хөтөлбөрүүд</h2>
      </div>

      {degrees.length === 0 ? (
        <ComingSoon />
      ) : (
        <>
          <p className="mt-4 text-sm text-ink/70">Ямар зэргийн хөтөлбөр сонирхож байна вэ?</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {degrees.map((degree) => {
              const active = selected === degree.key;
              return (
                <button
                  key={degree.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectDegree(degree.key)}
                  className={cn(
                    "group flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200",
                    active
                      ? "border-accent bg-accent-soft"
                      : "border-ink/10 bg-paper hover:-translate-y-0.5 hover:border-ink/25",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                      active ? "bg-accent text-white" : "bg-ink/5 text-ink/60",
                    )}
                  >
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-ink">{degree.label}</span>
                    <span className="block text-xs text-ink/60">
                      {degree.programCount} хөтөлбөр · {degree.schoolCount} сургууль
                    </span>
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      active ? "rotate-90 text-accent" : "text-ink/30 group-hover:translate-x-0.5",
                    )}
                  />
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-ink">
                {selectedLabel} зэргийн хөтөлбөртэй сургуулиуд{" "}
                <span className="font-normal text-ink/50">({groups.length})</span>
              </p>
              <ul className="mt-3 space-y-2">
                {groups.map((group) => {
                  const open = openIds.has(group.id);
                  return (
                    <li key={group.id} className="rounded-xl border border-ink/10 bg-paper">
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => toggle(group.id)}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-ink/[0.03]"
                      >
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 shrink-0 text-ink/40 transition-transform duration-200",
                            open && "rotate-90",
                          )}
                        />
                        <span className="min-w-0 flex-1 text-sm font-bold text-ink">
                          {group.name}
                        </span>
                        <span className="shrink-0 rounded-full bg-ink/5 px-2.5 py-0.5 text-[11px] font-semibold text-ink/60">
                          {group.majors.length} хөтөлбөр
                        </span>
                      </button>
                      {open && (
                        <div className="grid gap-3 border-t border-ink/10 p-4 sm:grid-cols-2">
                          {group.majors.map((major) => (
                            <MajorCard key={major.id} major={major} />
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <MajorNotes majors={groups.flatMap((group) => group.majors)} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
