"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { SectionLabel } from "./SectionLabel";

const NOW_STEPS = [
  "Мэдээлэл олон газар тархсан",
  "Сургууль бүрийн website өөр",
  "Facebook, Telegram болон бусад эх сурвалжаас мэдээлэл хайна",
  "Төлбөр, мэргэжил, ЭЕШ, тэтгэлгийг тус тусад нь шалгана",
  "Сонголтоо хийхэд цаг их зарцуулна",
];

const OYUTAN_STEPS = [
  "Нэг хайлт",
  "Сургууль + мэргэжил + ЭЕШ",
  "Төлбөр + тэтгэлэг + элсэлт",
  "Харьцуулна",
  "Хэрэгтэй мэдээллээ нэг дороос авна",
];

// Small deterministic tilt/offset per row so the "now" column reads as
// scattered paper notes rather than a tidy list — kept subtle on purpose.
const NOW_TILT = [-1.6, 1.1, -2.1, 0.9, -1.3];
const NOW_SHIFT = [0, 10, -6, 12, -4];

export function WhatWeChange() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="what-we-change"
      className="border-t border-ink/10 bg-paper-deep/40"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-24 sm:px-8 sm:py-28 lg:py-32">
        <div className="max-w-2xl">
          <SectionLabel>02 — Бид юуг өөрчилж, хялбарчилж чадах вэ?</SectionLabel>
          <h2 className="mt-6 text-balance font-display text-3xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-4xl md:text-[2.75rem]">
            Сургууль сонгох үйл явцыг илүү энгийн болгоно.
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:text-base">
            Сургууль бүрийн мэдээллийг олон өөр эх сурвалжаас хайхын оронд
            хэрэгтэй мэдээллээ нэг дороос харах боломжийг бүрдүүлнэ.
          </p>
        </div>

        <div className="relative mt-16 grid gap-14 lg:mt-24 lg:grid-cols-2 lg:gap-0">
          <div className="lg:pr-16">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
              Одоо
            </span>
            <ul className="mt-7 flex flex-col items-start gap-4">
              {NOW_STEPS.map((step, i) => (
                <motion.li
                  key={step}
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, y: 16, rotate: 0 }
                  }
                  whileInView={{ opacity: 1, y: 0, rotate: NOW_TILT[i] }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.07,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{ marginLeft: NOW_SHIFT[i] }}
                  className="max-w-[16rem] rounded-sm border border-ink/15 bg-card px-4 py-3 text-[13px] leading-snug text-ink-soft sm:max-w-xs sm:text-sm"
                >
                  {step}
                </motion.li>
              ))}
            </ul>
          </div>

          <div
            className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-ink/10 lg:block"
            aria-hidden="true"
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ink/15 bg-paper"
            >
              <ArrowRight className="h-4 w-4 text-accent" strokeWidth={2} />
            </motion.div>
          </div>

          <div
            className="flex items-center gap-3 text-ink-soft lg:hidden"
            aria-hidden="true"
          >
            <span className="h-px flex-1 bg-ink/10" />
            <ArrowDown className="h-4 w-4 text-accent" strokeWidth={2} />
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <div className="lg:pl-16">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
              OYUТAN MN
            </span>
            <ul className="mt-7 border-l border-ink/15">
              {OYUTAN_STEPS.map((step, i) => (
                <motion.li
                  key={step}
                  initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    duration: 0.5,
                    delay: 0.15 + i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-center gap-3 py-3 pl-5 text-[15px] font-medium text-ink sm:text-base"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    aria-hidden="true"
                  />
                  {step}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 border-t border-ink/10 pt-10 lg:mt-28 lg:pt-14"
        >
          <p className="max-w-2xl text-balance font-display text-xl font-medium leading-snug tracking-tight text-ink sm:text-2xl md:text-[1.75rem]">
            <span className="text-ink-soft">
              Бид сурагчдын өмнөөс сонголт хийхгүй.
            </span>
            <br />
            Харин зөв мэдээллийг зөв газарт нь хүргэнэ.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
