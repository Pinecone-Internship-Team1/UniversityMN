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
import {
  DEGREE_TYPES,
  examSubjectLines,
  formatCutOff,
  formatDegreeType,
  formatMajorTuition,
  formatSelectionType,
} from "@/lib/format";
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
import { useTranslations } from "next-intl";
import type { FormatT, ValidationT } from "@/i18n/types";

type MajorFormT = ReturnType<typeof useTranslations<"admin.majors">>;
import type { Faculty, MajorInput } from "@/lib/graphql/types";
import {
  MAX_EXAM_SCORE,
  MAX_LONG_TEXT_LENGTH,
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
  primarySubjects: string;
  secondarySubjects: string;
  examNote: string;
  cutOffScore: string;
  secondaryCutOffScore: string;
  primaryWeight: string;
  secondaryWeight: string;
  selectionType: string;
  tuitionFee: string;
  tuitionIsEstimate: boolean;
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
    primarySubjects: (major?.primarySubjects ?? []).join(", "),
    secondarySubjects: (major?.secondarySubjects ?? []).join(", "),
    examNote: major?.examNote ?? "",
    cutOffScore: major?.cutOffScore != null ? String(major.cutOffScore) : "",
    secondaryCutOffScore:
      major?.secondaryCutOffScore != null ? String(major.secondaryCutOffScore) : "",
    primaryWeight: major?.primaryWeight != null ? String(major.primaryWeight) : "",
    secondaryWeight: major?.secondaryWeight != null ? String(major.secondaryWeight) : "",
    selectionType: major?.selectionType ?? "",
    tuitionFee: major?.tuitionFee != null ? String(major.tuitionFee) : "",
    tuitionIsEstimate: major?.tuitionIsEstimate ?? false,
  };
}

/** АШУҮИС adds its two exams (1 + 1); МУИС, ШУТИС use 0.7 + 0.3. */
const MAX_EXAM_WEIGHT = 1;

