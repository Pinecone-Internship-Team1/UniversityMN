"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SectionLabel } from "./SectionLabel";

interface TeamMember {
  number: string;
  name: string;
  school: string;
  role: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    number: "01",
    name: "Zelme",
    school: "Шинэ Монгол Харүмафүжи сургууль",
    role: "Founder & Full-Stack Developer",
  },
  {
    number: "02",
    name: "Erkhes",
    school: "Монгол-Оросын хамтарсан сургууль",
    role: "UI/UX Designer",
  },
  {
    number: "03",
    name: "Khuslen",
    school: "1-р сургууль",
    role: "Research & Data",
  },
  {
    number: "04",
    name: "Tsogt",
    school: "Шинэ Үе сургууль",
    role: "Content & Communications",
  },
  {
    number: "05",
    name: "Ikhbayr",
    school: "Орчлон сургууль",
    role: "Frontend Developer",
  },
];

function initialsOf(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TeamSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="team" className="border-t border-ink/10 bg-paper">
      <div className="mx-auto max-w-[1440px] px-6 py-24 sm:px-8 sm:py-28 lg:py-32">
        <div className="max-w-2xl">
          <SectionLabel>03 — Манай баг</SectionLabel>
          <h2 className="mt-6 text-balance font-display text-3xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-4xl md:text-[2.75rem]">
            Энэ төслийг бүтээж буй сурагчид.
          </h2>
        </div>

        <ul className="mt-14 border-t border-ink/10 lg:mt-16">
          {TEAM_MEMBERS.map((member, i) => (
            <motion.li
              key={member.number}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group border-b border-ink/10"
            >
              <div className="flex flex-col gap-4 py-6 transition-colors duration-300 group-hover:bg-paper-deep/40 sm:-mx-4 sm:flex-row sm:items-center sm:gap-6 sm:px-4 sm:py-7">
                <span className="font-display text-sm font-semibold tabular-nums text-ink/30 transition-colors duration-300 group-hover:text-accent sm:w-8 sm:shrink-0">
                  {member.number}
                </span>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-card font-display text-xs font-semibold text-ink-soft transition-colors duration-300 group-hover:border-accent/40 group-hover:text-accent">
                  {initialsOf(member.name)}
                </div>

                <div className="flex-1 transition-transform duration-300 sm:group-hover:translate-x-1.5">
                  <h3 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-[13px] text-ink-soft sm:text-sm">
                    {member.school}
                  </p>
                </div>

                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-soft transition-colors duration-300 group-hover:text-accent sm:text-[13px] sm:text-right">
                  {member.role}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
