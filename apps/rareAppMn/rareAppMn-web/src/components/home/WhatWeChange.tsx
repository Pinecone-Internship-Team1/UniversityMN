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

// Small deterministic tilt/offset per row
const NOW_TILT = [-1.2, 0.8, -1.5, 0.6, -1];
const NOW_SHIFT = [0, 8, -4, 10, -2];

export function WhatWeChange() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="what-we-change"
      className="border-t border-ink/10 bg-paper py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-8">
        {/* Header Section */}
        <div className="max-w-2xl">
          <SectionLabel>
            02 — Бид юуг өөрчилж, хялбарчилж чадах вэ?
          </SectionLabel>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
            Сургууль сонгох үйл явцыг илүү энгийн болгоно.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/70 sm:text-base">
            Сургууль бүрийн мэдээллийг олон өөр эх сурвалжаас хайхын оронд
            хэрэгтэй мэдээллээ нэг дороос харах боломжийг бүрдүүлнэ.
          </p>
        </div>

        {/* Comparison Layout */}
        <div className="relative mt-14 grid gap-10 lg:mt-20 lg:grid-cols-2 lg:gap-0">
          {/* NOW (Before) Column */}
          <div className="lg:pr-12">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50">
              Одоо
            </span>
            <ul className="mt-6 flex flex-col items-start gap-3">
              {NOW_STEPS.map((step, i) => (
                <motion.li
                  key={step}
                  initial={
                    reduceMotion ? false : { opacity: 0, y: 12, rotate: 0 }
                  }
                  whileInView={{ opacity: 1, y: 0, rotate: NOW_TILT[i] }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{
                    duration: 0.45,
                    delay: i * 0.05,
                    ease: [0.215, 0.61, 0.355, 1],
                  }}
                  style={{ marginLeft: NOW_SHIFT[i] }}
                  className="max-w-xs rounded-lg border border-ink/10 bg-card px-4 py-3 text-xs font-medium leading-relaxed text-ink/70 shadow-xs sm:max-w-sm sm:text-sm"
                >
                  {step}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Center Divider & Icon for Desktop */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-ink/10 lg:block"
            aria-hidden="true"
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-paper shadow-xs"
            >
              <ArrowRight className="h-4 w-4 text-accent" strokeWidth={2.2} />
            </motion.div>
          </div>

          {/* Center Icon for Mobile */}
          <div
            className="flex items-center gap-3 text-ink/40 lg:hidden"
            aria-hidden="true"
          >
            <span className="h-px flex-1 bg-ink/10" />
            <ArrowDown className="h-4 w-4 text-accent" strokeWidth={2.2} />
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          {/* OYUTAN MN (After) Column */}
          <div className="lg:pl-12">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
              OYUTAN MN
            </span>
            <ul className="mt-6 border-l border-ink/10 space-y-1">
              {OYUTAN_STEPS.map((step, i) => (
                <motion.li
                  key={step}
                  initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{
                    duration: 0.45,
                    delay: 0.1 + i * 0.05,
                    ease: [0.215, 0.61, 0.355, 1],
                  }}
                  className="flex items-center gap-3 py-2.5 pl-5 text-sm font-semibold text-ink sm:text-base"
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

        {/* Bottom Closing Quote */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
          className="mt-16 border-t border-ink/10 pt-8 sm:mt-20 sm:pt-10"
        >
          <p className="max-w-2xl text-balance text-lg font-bold leading-snug tracking-tight text-ink sm:text-xl md:text-2xl">
            <span className="text-ink/60 font-medium">
              Бид сурагчдын өмнөөс сонголт хийхгүй.
            </span>{" "}
            Харин зөв мэдээллийг зөв газарт нь хүргэнэ.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
