"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  GraduationCap,
  Banknote,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { SectionLabel } from "./SectionLabel";
import { UNIVERSITIES } from "@/lib/university-logos";
import Link from "next/link";

interface UniversityCardData {
  id: string; // university-logos.ts доторх key (muis, shutis, sezis, ashuuis г.м)
  category: string;
  location: string;
  avgTuition: string;
  avgEESH: string;
  tags: string[];
}

// `university-logos.ts` дээрх ID-нуудтай яг тааруулсан дата
const TOP_UNIVERSITIES: UniversityCardData[] = [
  {
    id: "muis",
    category: "Улсын их сургууль",
    location: "Сүхбаатар дүүрэг, Улаанбаатар",
    avgTuition: "3.8 - 5.2 сая ₮",
    avgEESH: "580+",
    tags: ["Байгалийн ухаан", "ИТХ", "Хүмүүнлэг", "Бизнес"],
  },
  {
    id: "shutis",
    category: "Улсын их сургууль",
    location: "Сүхбаатар дүүрэг, Улаанбаатар",
    avgTuition: "3.5 - 4.8 сая ₮",
    avgEESH: "550+",
    tags: ["Инженерчлэл", "Мэдээллийн технологи", "Архитектур"],
  },
  {
    id: "ashuuis",
    category: "Улсын их сургууль",
    location: "Сүхбаатар дүүрэг, Улаанбаатар",
    avgTuition: "4.2 - 6.5 сая ₮",
    avgEESH: "620+",
    tags: ["Хүний эмч", "Нүүр ам", "Эм зүй", "Эрүүл мэнд"],
  },
  {
    id: "mubis",
    category: "Улсын их сургууль",
    location: "Сүхбаатар дүүрэг, Улаанбаатар",
    avgTuition: "3.2 - 4.2 сая ₮",
    avgEESH: "500+",
    tags: ["Боловсрол судлал", "Багш", "Сэтгэл судлал"],
  },
  {
    id: "haais",
    category: "Улсын их сургууль",
    location: "Хан-Уул дүүрэг, Улаанбаатар",
    avgTuition: "3.0 - 4.0 сая ₮",
    avgEESH: "480+",
    tags: ["Мал эмнэлэг", "Агрономи", "Инженерчлэл"],
  },
  {
    id: "sezis",
    category: "Хувийн их сургууль",
    location: "Баянзүрх дүүрэг, Улаанбаатар",
    avgTuition: "6.5 - 9.5 сая ₮",
    avgEESH: "600+",
    tags: ["Санхүү", "НББ", "Менежмент", "Маркетинг"],
  },
  {
    id: "ubhis",
    category: "Улсын их сургууль",
    location: "Баянзүрх дүүрэг, Улаанбаатар",
    avgTuition: "Төрийн сан / Үнэгүй",
    avgEESH: "520+",
    tags: ["Цэргийн хэрэг", "Инженер", "Сэтгэл зүй"],
  },
  {
    id: "suis",
    category: "Улсын их сургууль",
    location: "Сүхбаатар дүүрэг, Улаанбаатар",
    avgTuition: "3.8 - 5.0 сая ₮",
    avgEESH: "480+",
    tags: ["Жүжигчин", "Хөгжим", "Дизайн", "Радио ТВ"],
  },
  {
    id: "ikhzasag",
    category: "Хувийн их сургууль",
    location: "Баянзүрх дүүрэг, Улаанбаатар",
    avgTuition: "3.5 - 5.0 сая ₮",
    avgEESH: "480+",
    tags: ["Хууль зүй", "Аялал жуулчлал", "ИТХ"],
  },
  {
    id: "huree",
    category: "Хувийн дээд сургууль",
    location: "Хан-Уул дүүрэг, Улаанбаатар",
    avgTuition: "4.0 - 5.5 сая ₮",
    avgEESH: "500+",
    tags: ["IT / Програмчлал", "Сүлжээ", "Солонгос хэл"],
  },
];

