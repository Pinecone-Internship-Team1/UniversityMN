import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Stands in for a section whose data hasn't been added yet, so it never renders empty. */
export function ComingSoon({ className }: { className?: string }) {
  const t = useTranslations("common");
  return <p className={cn("mt-4 text-[15px] text-ink-3", className)}>{t("comingSoon")}</p>;
}
