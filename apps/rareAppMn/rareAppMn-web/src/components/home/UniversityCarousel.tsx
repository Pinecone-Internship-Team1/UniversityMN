"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SchoolCard } from "@/components/schools/SchoolCard";
import type { School } from "@/lib/graphql/types";

const TRACK_ID = "university-carousel";
const SCROLL_STEP = 340;

export interface UniversityCarouselProps {
  schools: School[];
}

function scrollTrack(track: HTMLElement | null, direction: -1 | 1) {
  track?.scrollBy({ left: direction * SCROLL_STEP, behavior: "smooth" });
}

/**
 * Prev/next buttons for the carousel. They sit in the section header next to
 * "Бүгдийг харах" (one row), so they reach the track by its id.
 */
export function UniversityCarouselArrows() {
  const buttonClassName =
    "flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-paper transition-colors hover:border-ink hover:bg-ink/[0.04] active:scale-95";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => scrollTrack(document.getElementById(TRACK_ID), -1)}
        aria-label="Өмнөх сургууль"
        aria-controls={TRACK_ID}
        className={buttonClassName}
      >
        <ArrowLeft className="h-4 w-4 text-ink" />
      </button>
      <button
        type="button"
        onClick={() => scrollTrack(document.getElementById(TRACK_ID), 1)}
        aria-label="Дараагийн сургууль"
        aria-controls={TRACK_ID}
        className={buttonClassName}
      >
        <ArrowRight className="h-4 w-4 text-ink" />
      </button>
    </div>
  );
}

export function UniversityCarousel({ schools }: UniversityCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (reduceMotion || isHovered) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollTrack(scrollRef.current, 1);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [reduceMotion, isHovered]);

  return (
    <div
      id={TRACK_ID}
      ref={scrollRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="no-scrollbar mt-8 flex gap-5 overflow-x-auto pb-4 pt-2 scroll-smooth"
      style={{ scrollSnapType: "x mandatory" }}
    >
      {schools.map((school, index) => (
        <motion.div
          key={school.id}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{
            duration: 0.4,
            delay: index * 0.04,
            ease: [0.215, 0.61, 0.355, 1],
          }}
          style={{ scrollSnapAlign: "start" }}
        >
          <SchoolCard school={school} />
        </motion.div>
      ))}
    </div>
  );
}
