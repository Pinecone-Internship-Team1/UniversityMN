"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { SectionLabel } from "./SectionLabel";
import Link from "next/link";

interface TeamMember {
  number: string;
  name: string;
  school: string;
  role: string;
  image?: string;
  github?: string;
  linkedin?: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    number: "01",
    name: "Erkhes",
    school: "130-р сургууль",
    role: "Co-Founder & Full-Stack Developer",
    image: "/team/erkhes-profile-pic.jpg",
    github: "https://github.com/erkhes9632",
  },
  {
    number: "02",
    name: "Zelme",
    school: "Орос 3-р сургууль",
    role: "Co-Founder & Full-Stack Developer",
    image: "/team/zelme.jpg",
    github: "https://github.com/zetsu19",
  },
  {
    number: "03",
    name: "Khuslen",
    school: "52-р сургууль",
    role: "Full-Stack Developer",
    image: "/team/khuslen.jpg",
    github: "https://github.com",
  },
  {
    number: "04",
    name: "Ikhbayar",
    school: "ISU",
    role: "Research & Data, Frontend Developer",
    image: "/team/ikhbayar.jpg",
    github: "https://github.com/bikhbayar01-sudo",
  },
  {
    number: "05",
    name: "Tsogt",
    school: "Шинэ Монгол ТК",
    role: "Research & Data, Frontend Developer",
    image: "/team/tsogt.jpg",
    github: "https://github.com",
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
    <section
      id="team"
      className="relative overflow-hidden border-t border-ink/10 bg-paper py-24 sm:py-32"
    >
      {/* Dynamic Ambient Background Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-b from-accent/15 via-accent/5 to-transparent blur-3xl opacity-70" />

      <div className="relative mx-auto max-w-[1440px] px-6 sm:px-8">
        {/* Header Section */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <SectionLabel>03 — Манай баг</SectionLabel>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl md:text-5xl">
              Ирээдүйг бүтээж буй сурагчид.
            </h2>
            <p className="mt-3 text-base text-ink/70">
              Монголын боловсролын салбарт шинэчлэл хийхээр хамтран ажиллаж буй
              сурагчдын бүрэлдэхүүн.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-card/80 backdrop-blur-md px-4 py-2 text-xs font-mono font-bold tracking-wider text-ink/70 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>TOTAL MEMBERS: {TEAM_MEMBERS.length}</span>
          </div>
        </div>

        {/* Team Cards Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {TEAM_MEMBERS.map((member, i) => (
            <motion.div
              key={member.number}
              initial={reduceMotion ? false : { opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.215, 0.61, 0.355, 1],
              }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-ink/10 bg-card/80 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/10"
            >
              {/* Top Accent Line on Hover */}
              <div className="absolute inset-x-0 top-0 z-20 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* TOP: Image Banner Section */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-paper/60">
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-mono text-4xl font-bold text-ink/20">
                    {initialsOf(member.name)}
                  </div>
                )}

                {/* Dark Gradient Overlay for Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5 opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

                {/* Number Badge */}
                <span className="absolute top-3.5 left-3.5 z-10 rounded-full bg-black/40 backdrop-blur-md border border-white/15 px-3 py-1 font-mono text-[11px] font-bold text-white shadow-xs">
                  {member.number}
                </span>

                {/* School Tag on Image */}
                <div className="absolute top-3.5 right-3.5 z-10 max-w-[65%]">
                  <span className="inline-block truncate rounded-full bg-white/950 backdrop-blur-lg border border-white/50 px-3 py-1 text-[12px] font-medium text-white shadow-xs">
                    {member.school}
                  </span>
                </div>

                {/* Name & Role Overlay */}
                <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
                  <h3 className="text-xl font-bold tracking-tight drop-shadow-md transition-transform duration-300 group-hover:translate-x-0.5">
                    {member.name}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-white/80 line-clamp-1">
                    {member.role}
                  </p>
                </div>
              </div>

              {/* BOTTOM: Social Links Only */}
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between border-t border-ink/10 pt-3">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-ink/40 uppercase">
                    Connect
                  </span>
                  <div className="flex items-center gap-1.5">
                    {member.github && (
                      <Link
                        href={member.github}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full p-2 text-ink/60 transition-all duration-300 hover:bg-accent/10 hover:text-accent hover:scale-110"
                      >
                        <FaGithub className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
