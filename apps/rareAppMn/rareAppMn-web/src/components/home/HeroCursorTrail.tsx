"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef } from "react";
import { UNIVERSITIES } from "@/lib/university-logos";

const LOGO_SIZE = 56;
const SPAWN_DISTANCE = 90;
const LIFETIME_MS = 1100;
const POOL_SIZE = 7;
const ROTATIONS = [-10, 6, -4, 12, -8, 5, -12, 8, -6, 3, -9];

/** Small, optimized versions of the logos (next/image URLs), so the trail never loads the 480px originals. */
const SOURCES = Object.values(UNIVERSITIES).map((university) => {
  const { props } = getImageProps({ src: university.image, alt: "", width: LOGO_SIZE, height: LOGO_SIZE });
  return { src: props.src, srcSet: props.srcSet ?? "" };
});

/**
 * School logos that follow the mouse, inside the hero only. Runs only with a
 * real mouse (hover + fine pointer) and without reduced motion; touch devices
 * get nothing, not even a listener. One pointermove listener on the hero,
 * throttled to one frame; logos are pooled, positioned and animated with
 * transform/opacity only, and everything is removed on unmount.
 */
export function HeroCursorTrail() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current?.parentElement) return;
    const layer: HTMLDivElement = ref.current;
    const hero: HTMLElement = ref.current.parentElement;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reducedMotion) return;

    const pool: { node: HTMLImageElement; animation: Animation | null }[] = [];
    let cursor = 0;
    let sequence = 0;
    let frame = 0;
    let pending: { x: number; y: number } | null = null;
    let last: { x: number; y: number } | null = null;
    let lastSpawn: { x: number; y: number } | null = null;

    // Images are created on the first movement, not on page load.
    function slot() {
      if (pool.length < POOL_SIZE) {
        const node = document.createElement("img");
        node.alt = "";
        node.decoding = "async";
        node.width = LOGO_SIZE;
        node.height = LOGO_SIZE;
        node.sizes = `${LOGO_SIZE}px`;
        node.style.cssText = `position:absolute;left:0;top:0;width:${LOGO_SIZE}px;height:${LOGO_SIZE}px;object-fit:contain;opacity:0;will-change:transform,opacity`;
        layer.appendChild(node);
        pool.push({ node, animation: null });
      }
      const item = pool[cursor];
      cursor = (cursor + 1) % POOL_SIZE;
      return item;
    }

    function spawn(x: number, y: number, dx: number, dy: number) {
      const item = slot();
      const source = SOURCES[sequence % SOURCES.length];
      const rotate = ROTATIONS[sequence % ROTATIONS.length];
      sequence += 1;
      item.animation?.cancel();
      item.node.srcset = source.srcSet;
      item.node.src = source.src;
      const at = (ox: number, oy: number, scale: number, turn: number) =>
        `translate3d(${x - LOGO_SIZE / 2 + ox}px, ${y - LOGO_SIZE / 2 + oy}px, 0) rotate(${turn}deg) scale(${scale})`;
      item.animation = item.node.animate(
        [
          { transform: at(0, 0, 0.6, rotate * 1.5), opacity: 0 },
          { transform: at(0, 0, 1, rotate), opacity: 0.85, offset: 0.15 },
          { transform: at(dx * 10, dy * 10, 1, rotate), opacity: 0.85, offset: 0.6 },
          { transform: at(dx * 22, dy * 22, 0.85, rotate * 0.8), opacity: 0 },
        ],
        { duration: LIFETIME_MS, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)", fill: "forwards" },
      );
    }

    function tick() {
      frame = 0;
      if (!pending) return;
      const point = pending;
      pending = null;
      if (!last || !lastSpawn) {
        last = point;
        lastSpawn = point;
        return;
      }
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      last = point;
      if (Math.hypot(point.x - lastSpawn.x, point.y - lastSpawn.y) >= SPAWN_DISTANCE) {
        const length = Math.hypot(dx, dy) || 1;
        spawn(point.x, point.y, dx / length, dy / length);
        lastSpawn = point;
      }
    }

    function onMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      const box = hero.getBoundingClientRect();
      pending = { x: event.clientX - box.left, y: event.clientY - box.top };
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function onLeave() {
      last = null;
      lastSpawn = null;
    }

    hero.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      for (const item of pool) {
        item.animation?.cancel();
        item.node.remove();
      }
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[-5] overflow-hidden" />;
}
