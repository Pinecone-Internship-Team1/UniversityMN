import { Info } from "lucide-react";

/**
 * Temporary: accounts from Clerk's test instance must sign up again in the
 * live one (the service moves their saved data to the new account by email).
 * To remove, delete this file and its line in AuthPageShell.
 */
export function SignUpAgainNote() {
  return (
    <p className="mt-6 flex w-full items-start gap-3 rounded-2xl border border-accent/25 bg-accent/[0.06] px-4 py-3 text-[15px] leading-relaxed text-ink">
      <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      <span>
        Нэвтрэх системээ шинэчиллээ. Өмнө нь бүртгэлтэй байсан бол өмнөх имэйл
        хаягаараа дахин нэг удаа бүртгүүлээрэй. Таны хадгалсан мэдээлэл хэвээрээ
        үлдэнэ.
      </span>
    </p>
  );
}
