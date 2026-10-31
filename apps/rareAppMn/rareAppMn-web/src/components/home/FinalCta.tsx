import Link from "next/link";
import { Search } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function FinalCta() {
  return (
    <section className="pb-16 md:pb-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-accent px-6 py-12 text-center text-accent-foreground md:px-12 md:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-black/10"
          />
          <h2 className="relative mx-auto max-w-2xl text-2xl sm:text-3xl lg:text-4xl">
            Өөрт тохирох сургуулиа одоо ол
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-base md:text-lg">
            Бүртгэлгүйгээр шууд хайж эхлээрэй.
          </p>
          <Link
            href="/schools"
            className="relative mt-8 inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-paper px-8 text-[17px] font-bold text-ink transition-transform active:scale-[0.98] hover:bg-card [&_svg]:size-5"
          >
            <Search aria-hidden="true" />
            Сургууль хайх
          </Link>
        </div>
      </Container>
    </section>
  );
}
