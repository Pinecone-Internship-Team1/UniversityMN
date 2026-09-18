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
  const floatDuration = 5.5 + seed * 3.5;
  const floatDelay = seed * 2;
  const floatAmplitude = 2 + seed * 2.5;

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
              scale: 0.82,
              rotate: placement.rotate * 2.2,
              x: "-50%",
              y: "calc(-50% + 26px)",
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
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : { y: [0, -floatAmplitude, 0, floatAmplitude * 0.6, 0] }
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
        <div className="relative h-[88%] w-[88%] drop-shadow-[0_10px_16px_rgba(20,18,14,0.22)]">
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
