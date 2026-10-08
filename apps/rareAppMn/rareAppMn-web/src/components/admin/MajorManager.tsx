"use client";

import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "urql";
import { InlineConfirm } from "@/components/admin/InlineConfirm";
import { Button } from "@/components/ui/Button";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DEGREE_TYPES, formatDegreeType, formatTuition } from "@/lib/format";
import {
  CATALOG_CACHE,
  CREATE_MAJOR_MUTATION,
  DELETE_MAJOR_MUTATION,
  UPDATE_MAJOR_MUTATION,
  type AdminMajor,
  type CreateMajorResult,
  type DeleteMajorResult,
  type IdVariables,
  type MajorMutationVariables,
  type UpdateMajorResult,
} from "@/lib/graphql/documents";
import { getErrorMessage, getErrorMessageWithDetail } from "@/lib/graphql/errors";
import type { Faculty, MajorInput } from "@/lib/graphql/types";
import {
  MAX_EXAM_SCORE,
  parseOptionalNumber,
  parseOptionalText,
  parseRequiredText,
  parseSubjectList,
  type ValidationResult,
} from "@/lib/validation";

interface MajorFormValues {
  facultyId: string;
  name: string;
  category: string;
  degreeType: string;
  requiredSubjects: string;
  cutOffScore: string;
  tuitionFee: string;
}

function toFormValues(
  major: AdminMajor | null,
  defaultFacultyId: string | null,
  defaultDegreeType: string,
): MajorFormValues {
  return {
    facultyId: major?.facultyId ?? defaultFacultyId ?? "",
    name: major?.name ?? "",
    category: major?.category ?? "",
    degreeType: major ? (major.degreeType ?? "") : defaultDegreeType,
    requiredSubjects: (major?.requiredSubjects ?? []).join(", "),
    cutOffScore: major?.cutOffScore != null ? String(major.cutOffScore) : "",
    tuitionFee: major?.tuitionFee != null ? String(major.tuitionFee) : "",
  };
}

function parseMajorForm(values: MajorFormValues): ValidationResult<MajorInput> {
  if (!values.facultyId) return { ok: false, error: "Сургууль сонгоно уу." };
  const name = parseRequiredText(values.name, "Мэргэжлийн нэр");
  if (!name.ok) return name;
  const category = parseOptionalText(values.category, "Чиглэл");
  if (!category.ok) return category;
  const degreeType = parseOptionalText(values.degreeType, "Зэрэг");
  if (!degreeType.ok) return degreeType;
  const requiredSubjects = parseSubjectList(values.requiredSubjects, "Шалгалтын хичээл");
  if (!requiredSubjects.ok) return requiredSubjects;
  const cutOffScore = parseOptionalNumber(values.cutOffScore, "ЭЕШ босго оноо", MAX_EXAM_SCORE);
  if (!cutOffScore.ok) return cutOffScore;
  const tuitionFee = parseOptionalNumber(values.tuitionFee, "Сургалтын төлбөр");
  if (!tuitionFee.ok) return tuitionFee;

  return {
    ok: true,
    value: {
      facultyId: values.facultyId,
      name: name.value,
      category: category.value,
      degreeType: degreeType.value,
      requiredSubjects: requiredSubjects.value.length > 0 ? requiredSubjects.value : null,
      cutOffScore: cutOffScore.value,
      tuitionFee: tuitionFee.value,
    },
  };
}

