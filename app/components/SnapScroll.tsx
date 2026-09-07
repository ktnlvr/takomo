"use client";

import { useRef } from "react";
import { useLenis } from "lenis/react";
import Snap from "lenis/snap";

/**
 * Mandatory snapping: scrolling always comes to rest on a registered stop —
 * a section start, a chapter item (centered), or a floor-plan tour segment —
 * so no in-between state can stick. Elements mounted late (dynamic imports)
 * are picked up by polling until everything is registered.
 */
export default function SnapScroll() {
  const snapRef = useRef<Snap | null>(null);

  useLenis((lenis) => {
    if (snapRef.current) return;
    // touch scrolling keeps native momentum; forcing mandatory snap there
    // makes flicks land somewhere far and feel uncontrolled, so touch gets
    // proximity alignment instead while desktop keeps the hard lock-in
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const snap = new Snap(lenis, {
      type: touch ? "proximity" : "mandatory",
      duration: 0.38,
      debounce: 120,
      easing: (t) => 1 - Math.pow(2, -10 * t), // hard expo-out: locks in fast
    });
    snapRef.current = snap;

    const seen = new Set<Element>();
    const register = () => {
      document
        .querySelectorAll<HTMLElement>("main > section, main > footer")
        .forEach((el) => {
          if (seen.has(el)) return;
          seen.add(el);
          // sections taller than the viewport also anchor at their end,
          // otherwise mandatory snapping makes their bottom unreachable
          const tall = el.offsetHeight > window.innerHeight * 1.05;
          snap.addElement(el, { align: tall ? ["start", "end"] : "start" });
        });
      document.querySelectorAll<HTMLElement>("[data-chapter-item]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        snap.addElement(el, { align: "center" });
      });
      document.querySelectorAll<HTMLElement>("[data-tour-point]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        snap.addElement(el, { align: "start" });
      });
    };

    register();
    let tries = 0;
    const timer = setInterval(() => {
      register();
      if (++tries >= 10) clearInterval(timer);
    }, 500);
  });

  return null;
}
