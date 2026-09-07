"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Word-by-word reveal, tigerstyle hero-quote style. */
export function TextReveal({
  text,
  accentFrom,
  className,
}: {
  text: string;
  accentFrom?: number; // word index after which words are accented
  className?: string;
}) {
  const words = text.split(" ");
  return (
    <motion.p
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
      transition={{ staggerChildren: 0.045 }}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          className={accentFrom !== undefined && i >= accentFrom ? "accent" : undefined}
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { duration: 0.3 } },
          }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.p>
  );
}

/** Counts up when scrolled into view. */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  return (
    <motion.span
      className="stat-value"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      onViewportEnter={(entry) => {
        const el = entry?.target as HTMLElement | null;
        if (!el) return;
        const start = performance.now();
        const dur = 1400;
        const step = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = `${Math.round(value * eased).toLocaleString("en")}${suffix}`;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }}
    >
      0{suffix}
    </motion.span>
  );
}
