"use client";

import dynamic from "next/dynamic";
import { motion } from "motion/react";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

export default function Hero() {
  return (
    <section className="slide hero glow">
      <HeroCanvas />
      <div className="hero-content">
        <motion.p
          className="kicker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          A forge for hardware at Aalto · 2026
        </motion.p>
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          TAKOMO
        </motion.h1>
        <motion.p
          className="hero-tag"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 1 }}
        >
          From atoms to impact. A makerspace for hardware development.
        </motion.p>
      </div>
      <motion.div
        className="scroll-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1.2 }}
      >
        <div className="scroll-hint-circle">
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
            <path d="M7 1v14M1.5 10L7 15.5 12.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p>Scroll to forge</p>
      </motion.div>
    </section>
  );
}
