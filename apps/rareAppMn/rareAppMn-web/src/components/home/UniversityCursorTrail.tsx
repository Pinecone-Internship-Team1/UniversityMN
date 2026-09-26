"use client";

import { useEffect, useRef } from "react";
import type { University } from "@/lib/university-logos";

interface UniversityCursorTrailProps {
  universities: University[];
  spawnDistance?: number;
  logoLifetime?: number;
  maxActiveLogos?: number;
  size?: number;
  offsetRange?: number;
  rotationRange?: number;
  fadeDuration?: number;
  className?: string;
}

const ROTATION_STEPS = [-10, 6, -4, 12, -8, 5, -12, 8, -6, 3, -9];
const OFFSET_STEPS: ReadonlyArray<readonly [number, number]> = [
  [-0.5, 0.3],
  [0.4, -0.4],
  [-0.3, -0.5],
  [0.5, 0.2],
  [-0.4, 0.4],
  [0.2, -0.5],
  [-0.5, 0.1],
  [0.3, 0.3],
  [-0.2, -0.3],
  [0.5, -0.1],
  [-0.3, 0.5],
];
const IDLE_RESET_MS = 220;

export function UniversityCursorTrail({
  universities,
  spawnDistance = 80,
  logoLifetime = 1200,
  maxActiveLogos = 8,
  size = 84,
  offsetRange = 40,
  rotationRange = 12,
  fadeDuration = 400,
  className,
}: UniversityCursorTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || universities.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const pool: {
      root: HTMLDivElement;
      img: HTMLImageElement;
      anim: Animation | null;
    }[] = [];

    for (let i = 0; i < maxActiveLogos; i++) {
      const root = document.createElement("div");
      root.className =
        "pointer-events-none absolute left-0 top-0 flex items-center justify-center";
      root.style.width = `${size}px`;
      root.style.height = `${size}px`;
      root.style.opacity = "0";
      root.style.willChange = "transform, opacity";

      const inner = document.createElement("div");
      inner.style.position = "relative";
      inner.style.width = "85%";
      inner.style.height = "85%";

      const img = document.createElement("img");
      img.alt = "";
      img.decoding = "async";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";

      inner.appendChild(img);
      root.appendChild(inner);
      container.appendChild(root);
      pool.push({ root, img, anim: null });
    }

    let poolCursor = 0;
    let seqIndex = 0;
    let stepIndex = 0;
    let hasLast = false;
    let lastX = 0;
    let lastY = 0;
    let lastSpawnX = 0;
    let lastSpawnY = 0;
    let lastMoveAt = 0;

    const getBounds = () => container.getBoundingClientRect();

    function spawnAt(
      clientX: number,
      clientY: number,
      dirX: number,
      dirY: number,
    ) {
      const rect = getBounds();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const margin = size * 1.5;
      if (
        localX < -margin ||
        localX > rect.width + margin ||
        localY < -margin ||
        localY > rect.height + margin
      ) {
        return;
      }

      const university = universities[seqIndex % universities.length];
      const step = stepIndex % ROTATION_STEPS.length;
      seqIndex++;
      stepIndex++;

      const rotate = (ROTATION_STEPS[step] / 12) * rotationRange;
      const [ofx, ofy] = OFFSET_STEPS[step];
      const offsetX = ofx * offsetRange;
      const offsetY = ofy * offsetRange;

      const slot = pool[poolCursor];
      poolCursor = (poolCursor + 1) % pool.length;
      slot.anim?.cancel();

      slot.img.src = university.image;

      const x = localX - size / 2 + offsetX;
      const y = localY - size / 2 + offsetY;
      slot.root.style.left = `${x}px`;
      slot.root.style.top = `${y}px`;

      const driftX = dirX * 20;
      const driftY = dirY * 20;
      const holdOffset = Math.max(
        0,
        Math.min(0.7, 1 - fadeDuration / logoLifetime),
      );

      slot.anim = slot.root.animate(
        [
          {
            transform: `rotate(${rotate * 1.5}deg) scale(0.6)`,
            opacity: 0,
            offset: 0,
          },
          {
            transform: `rotate(${rotate}deg) scale(1)`,
            opacity: 0.9,
            offset: 0.15,
          },
          {
            transform: `translate3d(${driftX * 0.5}px, ${driftY * 0.5}px, 0) rotate(${rotate}deg) scale(1)`,
            opacity: 0.9,
            offset: holdOffset,
          },
          {
            transform: `translate3d(${driftX}px, ${driftY}px, 0) rotate(${rotate * 0.8}deg) scale(0.88)`,
            opacity: 0,
            offset: 1,
          },
        ],
        {
          duration: logoLifetime,
          easing: "cubic-bezier(0.215, 0.61, 0.355, 1)",
          fill: "forwards",
        },
      );
    }

    function handleMove(clientX: number, clientY: number) {
      lastMoveAt = performance.now();

      if (!hasLast) {
        lastX = clientX;
        lastY = clientY;
        lastSpawnX = clientX;
        lastSpawnY = clientY;
        hasLast = true;
        return;
      }

      const dx = clientX - lastX;
      const dy = clientY - lastY;
      lastX = clientX;
      lastY = clientY;

      const travelled = Math.hypot(clientX - lastSpawnX, clientY - lastSpawnY);
      if (travelled >= spawnDistance) {
        const len = Math.hypot(dx, dy) || 1;
        spawnAt(clientX, clientY, dx / len, dy / len);
        lastSpawnX = clientX;
        lastSpawnY = clientY;
      }
    }

    function onMouseMove(e: MouseEvent) {
      handleMove(e.clientX, e.clientY);
    }

    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touch) return;
      handleMove(touch.clientX, touch.clientY);
    }

    let idleCheck = 0;
    function scheduleIdleCheck() {
      idleCheck = window.setInterval(() => {
        if (hasLast && performance.now() - lastMoveAt > IDLE_RESET_MS) {
          hasLast = false;
        }
      }, IDLE_RESET_MS);
    }
    scheduleIdleCheck();

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      window.clearInterval(idleCheck);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      for (const slot of pool) {
        slot.anim?.cancel();
        slot.root.remove();
      }
    };
  }, [
    universities,
    spawnDistance,
    logoLifetime,
    maxActiveLogos,
    size,
    offsetRange,
    rotationRange,
    fadeDuration,
  ]);

  return (
    <div
      ref={containerRef}
      className={
        className ??
        "pointer-events-none absolute inset-0 z-[6] overflow-hidden"
      }
      aria-hidden="true"
    />
  );
}
