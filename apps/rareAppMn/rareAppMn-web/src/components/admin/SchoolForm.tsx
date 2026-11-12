"use client";

import { Plus, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "urql";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
import { useTranslations } from "next-intl";
import type { ValidationT } from "@/i18n/types";

type SchoolFormT = ReturnType<typeof useTranslations<"admin.schoolForm">>;
import type { SchoolInput } from "@/lib/graphql/types";
import {
  MAX_LONG_TEXT_LENGTH,
  MAX_PHONES,
  parseAliasList,
  parseOptionalEmail,
  parseOptionalNumber,
  parseOptionalText,
  parseOptionalUrl,
  parsePhoneList,
  parseRequiredText,
  type ValidationResult,
} from "@/lib/validation";

/** A yes/no fact that can also be not yet known. */
type Availability = "unknown" | "yes" | "no";

function toAvailability(value: boolean | null | undefined): Availability {
  if (value == null) return "unknown";
  return value ? "yes" : "no";
}

function fromAvailability(value: Availability): boolean | null {
  return value === "unknown" ? null : value === "yes";
}

interface SchoolFormValues {
  name: string;
  location: string;
  tuitionFee: string;
  tuitionText: string;
  website: string;
  email: string;
  /** One entry per phone input row; blank rows are dropped on save. */
  phones: string[];
  logoUrl: string;
  coverUrl: string;
  overview: string;
  dormAvailable: Availability;
  scholarshipAvailable: Availability;
  /** Comma-separated. */
  aliases: string;
}

function toFormValues(school: AdminSchool | null): SchoolFormValues {
  return {
    name: school?.name ?? "",
    location: school?.location ?? "",
    tuitionFee: school?.tuitionFee != null ? String(school.tuitionFee) : "",
    tuitionText: school?.tuitionText ?? "",
    website: school?.website ?? "",
    email: school?.email ?? "",
    phones: school?.phones.length ? [...school.phones] : [""],
    logoUrl: school?.logoUrl ?? "",
    coverUrl: school?.coverUrl ?? "",
    overview: school?.overview ?? "",
    dormAvailable: toAvailability(school?.dormAvailable),
    scholarshipAvailable: toAvailability(school?.scholarshipAvailable),
    aliases: school?.aliases?.join(", ") ?? "",
  };
}

/** `t` names each field in error messages ("admin.schoolForm.fields.<field>"). */
function parseSchoolForm(
  tv: ValidationT,
  t: SchoolFormT,
  values: SchoolFormValues,
): ValidationResult<SchoolInput> {
  const name = parseRequiredText(tv, values.name, t("fields.name"));
  if (!name.ok) return name;
  const location = parseOptionalText(tv, values.location, t("fields.location"));
  if (!location.ok) return location;
  const tuitionFee = parseOptionalNumber(tv, values.tuitionFee, t("fields.tuitionFee"));
  if (!tuitionFee.ok) return tuitionFee;
  const tuitionText = parseOptionalText(tv, values.tuitionText, t("fields.tuitionText"));
  if (!tuitionText.ok) return tuitionText;
  const website = parseOptionalUrl(tv, values.website, t("fields.website"));
  if (!website.ok) return website;
  const email = parseOptionalEmail(tv, values.email, t("fields.email"));
  if (!email.ok) return email;
  const phones = parsePhoneList(tv, values.phones);
  if (!phones.ok) return phones;
  const logoUrl = parseOptionalUrl(tv, values.logoUrl, t("fields.logo"));
  if (!logoUrl.ok) return logoUrl;
  const coverUrl = parseOptionalUrl(tv, values.coverUrl, t("fields.cover"));
  if (!coverUrl.ok) return coverUrl;
  const overview = parseOptionalText(tv, values.overview, t("fields.overview"), MAX_LONG_TEXT_LENGTH);
  if (!overview.ok) return overview;
  const aliases = parseAliasList(tv, values.aliases);
  if (!aliases.ok) return aliases;

  return {
    ok: true,
    value: {
      name: name.value,
      location: location.value,
      tuitionFee: tuitionFee.value,
      tuitionText: tuitionText.value,
      website: website.value,
      email: email.value,
      phones: phones.value,
      logoUrl: logoUrl.value,
      coverUrl: coverUrl.value,
      overview: overview.value,
      dormAvailable: fromAvailability(values.dormAvailable),
      scholarshipAvailable: fromAvailability(values.scholarshipAvailable),
      aliases: aliases.value,
    },
  };
}

export interface SchoolFormProps {
  school: AdminSchool | null;
  onSaved: (school: AdminSchool) => void;
}

export function SchoolForm({ school, onSaved }: SchoolFormProps) {
  const t = useTranslations("admin.schoolForm");
  const tv = useTranslations("validation");
  const tErrors = useTranslations("errors");
  const tFormat = useTranslations("format");
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
    const parsed = parseSchoolForm(tv, t, values);
    if (!parsed.ok) {
      setErrorMessage(parsed.error);
      return;
    }

    const result = school
      ? await updateSchool({ id: school.id, input: parsed.value }, CATALOG_CACHE)
      : await createSchool({ input: parsed.value }, CATALOG_CACHE);

    if (result.error) {
      const message = getErrorMessageWithDetail(tErrors, result.error);
      setErrorMessage(message);
      toast.error(t("saveFailed"), { description: message });
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
    toast.success(school ? t("updated") : t("created"));
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
          {t("aliasesLabel")}
          <Input
            value={values.aliases}
            onChange={(event) => set("aliases", event.target.value)}
            placeholder={t("aliasesPlaceholder")}
          />
          <span className="font-normal text-ink/50">
            {t("aliasesHint")}
          </span>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          {t("fields.location")}
          <Input
            value={values.location}
            onChange={(event) => set("location", event.target.value)}
            placeholder={t("locationPlaceholder")}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          {t("tuitionFeeLabel")}
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={values.tuitionFee}
            onChange={(event) => set("tuitionFee", event.target.value)}
            placeholder={t("tuitionFeePlaceholder")}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70 sm:col-span-2">
          {t("tuitionTextLabel")}
          <Input
            value={values.tuitionText}
            onChange={(event) => set("tuitionText", event.target.value)}
            placeholder={t("tuitionTextPlaceholder")}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          {t("fields.website")}
          <Input
            value={values.website}
            onChange={(event) => set("website", event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
          {t("fields.email")}
          <Input
            type="email"
            value={values.email}
            onChange={(event) => set("email", event.target.value)}
            placeholder={t("emailPlaceholder")}
          />
        </label>
        <div className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70 sm:col-span-2">
          {t("phones")}
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
                  placeholder={t("phonePlaceholder")}
                  aria-label={t("phoneN", { n: index + 1 })}
                />
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "phones",
                      values.phones.length > 1 ? values.phones.filter((_, i) => i !== index) : [""],
                    )
                  }
                  aria-label={t("removePhoneN", { n: index + 1 })}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-ink/[0.06] hover:text-ink max-lg:tap-target"
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
              {t("addPhone")}
            </Button>
          )}
        </div>
        <ImageUploadField
          label={t("fields.logo")}
          variant="logo"
          maxSize={512}
          value={values.logoUrl}
          onChange={(url) => set("logoUrl", url)}
          onUploadingChange={(logo) => setUploading((current) => ({ ...current, logo }))}
        />
        <ImageUploadField
          label={t("fields.cover")}
          variant="cover"
          maxSize={1600}
          value={values.coverUrl}
          onChange={(url) => set("coverUrl", url)}
          onUploadingChange={(cover) => setUploading((current) => ({ ...current, cover }))}
        />
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70 sm:col-span-2">
          {t("fields.overview")}
          <Textarea
            value={values.overview}
            onChange={(event) => set("overview", event.target.value)}
            placeholder={t("overviewPlaceholder")}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["dormAvailable", t("dorm")],
            ["scholarshipAvailable", t("scholarship")],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
            {label}
            <Select
              value={values[key]}
              onChange={(event) => set(key, event.target.value as Availability)}
            >
              <option value="unknown">{t("unknownOption")}</option>
              <option value="yes">{tFormat("available")}</option>
              <option value="no">{tFormat("unavailable")}</option>
            </Select>
          </label>
        ))}
      </div>

      {errorMessage && <p className="text-xs font-medium text-destructive">{errorMessage}</p>}

      <Button type="submit" variant="solid" size="md" disabled={saving || uploadingImage}>
        <Save className="h-3.5 w-3.5" />
        {saving
          ? t("saving")
          : uploadingImage
            ? t("uploadingImage")
            : school
              ? t("saveChanges")
              : t("create")}
      </Button>
    </form>
  );
}
