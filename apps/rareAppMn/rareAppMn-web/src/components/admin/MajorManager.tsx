"use client";

import { Pencil, Plus, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "urql";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDegreeType, formatTuition } from "@/lib/format";
import {
  ADMIN_SCHOOL_MAJORS_QUERY,
  CATALOG_CACHE,
  CREATE_MAJOR_MUTATION,
  DELETE_MAJOR_MUTATION,
  UPDATE_MAJOR_MUTATION,
  type AdminMajor,
  type AdminSchoolMajorsResult,
  type CreateMajorResult,
  type DeleteMajorResult,
  type IdVariables,
  type MajorMutationVariables,
  type UpdateMajorResult,
} from "@/lib/graphql/documents";
import { getErrorMessage, getErrorMessageWithDetail } from "@/lib/graphql/errors";
import type { MajorInput } from "@/lib/graphql/types";
import {
  MAX_EXAM_SCORE,
  parseOptionalNumber,
  parseOptionalText,
  parseRequiredText,
  parseSubjectList,
  type ValidationResult,
} from "@/lib/validation";

const DEGREE_TYPES = ["BACHELOR", "MASTER", "DOCTORATE", "DIPLOMA"];

interface MajorFormValues {
  name: string;
  category: string;
  degreeType: string;
  requiredSubjects: string;
  cutOffScore: string;
  tuitionFee: string;
}

function toFormValues(major: AdminMajor | null): MajorFormValues {
  return {
    name: major?.name ?? "",
    category: major?.category ?? "",
    degreeType: major?.degreeType ?? "",
    requiredSubjects: (major?.requiredSubjects ?? []).join(", "),
    cutOffScore: major?.cutOffScore != null ? String(major.cutOffScore) : "",
    tuitionFee: major?.tuitionFee != null ? String(major.tuitionFee) : "",
  };
}

function parseMajorForm(
  values: MajorFormValues,
  schoolId: string,
): ValidationResult<MajorInput> {
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
      schoolId,
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
  schoolId,
  major,
  onDone,
}: {
  schoolId: string;
  major: AdminMajor | null;
  onDone: () => void;
}) {
  const [values, setValues] = useState<MajorFormValues>(() => toFormValues(major));
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
    const parsed = parseMajorForm(values, schoolId);
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
      className="space-y-4 rounded-xl border border-ink/10 bg-paper p-4"
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

      {errorMessage && <p className="text-xs font-medium text-destructive">{errorMessage}</p>}

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

export function MajorManager({ schoolId }: { schoolId: string }) {
  const [editing, setEditing] = useState<AdminMajor | "new" | null>(null);
  const [{ data, fetching, error }, reexecute] = useQuery<
    AdminSchoolMajorsResult,
    IdVariables
  >({ query: ADMIN_SCHOOL_MAJORS_QUERY, variables: { id: schoolId } });
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
    if (editing !== "new" && editing?.id === major.id) setEditing(null);
    toast.success(`${major.name} устгагдлаа`);
  }

  const majors = data?.school?.majors ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-ink">Мэргэжлүүд ({majors.length})</h3>
        <Button variant="outline" size="sm" onClick={() => setEditing("new")}>
          <Plus className="h-3.5 w-3.5" />
          Мэргэжил нэмэх
        </Button>
      </div>

      {editing === "new" && (
        <div className="mt-4">
          <MajorForm key="new" schoolId={schoolId} major={null} onDone={() => setEditing(null)} />
        </div>
      )}

      <div className="mt-4">
        {error ? (
          <ErrorState
            description={getErrorMessage(error)}
            onRetry={() => reexecute({ requestPolicy: "network-only" })}
          />
        ) : fetching && !data ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : majors.length === 0 ? (
          <EmptyState
            title="Мэргэжил бүртгэгдээгүй байна"
            description="Дээрх товчоор энэ сургуульд мэргэжил нэмнэ үү."
          />
        ) : (
          <ul className="space-y-2.5">
            {majors.map((major) => (
              <li key={major.id} className="rounded-xl border border-ink/10 bg-card p-4">
                {editing !== "new" && editing?.id === major.id ? (
                  <MajorForm
                    key={major.id}
                    schoolId={schoolId}
                    major={major}
                    onDone={() => setEditing(null)}
                  />
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">{major.name}</p>
                      <p className="mt-0.5 text-xs text-ink/60">
                        {[
                          major.category,
                          formatDegreeType(major.degreeType),
                          major.cutOffScore != null ? `ЭЕШ ${major.cutOffScore}+` : null,
                          major.tuitionFee != null ? formatTuition(major.tuitionFee) : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {(major.requiredSubjects ?? []).length > 0 && (
                        <p className="mt-0.5 text-[11px] text-ink/50">
                          Шалгалт: {(major.requiredSubjects ?? []).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(major)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Засах
                      </Button>
                      <ConfirmDeleteButton
                        disabled={deleting}
                        onConfirm={() => handleDelete(major)}
                      />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
