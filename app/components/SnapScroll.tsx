"use client";

import { useRef } from "react";
import { useLenis } from "lenis/react";
import Snap from "lenis/snap";

/** Snap every top-level section into place, tigerstyle. */
export default function SnapScroll() {
  const snapRef = useRef<Snap | null>(null);

  useLenis((lenis) => {
    if (snapRef.current) return;
    requestAnimationFrame(() => {
      const els = document.querySelectorAll<HTMLElement>(
        "main > section, main > footer"
      );
      if (!els.length) return;
      const snap = new Snap(lenis, { type: "proximity" });
      snap.addElements(Array.from(els), { align: "start" });
      snapRef.current = snap;
    });
  });

  return null;
}
