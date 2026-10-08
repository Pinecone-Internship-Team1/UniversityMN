"use client";

import { Plus, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "urql";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
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
  MAX_PHONES,
  parseOptionalEmail,
  parseOptionalNumber,
  parseOptionalText,
  parseOptionalUrl,
  parsePhoneList,
  parseRequiredText,
  type ValidationResult,
} from "@/lib/validation";

interface SchoolFormValues {
  name: string;
  location: string;
  tuitionFee: string;
  website: string;
  email: string;
  /** One entry per phone input row; blank rows are dropped on save. */
  phones: string[];
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
    email: school?.email ?? "",
    phones: school?.phones.length ? [...school.phones] : [""],
    logoUrl: school?.logoUrl ?? "",
    coverUrl: school?.coverUrl ?? "",
    overview: school?.overview ?? "",
    dormAvailable: school?.dormAvailable ?? false,
    scholarshipAvailable: school?.scholarshipAvailable ?? false,
  };
}

function parseSchoolForm(values: SchoolFormValues): ValidationResult<SchoolInput> {
  const name = parseRequiredText(values.name, "Их сургуулийн нэр");
  if (!name.ok) return name;
  const location = parseOptionalText(values.location, "Байршил");
  if (!location.ok) return location;
  const tuitionFee = parseOptionalNumber(values.tuitionFee, "Сургалтын төлбөр");
  if (!tuitionFee.ok) return tuitionFee;
  const website = parseOptionalUrl(values.website, "Вэбсайт");
  if (!website.ok) return website;
  const email = parseOptionalEmail(values.email, "И-мэйл");
  if (!email.ok) return email;
  const phones = parsePhoneList(values.phones);
  if (!phones.ok) return phones;
  const logoUrl = parseOptionalUrl(values.logoUrl, "Лого");
  if (!logoUrl.ok) return logoUrl;
  const coverUrl = parseOptionalUrl(values.coverUrl, "Нүүр зураг");
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
      email: email.value,
      phones: phones.value,
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
  const [uploading, setUploading] = useState({ logo: false, cover: false });
  const [{ fetching: creating }, createSchool] = useMutation<
    CreateSchoolResult,
    SchoolMutationVariables
  >(CREATE_SCHOOL_MUTATION);
  const [{ fetching: updating }, updateSchool] = useMutation<
    UpdateSchoolResult,
    SchoolMutationVariables
  >(UPDATE_SCHOOL_MUTATION);
  const saving = creating || updating;
  const uploadingImage = uploading.logo || uploading.cover;

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
      toast.error("Их сургуулийг хадгалж чадсангүй", { description: message });
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
    toast.success(school ? "Их сургуулийн мэдээлэл шинэчлэгдлээ" : "Шинэ их сургууль нэмэгдлээ");
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
          Их сургуулийн нэр *
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
          И-мэйл
          <Input
            type="email"
            value={values.email}
            onChange={(event) => set("email", event.target.value)}
            placeholder="жишээ: info@num.edu.mn"
          />
        </label>
        <div className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70 sm:col-span-2">
          Утасны дугаар
          <div className="space-y-2">
            {values.phones.map((phone, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) =>
                    set(
                      "phones",
                      values.phones.map((current, i) => (i === index ? event.target.value : current)),
                    )
                  }
                  placeholder="жишээ: +976 7730-7730"
                  aria-label={`Утасны дугаар ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "phones",
                      values.phones.length > 1 ? values.phones.filter((_, i) => i !== index) : [""],
                    )
                  }
                  aria-label={`Утасны дугаар ${index + 1}-г хасах`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-ink/[0.06] hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {values.phones.length < MAX_PHONES && (
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => set("phones", [...values.phones, ""])}
            >
              <Plus className="h-3.5 w-3.5" />
              Утас нэмэх
            </Button>
          )}
        </div>
        <ImageUploadField
          label="Лого"
          variant="logo"
          maxSize={512}
          value={values.logoUrl}
          onChange={(url) => set("logoUrl", url)}
          onUploadingChange={(logo) => setUploading((current) => ({ ...current, logo }))}
        />
        <ImageUploadField
          label="Нүүр зураг"
          variant="cover"
          maxSize={1600}
          value={values.coverUrl}
          onChange={(url) => set("coverUrl", url)}
          onUploadingChange={(cover) => setUploading((current) => ({ ...current, cover }))}
        />
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70 sm:col-span-2">
          Танилцуулга
          <Textarea
            value={values.overview}
            onChange={(event) => set("overview", event.target.value)}
            placeholder="Их сургуулийн товч танилцуулга"
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

      <Button type="submit" variant="solid" size="md" disabled={saving || uploadingImage}>
        <Save className="h-3.5 w-3.5" />
        {saving
          ? "Хадгалж байна..."
          : uploadingImage
            ? "Зураг оруулж байна..."
            : school
              ? "Өөрчлөлтийг хадгалах"
              : "Их сургууль нэмэх"}
      </Button>
    </form>
  );
}