export function UniversitySection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  // Автомат гүйлтийн тохиргоо (3 секунд тутамд 340px)
  useEffect(() => {
    if (reduceMotion || isHovered) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        // Төгсгөлд нь очсон бол эхнээс нь эхлүүлнэ
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollRef.current.scrollBy({ left: 340, behavior: "smooth" });
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [reduceMotion, isHovered]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 340;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      id="discovery"
      className="border-t border-ink/10 bg-paper py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <SectionLabel>Сургуулиуд — ТОП 10</SectionLabel>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
              Монголын тэргүүлэх их, дээд сургуулиуд
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/70 sm:text-base">
              Элсэлтийн ерөнхий шалгалтын босго оноо, сургалтын төлбөр болон
              онцлох чиглэлүүдийг харьцуулан хараарай.
            </p>
          </div>

          {/* Slider Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              aria-label="Өмнөх сургууль"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-paper transition-colors hover:border-ink hover:bg-ink/[0.04] active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 text-ink" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Дараагийн сургууль"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-paper transition-colors hover:border-ink hover:bg-ink/[0.04] active:scale-95"
            >
              <ArrowRight className="h-4 w-4 text-ink" />
            </button>
          </div>
        </div>

        {/* Scroll Container */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="no-scrollbar mt-10 flex gap-5 overflow-x-auto pb-4 pt-2 scroll-smooth"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {TOP_UNIVERSITIES.map((uni, index) => {
            // university-logos.ts файл дахь объекттой тааруулна
            const logoData = UNIVERSITIES[uni.id];

            // Хэрэв ID олдохгүй бол default нэр харуулна
            const shortName = logoData?.short || uni.id.toUpperCase();
            const fullName = logoData?.full || `${shortName} Их сургууль`;
            const imageSrc = logoData?.image;

            return (
              <motion.div
                key={uni.id}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.04,
                  ease: [0.215, 0.61, 0.355, 1],
                }}
                className="group relative flex w-[290px] shrink-0 flex-col justify-between rounded-2xl border border-ink/10 bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-ink/20 hover:shadow-md sm:w-[320px]"
                style={{ scrollSnapAlign: "start" }}
              >
                {" "}
                <Link href={`/university/${uni.id}`}>
                  <div>
                    {/* Category & Logo */}
                    <div className="flex items-start justify-between gap-4">
                      <span className="rounded-full bg-ink/5 px-3 py-1 text-[11px] font-semibold text-ink/70">
                        {uni.category}
                      </span>

                      {imageSrc ? (
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-paper p-1.5 border border-ink/10 shadow-2xs">
                          <Image
                            src={imageSrc}
                            alt={`${shortName} лого`}
                            fill
                            sizes="44px"
                            className="object-contain p-0.5"
                          />
                        </div>
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink/5 text-xs font-bold text-ink/60">
                          {shortName.slice(0, 3)}
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="mt-5">
                      <h3 className="text-xl font-bold tracking-tight text-ink group-hover:text-accent transition-colors">
                        {shortName}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-xs font-medium text-ink/60">
                        {fullName}
                      </p>
                    </div>

                    {/* Info */}
                    <div className="mt-6 space-y-2.5 border-t border-ink/10 pt-4 text-xs text-ink/80">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-ink/40" />
                        <span className="truncate">{uni.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Banknote className="h-3.5 w-3.5 shrink-0 text-ink/40" />
                        <span>
                          Төлбөр:{" "}
                          <strong className="text-ink font-semibold">
                            {uni.avgTuition}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0 text-ink/40" />
                        <span>
                          ЭЕШ босго:{" "}
                          <strong className="text-ink font-semibold">
                            {uni.avgEESH}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {uni.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-ink/10 bg-paper/60 px-2 py-0.5 text-[10px] font-medium text-ink/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Link */}
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-ink hover:text-accent transition-colors">
                    Дэлгэрэнгүй харах
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
