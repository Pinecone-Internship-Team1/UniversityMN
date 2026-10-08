"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "urql";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  CATALOG_CACHE,
  CREATE_SCHOOL_MUTATION,
  UPDATE_SCHOOL_MUTATION,
  type AdminSchool,
  type CreateSchoolResult,
  type SchoolMutationVariables,
  type UpdateSchoolResult,
} from "@/lib/graphql/documents";
import { getErrorMessageWithDetail } from "@/lib/graphql/errors";
import type { SchoolInput } from "@/lib/graphql/types";
import {
  MAX_LONG_TEXT_LENGTH,
  parseOptionalNumber,
  parseOptionalText,
  parseOptionalUrl,
  parseRequiredText,
  type ValidationResult,
} from "@/lib/validation";

interface SchoolFormValues {
  name: string;
  location: string;
  tuitionFee: string;
  website: string;
  logoUrl: string;
  coverUrl: string;
  overview: string;
  dormAvailable: boolean;
  scholarshipAvailable: boolean;
}

function toFormValues(school: AdminSchool | null): SchoolFormValues {
  return {
    name: school?.name ?? "",
    location: school?.location ?? "",
    tuitionFee: school?.tuitionFee != null ? String(school.tuitionFee) : "",
    website: school?.website ?? "",
    logoUrl: school?.logoUrl ?? "",
    coverUrl: school?.coverUrl ?? "",
    overview: school?.overview ?? "",
    dormAvailable: school?.dormAvailable ?? false,
    scholarshipAvailable: school?.scholarshipAvailable ?? false,
  };
}

function parseSchoolForm(values: SchoolFormValues): ValidationResult<SchoolInput> {
  const name = parseRequiredText(values.name, "Сургуулийн нэр");
  if (!name.ok) return name;
  const location = parseOptionalText(values.location, "Байршил");
  if (!location.ok) return location;
  const tuitionFee = parseOptionalNumber(values.tuitionFee, "Сургалтын төлбөр");
  if (!tuitionFee.ok) return tuitionFee;
  const website = parseOptionalUrl(values.website, "Вэбсайт");
  if (!website.ok) return website;
  const logoUrl = parseOptionalUrl(values.logoUrl, "Лого URL");
  if (!logoUrl.ok) return logoUrl;
  const coverUrl = parseOptionalUrl(values.coverUrl, "Нүүр зургийн URL");
  if (!coverUrl.ok) return coverUrl;
  const overview = parseOptionalText(values.overview, "Танилцуулга", MAX_LONG_TEXT_LENGTH);
  if (!overview.ok) return overview;

  return {
    ok: true,
    value: {
      name: name.value,
      location: location.value,
      tuitionFee: tuitionFee.value,
      website: website.value,
      logoUrl: logoUrl.value,
      coverUrl: coverUrl.value,
      overview: overview.value,
      dormAvailable: values.dormAvailable,
      scholarshipAvailable: values.scholarshipAvailable,
    },
  };
}

export interface SchoolFormProps {
  school: AdminSchool | null;
  onSaved: (school: AdminSchool) => void;
}

export function SchoolForm({ school, onSaved }: SchoolFormProps) {
  const [values, setValues] = useState<SchoolFormValues>(() => toFormValues(school));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [{ fetching: creating }, createSchool] = useMutation<
    CreateSchoolResult,
    SchoolMutationVariables
  >(CREATE_SCHOOL_MUTATION);
  const [{ fetching: updating }, updateSchool] = useMutation<
    UpdateSchoolResult,
    SchoolMutationVariables
  >(UPDATE_SCHOOL_MUTATION);
  const saving = creating || updating;

  function set<K extends keyof SchoolFormValues>(key: K, value: SchoolFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    setErrorMessage(null);
    const parsed = parseSchoolForm(values);
    if (!parsed.ok) {
      setErrorMessage(parsed.error);
      return;
    }

    const result = school
      ? await updateSchool({ id: school.id, input: parsed.value }, CATALOG_CACHE)
      : await createSchool({ input: parsed.value }, CATALOG_CACHE);

    if (result.error) {
      const message = getErrorMessageWithDetail(result.error);
      setErrorMessage(message);
      toast.error("Сургуулийг хадгалж чадсангүй", { description: message });
      return;
    }

    const saved =
      result.data && "updateSchool" in result.data
        ? result.data.updateSchool
        : result.data && "createSchool" in result.data
          ? result.data.createSchool
          : null;
    if (!saved) return;
    setValues(toFormValues(saved));
    toast.success(school ? "Сургуулийн мэдээлэл шинэчлэгдлээ" : "Шинэ сургууль нэмэгдлээ");
    onSaved(saved);
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
          Сургуулийн нэр *
          <Input
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="жишээ: Монгол Улсын Их Сургууль"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          Байршил
          <Input
            value={values.location}
            onChange={(event) => set("location", event.target.value)}
            placeholder="жишээ: Сүхбаатар дүүрэг, Улаанбаатар"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          Жилийн сургалтын төлбөр (₮)
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={values.tuitionFee}
            onChange={(event) => set("tuitionFee", event.target.value)}
            placeholder="жишээ: 4500000"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          Вэбсайт
          <Input
            value={values.website}
            onChange={(event) => set("website", event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          Лого URL
          <Input
            value={values.logoUrl}
            onChange={(event) => set("logoUrl", event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70 sm:col-span-2">
          Нүүр зургийн URL
          <Input
            value={values.coverUrl}
            onChange={(event) => set("coverUrl", event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70 sm:col-span-2">
          Танилцуулга
          <Textarea
            value={values.overview}
            onChange={(event) => set("overview", event.target.value)}
            placeholder="Сургуулийн товч танилцуулга"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-5 text-sm text-ink/80">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.dormAvailable}
            onChange={(event) => set("dormAvailable", event.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Дотуур байртай
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.scholarshipAvailable}
            onChange={(event) => set("scholarshipAvailable", event.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Тэтгэлэгтэй
        </label>
      </div>

      {errorMessage && <p className="text-xs font-medium text-destructive">{errorMessage}</p>}

      <Button type="submit" variant="solid" size="md" disabled={saving}>
        <Save className="h-3.5 w-3.5" />
        {saving ? "Хадгалж байна..." : school ? "Өөрчлөлтийг хадгалах" : "Сургууль нэмэх"}
      </Button>
    </form>
  );
}
