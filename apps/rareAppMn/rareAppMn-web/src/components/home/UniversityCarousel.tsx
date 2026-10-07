"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SchoolCard } from "@/components/schools/SchoolCard";
import type { School } from "@/lib/graphql/types";

export interface UniversityCarouselProps {
  schools: School[];
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
    <>
      <div className="flex items-center justify-end gap-2">
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

      <div
        ref={scrollRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="no-scrollbar mt-6 flex gap-5 overflow-x-auto pb-4 pt-2 scroll-smooth"
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
    </>
  );
}
