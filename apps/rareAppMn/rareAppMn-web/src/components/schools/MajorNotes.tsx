import { useTranslations } from "next-intl";
import type { Major } from "@/lib/graphql/types";

export interface MajorNotesProps {
  majors: Pick<Major, "cutOffScore" | "tuitionFee" | "tuitionIsEstimate">[];
}

/** Footnotes for a list of majors, shown as text since phones can't show hover tooltips. */
export function MajorNotes({ majors }: MajorNotesProps) {
  const showsCutOff = majors.some((major) => major.cutOffScore != null);
  const showsEstimate = majors.some((major) => major.tuitionFee != null && major.tuitionIsEstimate);
  const t = useTranslations("format");
  if (!showsCutOff && !showsEstimate) return null;
  return (
    <div className="mt-5 space-y-1.5 text-sm leading-relaxed text-ink-3">
      {showsCutOff && <p>{t("cutOffNote")}</p>}
      {showsEstimate && <p>{t("estimateNote")}</p>}
    </div>
  );
}
