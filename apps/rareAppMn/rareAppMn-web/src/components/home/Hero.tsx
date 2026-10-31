import Link from "next/link";
import { ArrowDown, Search } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { HeroCursorTrail } from "./HeroCursorTrail";
import { HeroLogos } from "./HeroLogos";
import { HeroMark } from "./HeroMark";
import { ScoreForm } from "./ScoreForm";

/**
 * The hook: the student's problem in one line, what Oyutan MN is, and the two
 * ways in (score or search). On phones the headline, score box and primary
 * button fit above the fold. From tablet up, the Oyutan MN mark fills the
 * right column with school logos orbiting it; logos also follow the mouse on
 * devices that have one.
 */
export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_80%_0%,var(--accent-soft),transparent)]"
      />
      <HeroLogos />
      <HeroCursorTrail />
      <Container className="grid grid-cols-1 items-center gap-10 pt-8 pb-14 md:grid-cols-[minmax(0,1fr)_auto] md:pt-14 md:pb-20 lg:gap-16 lg:pt-20 lg:pb-24">
        <div>
          <h1 className="text-[1.75rem] leading-[1.15] text-ink min-[390px]:text-[1.9rem] sm:text-5xl lg:text-[3.4rem]">
            Сургууль бүрийн сайтаар тэнэх хэрэггүй.{" "}
            <span className="text-accent">Бүгд нэг дор.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
            Oyutan MN бол Монголын их, дээд сургуулиудын босго оноо, мэргэжил, төлбөр,
            тэтгэлэг, элсэлтийн хуанлийг нэг дор цуглуулсан үнэгүй платформ.
          </p>

          <ScoreForm className="mt-6 max-w-xl" />

          <div className="mt-4 flex flex-col gap-3 min-[400px]:flex-row">
            <Link href="/schools" className={buttonClassName({ size: "lg", className: "min-[400px]:flex-1 sm:flex-none" })}>
              <Search />
              Сургууль хайх
            </Link>
            <a
              href="#story"
              className={buttonClassName({ variant: "secondary", size: "lg", className: "min-[400px]:flex-1 sm:flex-none" })}
            >
              Бидний тухай
              <ArrowDown />
            </a>
          </div>
        </div>

        {/* Tablet and up: the brand mark, centred on the headline block; hidden on phones.
            The right margin keeps the orbiting logos (about half a radius out) on screen. */}
        <HeroMark className="md:mr-14 lg:mr-20 xl:mr-8" />
      </Container>
    </section>
  );
}
