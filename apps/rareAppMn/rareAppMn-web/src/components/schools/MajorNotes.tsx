import { CUT_OFF_NOTE } from "@/lib/format";
import type { Major } from "@/lib/graphql/types";

export interface MajorNotesProps {
  majors: Pick<Major, "cutOffScore" | "tuitionFee" | "tuitionIsEstimate">[];
}

/** Footnotes for a list of majors, shown as text since phones can't show hover tooltips. */
export function MajorNotes({ majors }: MajorNotesProps) {
  const showsCutOff = majors.some((major) => major.cutOffScore != null);
  const showsEstimate = majors.some((major) => major.tuitionFee != null && major.tuitionIsEstimate);
  if (!showsCutOff && !showsEstimate) return null;
  return (
    <div className="mt-4 space-y-1 text-[11px] leading-relaxed text-ink/50">
      {showsCutOff && <p>{CUT_OFF_NOTE}</p>}
      {showsEstimate && <p>≈ тэмдэгтэй төлбөр нь жилийн ойролцоо тооцоо, албан ёсны дүн биш.</p>}
    </div>
  );
}