function MajorForm({
  faculties,
  defaultFacultyId,
  defaultDegreeType,
  major,
  onDone,
}: {
  faculties: Faculty[];
  defaultFacultyId: string | null;
  defaultDegreeType: string;
  major: AdminMajor | null;
  onDone: () => void;
}) {
  const [values, setValues] = useState<MajorFormValues>(() =>
    toFormValues(major, defaultFacultyId, defaultDegreeType),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [{ fetching: creating }, createMajor] = useMutation<
    CreateMajorResult,
    MajorMutationVariables
  >(CREATE_MAJOR_MUTATION);
  const [{ fetching: updating }, updateMajor] = useMutation<
    UpdateMajorResult,
    MajorMutationVariables
  >(UPDATE_MAJOR_MUTATION);
  const saving = creating || updating;

  function set<K extends keyof MajorFormValues>(key: K, value: MajorFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    setErrorMessage(null);
    const parsed = parseMajorForm(values);
    if (!parsed.ok) {
      setErrorMessage(parsed.error);
      return;
    }

    const result = major
      ? await updateMajor({ id: major.id, input: parsed.value }, CATALOG_CACHE)
      : await createMajor({ input: parsed.value }, CATALOG_CACHE);

    if (result.error) {
      const message = getErrorMessageWithDetail(result.error);
      setErrorMessage(message);
      toast.error("Мэргэжлийг хадгалж чадсангүй", { description: message });
      return;
    }
    toast.success(major ? "Мэргэжил шинэчлэгдлээ" : "Шинэ мэргэжил нэмэгдлээ");
    onDone();
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70 sm:col-span-2">
          Мэргэжлийн нэр *
          <Input
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="жишээ: Компьютерийн ухаан"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70 sm:col-span-2">
          Сургууль *
          <Select
            value={values.facultyId}
            onChange={(event) => set("facultyId", event.target.value)}
          >
            <option value="">Сонгоно уу</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          Чиглэл
          <Input
            value={values.category}
            onChange={(event) => set("category", event.target.value)}
            placeholder="жишээ: Инженерчлэл"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          Зэрэг
          <Select
            value={values.degreeType}
            onChange={(event) => set("degreeType", event.target.value)}
          >
            <option value="">Сонгоогүй</option>
            {DEGREE_TYPES.map((degreeType) => (
              <option key={degreeType} value={degreeType}>
                {formatDegreeType(degreeType)}
              </option>
            ))}
            {values.degreeType && !DEGREE_TYPES.includes(values.degreeType) && (
              <option value={values.degreeType}>{values.degreeType}</option>
            )}
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70 sm:col-span-2">
          Шалгалтын хичээлүүд (таслалаар тусгаарлана)
          <Input
            value={values.requiredSubjects}
            onChange={(event) => set("requiredSubjects", event.target.value)}
            placeholder="жишээ: Математик, Физик"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          ЭЕШ босго оноо
          <Input
            type="number"
            min={0}
            max={MAX_EXAM_SCORE}
            value={values.cutOffScore}
            onChange={(event) => set("cutOffScore", event.target.value)}
            placeholder="жишээ: 550"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          Жилийн сургалтын төлбөр (₮)
          <Input
            type="number"
            min={0}
            value={values.tuitionFee}
            onChange={(event) => set("tuitionFee", event.target.value)}
            placeholder="жишээ: 4800000"
          />
        </label>
      </div>

      {errorMessage && (
        <p className="text-xs font-medium text-destructive">{errorMessage}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="solid" size="sm" disabled={saving}>
          <Save className="h-3.5 w-3.5" />
          {saving ? "Хадгалж байна..." : major ? "Хадгалах" : "Нэмэх"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDone} disabled={saving}>
          Болих
        </Button>
      </div>
    </form>
  );
}

/** One line of secondary details: category · degree · cut-off · tuition · exam subjects. */
function majorSummary(major: AdminMajor): string {
  const subjects = major.requiredSubjects ?? [];
  return [
    major.category,
    formatDegreeType(major.degreeType),
    major.cutOffScore != null ? `ЭЕШ ${major.cutOffScore}+` : null,
    major.tuitionFee != null ? formatTuition(major.tuitionFee) : null,
    subjects.length > 0 ? `Шалгалт: ${subjects.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export interface MajorListProps {
  /** Every faculty of the university, offered in the form's school picker. */
  faculties: Faculty[];
  /** The faculty these majors belong to; null for majors not assigned to one. */
  facultyId: string | null;
  majors: AdminMajor[];
  /** False while the list is narrowed by a search, so "add" doesn't look like it adds to the results. */
  canAdd?: boolean;
  /** Degree preselected for new majors; most programs are bachelor's. */
  defaultDegreeType?: string;
  /** Shown when `majors` is empty, e.g. because a degree filter hides them all. */
  emptyMessage?: string;
}

/** The majors of one faculty as compact rows, with edit/delete in a "⋯" menu. */
export function MajorList({
  faculties,
  facultyId,
  majors,
  canAdd = true,
  defaultDegreeType = "BACHELOR",
  emptyMessage = "Энэ сургуульд мэргэжил нэмэгдээгүй байна.",
}: MajorListProps) {
  const [editing, setEditing] = useState<AdminMajor | "new" | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [{ fetching: deleting }, deleteMajor] = useMutation<
    DeleteMajorResult,
    IdVariables
  >(DELETE_MAJOR_MUTATION);

  async function handleDelete(major: AdminMajor) {
    const result = await deleteMajor({ id: major.id }, CATALOG_CACHE);
    if (result.error) {
      toast.error("Мэргэжлийг устгаж чадсангүй", { description: getErrorMessage(result.error) });
      return;
    }
    setConfirmingDeleteId(null);
    if (editing !== "new" && editing?.id === major.id) setEditing(null);
    toast.success(`${major.name} устгагдлаа`);
  }

  return (
    <div className="space-y-2">
      {majors.length === 0 && editing !== "new" && (
        <p className="px-1 text-xs text-ink/50">{emptyMessage}</p>
      )}

      {majors.length > 0 && (
        <ul className="divide-y divide-ink/[0.07] rounded-lg border border-ink/10 bg-card">
          {majors.map((major) => {
            const summary = majorSummary(major);
            return (
              <li key={major.id} className="px-3 py-2">
                {editing !== "new" && editing?.id === major.id ? (
                  <div className="py-2">
                    <MajorForm
                      key={major.id}
                      faculties={faculties}
                      defaultFacultyId={facultyId}
                      defaultDegreeType={defaultDegreeType}
                      major={major}
                      onDone={() => setEditing(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {major.name}
                      </p>
                      {summary && (
                        <p className="truncate text-[11px] text-ink/50">
                          {summary}
                        </p>
                      )}
                    </div>
                    <DropdownMenu
                      label={`${major.name}: үйлдлүүд`}
                      items={[
                        {
                          label: "Засах",
                          icon: Pencil,
                          onSelect: () => {
                            setConfirmingDeleteId(null);
                            setEditing(major);
                          },
                        },
                        {
                          label: "Устгах",
                          icon: Trash2,
                          destructive: true,
                          onSelect: () => setConfirmingDeleteId(major.id),
                        },
                      ]}
                    />
                  </div>
                )}
                {confirmingDeleteId === major.id && (
                  <InlineConfirm
                    className="mt-2"
                    message={`“${major.name}” мэргэжлийг устгах уу?`}
                    busy={deleting}
                    onConfirm={() => handleDelete(major)}
                    onCancel={() => setConfirmingDeleteId(null)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editing === "new" ? (
        <div className="rounded-lg border border-ink/10 bg-card p-3">
          <MajorForm
            key="new"
            faculties={faculties}
            defaultFacultyId={facultyId}
            defaultDegreeType={defaultDegreeType}
            major={null}
            onDone={() => setEditing(null)}
          />
        </div>
      ) : (
        facultyId &&
        canAdd && (
          <Button variant="ghost" size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-3.5 w-3.5" />
            Мэргэжил нэмэх
          </Button>
        )
      )}
    </div>
  );
}
