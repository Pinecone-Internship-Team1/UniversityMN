"use client";

import {
  Building2,
  ChevronRight,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "urql";
import { InlineConfirm } from "@/components/admin/InlineConfirm";
import { MajorList } from "@/components/admin/MajorManager";
import { Button } from "@/components/ui/Button";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { DEGREE_TYPES, OTHER_DEGREE, degreeKey, formatDegreeKey } from "@/lib/format";
import {
  ADMIN_SCHOOL_FACULTIES_QUERY,
  CATALOG_CACHE,
  CREATE_FACULTY_MUTATION,
  DELETE_FACULTY_MUTATION,
  UPDATE_FACULTY_MUTATION,
  type AdminMajor,
  type AdminSchoolFacultiesResult,
  type CreateFacultyResult,
  type DeleteFacultyResult,
  type FacultyMutationVariables,
  type IdVariables,
  type UpdateFacultyResult,
} from "@/lib/graphql/documents";
import {
  getErrorCode,
  getErrorMessage,
  getErrorMessageWithDetail,
} from "@/lib/graphql/errors";
import type { Faculty } from "@/lib/graphql/types";
import { cn } from "@/lib/utils";
import { parseOptionalText, parseRequiredText } from "@/lib/validation";

const DUPLICATE_FACULTY_MESSAGE =
  "Энэ нэртэй сургууль энэ их, дээд сургуульд аль хэдийн бүртгэгдсэн байна.";
const FACULTY_HAS_MAJORS_MESSAGE =
  "Энэ сургуульд мэргэжил байгаа тул устгах боломжгүй. Эхлээд мэргэжлүүдийг устгах эсвэл өөр сургууль руу шилжүүлнэ үү.";

/** A compact editor for a faculty's name and, for branch schools, its location. */
function FacultyForm({
  schoolId,
  faculty,
  onDone,
}: {
  schoolId: string;
  faculty: Faculty | null;
  onDone: (saved?: Faculty) => void;
}) {
  const [name, setName] = useState(faculty?.name ?? "");
  const [location, setLocation] = useState(faculty?.location ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [{ fetching: creating }, createFaculty] = useMutation<
    CreateFacultyResult,
    FacultyMutationVariables
  >(CREATE_FACULTY_MUTATION);
  const [{ fetching: updating }, updateFaculty] = useMutation<
    UpdateFacultyResult,
    FacultyMutationVariables
  >(UPDATE_FACULTY_MUTATION);
  const saving = creating || updating;

  async function handleSubmit() {
    setErrorMessage(null);
    const parsedName = parseRequiredText(name, "Сургуулийн нэр");
    if (!parsedName.ok) {
      setErrorMessage(parsedName.error);
      return;
    }

    const parsedLocation = parseOptionalText(location, "Байршил");
    if (!parsedLocation.ok) {
      setErrorMessage(parsedLocation.error);
      return;
    }

    const input = { schoolId, name: parsedName.value, location: parsedLocation.value };
    const result = faculty
      ? await updateFaculty({ id: faculty.id, input }, CATALOG_CACHE)
      : await createFaculty({ input }, CATALOG_CACHE);

    if (result.error) {
      const message =
        getErrorCode(result.error) === "CONFLICT"
          ? DUPLICATE_FACULTY_MESSAGE
          : getErrorMessageWithDetail(result.error);
      setErrorMessage(message);
      toast.error("Сургуулийг хадгалж чадсангүй", { description: message });
      return;
    }
    toast.success(
      faculty ? "Сургууль шинэчлэгдлээ" : "Шинэ сургууль нэмэгдлээ",
    );
    const saved =
      result.data && "createFaculty" in result.data
        ? result.data.createFaculty
        : result.data && "updateFaculty" in result.data
          ? result.data.updateFaculty
          : undefined;
    onDone(saved);
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Сургуулийн нэр, жишээ: Хууль зүйн сургууль"
          aria-label="Сургуулийн нэр"
          autoFocus
          className="sm:flex-1"
        />
        <Input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Байршил (өөр аймагт бол), жишээ: Ховд аймаг"
          aria-label="Байршил"
          className="sm:w-64"
        />
        <div className="flex gap-1.5">
          <Button type="submit" variant="solid" size="sm" disabled={saving}>
            <Save className="h-3.5 w-3.5" />
            {saving ? "Хадгалж байна..." : faculty ? "Хадгалах" : "Нэмэх"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDone()}
            disabled={saving}
          >
            Болих
          </Button>
        </div>
      </div>
      {errorMessage && (
        <p className="text-xs font-medium text-destructive">{errorMessage}</p>
      )}
    </form>
  );
}

/** "ALL", one of `DEGREE_TYPES`, or "OTHER" for majors with no or a custom degree. */
type DegreeFilter = string;

const ALL_DEGREES = "ALL";
/** Always offered, even at zero, so admins can switch to them to add programs. */
const PINNED_DEGREES = ["BACHELOR", "MASTER"];

function groupMajorsByFaculty(
  majors: AdminMajor[],
): Map<string | null, AdminMajor[]> {
  const grouped = new Map<string | null, AdminMajor[]>();
  for (const major of majors) {
    const bucket = grouped.get(major.facultyId);
    if (bucket) bucket.push(major);
    else grouped.set(major.facultyId, [major]);
  }
  return grouped;
}

/**
 * A university's schools (faculties, e.g. Хууль зүйн сургууль) as collapsible
 * rows, each holding its majors. Majors can only be added inside a school,
 * so a school comes first.
 */
export function FacultyManager({ schoolId }: { schoolId: string }) {
  const [editing, setEditing] = useState<Faculty | "new" | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [degree, setDegree] = useState<DegreeFilter>(ALL_DEGREES);
  const [{ data, fetching, error }, reexecute] = useQuery<
    AdminSchoolFacultiesResult,
    IdVariables
  >({ query: ADMIN_SCHOOL_FACULTIES_QUERY, variables: { id: schoolId } });
  const [{ fetching: deleting }, deleteFaculty] = useMutation<
    DeleteFacultyResult,
    IdVariables
  >(DELETE_FACULTY_MUTATION);

  function setOpen(id: string, open: boolean) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleDelete(faculty: Faculty) {
    const result = await deleteFaculty({ id: faculty.id }, CATALOG_CACHE);
    if (result.error) {
      toast.error("Сургуулийг устгаж чадсангүй", {
        description: getErrorMessage(result.error, {
          CONFLICT: FACULTY_HAS_MAJORS_MESSAGE,
        }),
      });
      return;
    }
    setConfirmingDeleteId(null);
    if (editing !== "new" && editing?.id === faculty.id) setEditing(null);
    toast.success(`${faculty.name} устгагдлаа`);
  }

  const faculties = data?.school?.faculties ?? [];
  const allMajors = data?.school?.majors ?? [];
  const majorsByFaculty = groupMajorsByFaculty(allMajors);
  const unassignedMajors = majorsByFaculty.get(null) ?? [];

  const degreeCounts = new Map<string, number>();
  for (const major of allMajors) {
    const key = degreeKey(major.degreeType);
    degreeCounts.set(key, (degreeCounts.get(key) ?? 0) + 1);
  }
  const degreeOptions = [
    { key: ALL_DEGREES, label: "Бүгд", count: allMajors.length },
    ...[...DEGREE_TYPES, OTHER_DEGREE]
      .filter((key) => PINNED_DEGREES.includes(key) || degreeCounts.has(key))
      .map((key) => ({
        key,
        label: formatDegreeKey(key),
        count: degreeCounts.get(key) ?? 0,
      })),
  ];
  const degreeLabel = degreeOptions.find(
    (option) => option.key === degree,
  )?.label;
  const filteringByDegree = degree !== ALL_DEGREES;

  // The degree filter narrows each school's majors but keeps every school
  // listed (so programs of that degree can still be added). A search also
  // hides schools without matches and expands the rest.
  const query = search.trim().toLocaleLowerCase();
  const matches = (text: string) => text.toLocaleLowerCase().includes(query);
  const rows = faculties
    .map((faculty) => {
      const majors = majorsByFaculty.get(faculty.id) ?? [];
      const ofDegree = filteringByDegree
        ? majors.filter((m) => degreeKey(m.degreeType) === degree)
        : majors;
      return {
        faculty,
        total: majors.length,
        majors:
          !query || matches(faculty.name)
            ? ofDegree
            : ofDegree.filter((m) => matches(m.name)),
      };
    })
    .filter(
      (row) => !query || row.majors.length > 0 || matches(row.faculty.name),
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink">Сургуулиуд</h3>
          <p className="text-xs text-ink/55">
            {faculties.length} сургууль · {allMajors.length} мэргэжил
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setConfirmingDeleteId(null);
            setEditing("new");
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Сургууль нэмэх
        </Button>
      </div>

      {editing === "new" && (
        <div className="rounded-xl border border-ink/10 bg-paper p-3">
          <FacultyForm
            key="new"
            schoolId={schoolId}
            faculty={null}
            onDone={(saved) => {
              setEditing(null);
              if (saved) setOpen(saved.id, true);
            }}
          />
        </div>
      )}

      {allMajors.length > 0 && (
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Мэргэжил эсвэл сургууль хайх..."
              aria-label="Мэргэжил эсвэл сургууль хайх"
              className="pl-11 pr-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Хайлтыг цэвэрлэх"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink/40 hover:bg-ink/[0.06] hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div
            role="radiogroup"
            aria-label="Зэргээр шүүх"
            className="flex flex-wrap gap-1.5"
          >
            {degreeOptions.map((option) => {
              const active = degree === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setDegree(option.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/15 text-ink/70 hover:border-ink/40 hover:text-ink",
                  )}
                >
                  {option.label}
                  <span className={active ? "text-paper/60" : "text-ink/40"}>
                    {option.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error ? (
        <ErrorState
          description={getErrorMessage(error)}
          onRetry={() => reexecute({ requestPolicy: "network-only" })}
        />
      ) : fetching && !data ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : faculties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Сургууль бүртгэгдээгүй байна"
          description="Мэргэжил нэмэхийн өмнө “Сургууль нэмэх” товчоор энэ их, дээд сургуулийн сургуулийг үүсгэнэ үү."
          className="py-10"
        />
      ) : rows.length === 0 ? (
        <p className="px-1 text-sm text-ink/60">“{search.trim()}” олдсонгүй.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ faculty, total, majors }) => {
            const open = Boolean(query) || openIds.has(faculty.id);
            const renaming = editing !== "new" && editing?.id === faculty.id;
            return (
              <li
                key={faculty.id}
                className="rounded-xl border border-ink/10 bg-paper"
              >
                {renaming ? (
                  <div className="p-3">
                    <FacultyForm
                      key={faculty.id}
                      schoolId={schoolId}
                      faculty={faculty}
                      onDone={() => setEditing(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 py-1 pl-1 pr-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpen(faculty.id, !openIds.has(faculty.id))
                      }
                      aria-expanded={open}
                      disabled={Boolean(query)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-ink/[0.04] disabled:hover:bg-transparent"
                    >
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 shrink-0 text-ink/40 transition-transform duration-200",
                          open && "rotate-90",
                        )}
                      />
                      <span className="truncate text-sm font-bold text-ink">
                        {faculty.name}
                      </span>
                      {faculty.location && (
                        <span className="hidden shrink-0 text-[11px] text-ink/50 sm:inline">
                          {faculty.location}
                        </span>
                      )}
                      <span className="shrink-0 rounded-full bg-ink/[0.06] px-2 py-0.5 text-[11px] font-semibold text-ink/60">
                        {(query || filteringByDegree) && majors.length !== total
                          ? `${majors.length}/${total}`
                          : total}
                      </span>
                    </button>
                    <DropdownMenu
                      label={`${faculty.name}: үйлдлүүд`}
                      items={[
                        {
                          label: "Засах",
                          icon: Pencil,
                          onSelect: () => {
                            setConfirmingDeleteId(null);
                            setEditing(faculty);
                          },
                        },
                        {
                          label: "Устгах",
                          icon: Trash2,
                          destructive: true,
                          onSelect: () => setConfirmingDeleteId(faculty.id),
                        },
                      ]}
                    />
                  </div>
                )}
                {confirmingDeleteId === faculty.id &&
                  (total > 0 ? (
                    <div className="mx-3 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink/10 bg-card px-3 py-2">
                      <p className="text-xs text-ink/70">
                        “{faculty.name}”-д {total} мэргэжил байгаа тул устгах
                        боломжгүй. Эхлээд мэргэжлүүдийг устгах эсвэл өөр
                        сургууль руу шилжүүлнэ үү.
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmingDeleteId(null)}
                      >
                        Ойлголоо
                      </Button>
                    </div>
                  ) : (
                    <InlineConfirm
                      className="mx-3 mb-3"
                      message={`“${faculty.name}” сургуулийг устгах уу?`}
                      busy={deleting}
                      onConfirm={() => handleDelete(faculty)}
                      onCancel={() => setConfirmingDeleteId(null)}
                    />
                  ))}
                {open && (
                  <div className="border-t border-ink/10 p-3">
                    <MajorList
                      faculties={faculties}
                      facultyId={faculty.id}
                      majors={majors}
                      canAdd={!query}
                      defaultDegreeType={
                        DEGREE_TYPES.includes(degree) ? degree : undefined
                      }
                      emptyMessage={
                        filteringByDegree
                          ? `Энэ сургуульд ${degreeLabel ?? ""} зэргийн мэргэжил алга.`
                          : undefined
                      }
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {unassignedMajors.length > 0 && !query && !filteringByDegree && (
        <section className="rounded-xl border border-dashed border-ink/20 bg-paper p-3">
          <h4 className="text-sm font-bold text-ink">Сургуульгүй мэргэжлүүд</h4>
          <p className="mb-2 mt-0.5 text-xs text-ink/60">
            Эдгээр мэргэжлийг “Засах” товчоор аль нэг сургуульд оноогоорой.
          </p>
          <MajorList
            faculties={faculties}
            facultyId={null}
            majors={unassignedMajors}
          />
        </section>
      )}
    </div>
  );
}