/** `t` names each field in error messages ("admin.majors.fields.<field>"). */
function parseMajorForm(tv: ValidationT, t: MajorFormT, values: MajorFormValues): ValidationResult<MajorInput> {
  if (!values.facultyId) return { ok: false, error: t("pickFaculty") };
  const name = parseRequiredText(tv, values.name, t("fields.name"));
  if (!name.ok) return name;
  const category = parseOptionalText(tv, values.category, t("fields.category"));
  if (!category.ok) return category;
  const degreeType = parseOptionalText(tv, values.degreeType, t("fields.degree"));
  if (!degreeType.ok) return degreeType;
  const requiredSubjects = parseSubjectList(tv, values.requiredSubjects, t("fields.requiredSubjects"));
  if (!requiredSubjects.ok) return requiredSubjects;
  const primarySubjects = parseSubjectList(tv, values.primarySubjects, t("fields.primarySubjects"));
  if (!primarySubjects.ok) return primarySubjects;
  const secondarySubjects = parseSubjectList(tv, values.secondarySubjects, t("fields.secondarySubjects"));
  if (!secondarySubjects.ok) return secondarySubjects;
  const examNote = parseOptionalText(tv, values.examNote, t("fields.examNote"), MAX_LONG_TEXT_LENGTH);
  if (!examNote.ok) return examNote;
  const cutOffScore = parseOptionalNumber(tv, values.cutOffScore, t("fields.cutOff"), MAX_EXAM_SCORE);
  if (!cutOffScore.ok) return cutOffScore;
  const secondaryCutOffScore = parseOptionalNumber(
    tv,
    values.secondaryCutOffScore,
    t("fields.secondaryCutOff"),
    MAX_EXAM_SCORE,
  );
  if (!secondaryCutOffScore.ok) return secondaryCutOffScore;
  const primaryWeight = parseOptionalNumber(tv, values.primaryWeight, t("fields.primaryWeight"), MAX_EXAM_WEIGHT);
  if (!primaryWeight.ok) return primaryWeight;
  const secondaryWeight = parseOptionalNumber(
    tv,
    values.secondaryWeight,
    t("fields.secondaryWeight"),
    MAX_EXAM_WEIGHT,
  );
  if (!secondaryWeight.ok) return secondaryWeight;
  const tuitionFee = parseOptionalNumber(tv, values.tuitionFee, t("fields.tuitionFee"));
  if (!tuitionFee.ok) return tuitionFee;

  return {
    ok: true,
    value: {
      facultyId: values.facultyId,
      name: name.value,
      category: category.value,
      degreeType: degreeType.value,
      requiredSubjects: requiredSubjects.value.length > 0 ? requiredSubjects.value : null,
      primarySubjects: primarySubjects.value.length > 0 ? primarySubjects.value : null,
      secondarySubjects: secondarySubjects.value.length > 0 ? secondarySubjects.value : null,
      examNote: examNote.value,
      cutOffScore: cutOffScore.value,
      secondaryCutOffScore: secondaryCutOffScore.value,
      primaryWeight: primaryWeight.value,
      secondaryWeight: secondaryWeight.value,
      selectionType: values.selectionType || null,
      tuitionFee: tuitionFee.value,
      tuitionIsEstimate: tuitionFee.value != null && values.tuitionIsEstimate,
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
  const t = useTranslations("admin.majors");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const tErrors = useTranslations("errors");
  const tFormat = useTranslations("format");
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
    const parsed = parseMajorForm(tv, t, values);
    if (!parsed.ok) {
      setErrorMessage(parsed.error);
      return;
    }

    const result = major
      ? await updateMajor({ id: major.id, input: parsed.value }, CATALOG_CACHE)
      : await createMajor({ input: parsed.value }, CATALOG_CACHE);

    if (result.error) {
      const message = getErrorMessageWithDetail(tErrors, result.error);
      setErrorMessage(message);
      toast.error(t("saveFailed"), { description: message });
      return;
    }
    toast.success(major ? t("updated") : t("created"));
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
      <p className="text-[11px] text-ink/50">{t("requiredNote")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70 sm:col-span-2">
          {t("nameLabel")}
          <Input
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder={t("namePlaceholder")}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70 sm:col-span-2">
          {t("facultyLabel")}
          <Select
            value={values.facultyId}
            onChange={(event) => set("facultyId", event.target.value)}
          >
            <option value="">{t("choose")}</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          {t("fields.category")}
          <Input
            value={values.category}
            onChange={(event) => set("category", event.target.value)}
            placeholder={t("categoryPlaceholder")}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          {t("fields.degree")}
          <Select
            value={values.degreeType}
            onChange={(event) => set("degreeType", event.target.value)}
          >
            <option value="">{t("notChosen")}</option>
            {DEGREE_TYPES.map((degreeType) => (
              <option key={degreeType} value={degreeType}>
                {formatDegreeType(tFormat, degreeType)}
              </option>
            ))}
            {values.degreeType && !DEGREE_TYPES.includes(values.degreeType) && (
              <option value={values.degreeType}>{values.degreeType}</option>
            )}
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70 sm:col-span-2">
          {t("requiredSubjectsLabel")}
          <Input
            value={values.requiredSubjects}
            onChange={(event) => set("requiredSubjects", event.target.value)}
            placeholder={t("subjectsPlaceholder")}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          {t("primarySubjectsLabel")}
          <Input
            value={values.primarySubjects}
            onChange={(event) => set("primarySubjects", event.target.value)}
            placeholder={t("subjectsPlaceholder")}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          {t("secondarySubjectsLabel")}
          <Input
            value={values.secondarySubjects}
            onChange={(event) => set("secondarySubjects", event.target.value)}
            placeholder={t("secondaryPlaceholder")}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70 sm:col-span-2">
          {t("examNoteLabel")}
          <Input
            value={values.examNote}
            onChange={(event) => set("examNote", event.target.value)}
            placeholder={t("examNotePlaceholder")}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          {t("fields.cutOff")}
          <Input
            type="number"
            min={0}
            max={MAX_EXAM_SCORE}
            value={values.cutOffScore}
            onChange={(event) => set("cutOffScore", event.target.value)}
            placeholder={t("example", { value: 550 })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          {t("secondaryCutOffLabel")}
          <Input
            type="number"
            min={0}
            max={MAX_EXAM_SCORE}
            value={values.secondaryCutOffScore}
            onChange={(event) => set("secondaryCutOffScore", event.target.value)}
            placeholder={t("example", { value: 450 })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          {t("primaryWeightLabel")}
          <Input
            type="number"
            min={0}
            max={MAX_EXAM_WEIGHT}
            step="0.1"
            value={values.primaryWeight}
            onChange={(event) => set("primaryWeight", event.target.value)}
            placeholder={t("weightPlaceholder")}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          {t("secondaryWeightLabel")}
          <Input
            type="number"
            min={0}
            max={MAX_EXAM_WEIGHT}
            step="0.1"
            value={values.secondaryWeight}
            onChange={(event) => set("secondaryWeight", event.target.value)}
            placeholder={t("weightPlaceholder")}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          {t("selectionLabel")}
          <Select
            value={values.selectionType}
            onChange={(event) => set("selectionType", event.target.value)}
          >
            <option value="">{t("unknown")}</option>
            <option value="list">{formatSelectionType(tFormat, "list")}</option>
            <option value="direct">{formatSelectionType(tFormat, "direct")}</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          {t("tuitionLabel")}
          <Input
            type="number"
            min={0}
            value={values.tuitionFee}
            onChange={(event) => set("tuitionFee", event.target.value)}
            placeholder={t("tuitionPlaceholder")}
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink/70 max-lg:tap-target sm:col-span-2">
          <input
            type="checkbox"
            checked={values.tuitionIsEstimate}
            onChange={(event) => set("tuitionIsEstimate", event.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          {t("estimateLabel")}
        </label>
      </div>

      {errorMessage && (
        <p className="text-xs font-medium text-destructive">{errorMessage}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="solid" size="sm" disabled={saving}>
          <Save className="h-3.5 w-3.5" />
          {saving ? t("saving") : major ? tc("save") : t("add")}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDone} disabled={saving}>
          {tc("cancel")}
        </Button>
      </div>
    </form>
  );
}

/** One line of secondary details: category · degree · cut-off · tuition · exam subjects. */
function majorSummary(t: MajorFormT, tFormat: FormatT, major: AdminMajor): string {
  const cutOff = formatCutOff(tFormat, major);
  return [
    major.category,
    formatDegreeType(tFormat, major.degreeType),
    cutOff != null ? t("cutOffShort", { value: cutOff }) : null,
    major.tuitionFee != null ? formatMajorTuition(tFormat, major) : null,
    ...examSubjectLines(tFormat, major).map((exam) => `${exam.label}: ${exam.text}`),
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
  emptyMessage,
}: MajorListProps) {
  const t = useTranslations("admin.majors");
  const tc = useTranslations("common");
  const tFormat = useTranslations("format");
  const tErrors = useTranslations("errors");
  emptyMessage ??= t("empty");
  const [editing, setEditing] = useState<AdminMajor | "new" | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [{ fetching: deleting }, deleteMajor] = useMutation<
    DeleteMajorResult,
    IdVariables
  >(DELETE_MAJOR_MUTATION);

  async function handleDelete(major: AdminMajor) {
    const result = await deleteMajor({ id: major.id }, CATALOG_CACHE);
    if (result.error) {
      toast.error(t("deleteFailed"), { description: getErrorMessage(tErrors, result.error) });
      return;
    }
    setConfirmingDeleteId(null);
    if (editing !== "new" && editing?.id === major.id) setEditing(null);
    toast.success(t("deleted", { name: major.name }));
  }

  return (
    <div className="space-y-2">
      {majors.length === 0 && editing !== "new" && (
        <p className="px-1 text-xs text-ink/50">{emptyMessage}</p>
      )}

      {majors.length > 0 && (
        <ul className="divide-y divide-ink/[0.07] rounded-lg border border-ink/10 bg-card">
          {majors.map((major) => {
            const summary = majorSummary(t, tFormat, major);
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
                      label={t("actions", { name: major.name })}
                      items={[
                        {
                          label: tc("edit"),
                          icon: Pencil,
                          onSelect: () => {
                            setConfirmingDeleteId(null);
                            setEditing(major);
                          },
                        },
                        {
                          label: tc("delete"),
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
                    message={t("confirmDelete", { name: major.name })}
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
            {t("addMajor")}
          </Button>
        )
      )}
    </div>
  );
}
