"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { University, LogoPlacement } from "@/lib/university-logos";

function seedFrom(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h % 1000) / 1000;
}

interface FloatingUniversityLogoProps {
  university: University;
  placement: LogoPlacement;
  size: number;
}

export function FloatingUniversityLogo({
  university,
  placement,
  size,
}: FloatingUniversityLogoProps) {
  const reduceMotion = useReducedMotion();
  const seed = seedFrom(university.id);
  const floatDuration = 6 + seed * 3;
  const floatDelay = seed * 2;
  const floatAmplitude = 2 + seed * 2;

  return (
    <motion.div
      style={{
        position: "absolute",
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: size,
        height: size,
        zIndex: 10 + placement.order,
      }}
      initial={
        reduceMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              scale: 0.85,
              rotate: placement.rotate * 1.5,
              x: "-50%",
              y: "calc(-50% + 20px)",
            }
      }
      animate={
        reduceMotion
          ? { opacity: 1 }
          : {
              opacity: 1,
              scale: 1,
              rotate: placement.rotate,
              x: "-50%",
              y: "-50%",
            }
      }
      transition={{
        duration: 0.6,
        delay: 0.08 + placement.order * 0.04,
        ease: [0.215, 0.61, 0.355, 1],
      }}
    >
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : { y: [0, -floatAmplitude, 0, floatAmplitude * 0.5, 0] }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: floatDuration,
                delay: floatDelay,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <div className="relative h-[85%] w-[85%] drop-shadow-[0_8px_12px_rgba(0,0,0,0.08)]">
          <Image
            src={university.image}
            alt={`${university.full} эмблем`}
            fill
            sizes={`${size}px`}
            className="object-contain"
            priority={placement.order < 4}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
