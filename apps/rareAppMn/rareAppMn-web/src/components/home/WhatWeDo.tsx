"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SectionLabel } from "./SectionLabel";

interface WhatWeDoItem {
  number: string;
  title: string;
  description: string;
}

const WHAT_WE_DO_ITEMS: WhatWeDoItem[] = [
  {
    number: "01",
    title: "Сургууль хайх",
    description:
      "Монголын их, дээд сургуулиудыг нэг дороос хайж, харьцуулах боломж.",
  },
  {
    number: "02",
    title: "Мэргэжил олох",
    description:
      "Сонирхож буй мэргэжлээрээ ямар сургуулиудад сурах боломжтойг харах.",
  },
  {
    number: "03",
    title: "ЭЕШ оноогоо ашиглах",
    description:
      "Өөрийн ЭЕШ оноонд тохирох сургууль, мэргэжлийн боломжоо олж харах.",
  },
  {
    number: "04",
    title: "Тэтгэлэг, элсэлт",
    description:
      "Сургалтын төлбөр, тэтгэлэг, элсэлтийн хугацаа зэрэг мэдээллийг нэг дороос авах.",
  },
];

export function WhatWeDo() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="what-we-do"
      className="border-t border-ink/10 bg-paper py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-12">
          {/* Left Column - Header */}
          <div className="lg:col-span-5">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
              className="lg:sticky lg:top-28"
            >
              <SectionLabel>01 — Бид юу хийдэг вэ?</SectionLabel>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
                Бид юу хийдэг вэ?
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/70 sm:text-base">
                Монголын их, дээд сургуулийн мэдээллийг нэг дор цуглуулж, сурагч
                бүрт ойлгомжтой, хайхад хялбар болгодог.
              </p>
            </motion.div>
          </div>

          {/* Right Column - Items List */}
          <div className="lg:col-span-7">
            <div className="space-y-2">
              {WHAT_WE_DO_ITEMS.map((item, i) => (
                <motion.div
                  key={item.number}
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.05,
                    ease: [0.215, 0.61, 0.355, 1],
                  }}
                  className="group rounded-xl border border-transparent transition-all duration-300 hover:border-ink/10 hover:bg-ink/[0.02]"
                >
                  <div className="flex items-start gap-4 p-4 sm:gap-6 sm:p-6">
                    {/* Number */}
                    <span className="mt-0.5 text-xs font-semibold tabular-nums text-ink/30 transition-colors duration-300 group-hover:text-accent sm:w-6 shrink-0">
                      {item.number}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0 transition-transform duration-300 sm:group-hover:translate-x-1">
                      <h3 className="text-base font-bold tracking-tight text-ink sm:text-lg">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-ink/60 sm:text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
