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
    <section id="what-we-do" className="border-t border-ink/10 bg-paper">
      <div className="mx-auto max-w-[1440px] px-6 py-24 sm:px-8 sm:py-28 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:sticky lg:top-28"
            >
              <SectionLabel>01 — Бид юу хийдэг вэ?</SectionLabel>
              <h2 className="mt-6 text-balance font-display text-3xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-4xl md:text-[2.75rem]">
                Бид юу хийдэг вэ?
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft sm:text-base">
                Монголын их, дээд сургуулийн мэдээллийг нэг дор цуглуулж,
                сурагч бүрт ойлгомжтой, хайхад хялбар болгодог.
              </p>
            </motion.div>
          </div>

          <div className="lg:col-span-7">
            <ul className="border-t border-ink/10">
              {WHAT_WE_DO_ITEMS.map((item, i) => (
                <motion.li
                  key={item.number}
                  initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 0.55,
                    delay: i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="group border-b border-ink/10"
                >
                  <div className="flex items-baseline gap-5 py-7 transition-colors duration-300 group-hover:bg-paper-deep/40 sm:-mx-4 sm:gap-8 sm:px-4 sm:py-8">
                    <span className="font-display text-sm font-semibold tabular-nums text-ink/30 transition-colors duration-300 group-hover:text-accent">
                      {item.number}
                    </span>
                    <div className="flex-1 transition-transform duration-300 group-hover:translate-x-1.5">
                      <h3 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                        {item.title}
                      </h3>
                      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
