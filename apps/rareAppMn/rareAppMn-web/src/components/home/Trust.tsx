import { Flag, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { DATA_UPDATED_AT, reportHref } from "@/lib/site";

/** Where the data comes from, that we're not an official site, and how to report a mistake. */
export function Trust() {
  return (
    <section aria-labelledby="trust-title" className="pb-16 md:pb-24">
      <Container>
        <div className="flex flex-col gap-5 rounded-3xl border border-border-ink bg-card p-5 md:flex-row md:items-center md:gap-8 md:p-8">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success-soft text-success">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 id="trust-title" className="font-sans text-lg font-bold tracking-normal text-ink">
              Мэдээллийг сургуулиудын албан ёсны сайт, элсэлтийн журмаас цуглуулав.
            </h2>
            <p className="mt-1 text-base text-ink-2">
              Сүүлд шинэчилсэн: <time dateTime={DATA_UPDATED_AT.replaceAll(".", "-")}>{DATA_UPDATED_AT}</time>
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-3">
              Oyutan MN нь их, дээд сургуулиудын албан ёсны сайт биш, бие даасан мэдээллийн
              платформ. Бүртгүүлэхээсээ өмнө сургуулийн сайтаас шалгаарай.
            </p>
          </div>
          <div className="shrink-0 md:text-right">
            <p className="text-[15px] text-ink-2">Мэдээлэл буруу байна уу?</p>
            <a
              href={reportHref()}
              className="mt-1 inline-flex min-h-11 items-center gap-2 font-bold text-accent-strong underline-offset-4 hover:underline"
            >
              <Flag className="h-4 w-4" aria-hidden="true" />
              Мэдэгдэх
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
