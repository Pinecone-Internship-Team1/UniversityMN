import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const POPULAR_LINKS = [
  { label: "Мэргэжил хайх", href: "/schools?tab=majors" },
  { label: "Тэтгэлэг", href: "/scholarships" },
  { label: "Элсэлтийн хуанли", href: "/admissions" },
];

/** The body of the 404 and error pages: a big code, a title, a line of help and ways out. */
export function StatusPage({
  code,
  title,
  description,
  actions,
}: {
  code: string;
  title: string;
  description: string;
  /** Replaces the default «Нүүр хуудас» / «Сургууль хайх» buttons. */
  actions?: ReactNode;
}) {
  return (
    <Container size="narrow" className="flex flex-col items-center py-16 text-center md:py-24">
      <p className="font-display text-7xl font-bold tracking-tight text-accent md:text-8xl" aria-hidden="true">
        {code}
      </p>
      <h1 className="mt-6 text-2xl text-ink md:text-3xl">{title}</h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-ink-2 md:text-lg">{description}</p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        {actions ?? (
          <>
            <Link href="/schools" className={buttonClassName({})}>
              <Search />
              Сургууль хайх
            </Link>
            <Link href="/" className={buttonClassName({ variant: "secondary" })}>
              Нүүр хуудас
            </Link>
          </>
        )}
      </div>
      <nav aria-label="Түгээмэл хуудсууд" className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-1">
        {POPULAR_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex min-h-11 items-center font-bold text-ink-2 underline-offset-4 hover:text-accent hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </Container>
  );
}
