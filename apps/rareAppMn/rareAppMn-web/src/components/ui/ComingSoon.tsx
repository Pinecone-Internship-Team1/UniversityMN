import { cn } from "@/lib/utils";

/** Stands in for a section whose data hasn't been added yet, so it never renders empty. */
export function ComingSoon({ className }: { className?: string }) {
  return <p className={cn("mt-4 text-sm text-ink/60", className)}>Мэдээлэл удахгүй нэмэгдэнэ.</p>;
}
