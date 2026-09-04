"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import Snap from "lenis/snap";

// ── Data model ───────────────────────────────────
interface SlideDef {
  id: string;
  title: string;
  text: string;
  imageW: number;
  imageH: number;
}

interface SectionDef {
  id: string;
  label: string;
  slides: SlideDef[];
}

const SECTIONS: SectionDef[] = [
  {
    id: "aa",
    label: "AA",
    slides: [
      { id: "aa-1", title: "Origins", text: "Every great project begins with a single question. What are we building, and why does it matter? The answer shapes everything that follows.", imageW: 600, imageH: 400 },
      { id: "aa-2", title: "Vision", text: "A clear vision cuts through complexity. It is the north star that keeps the team aligned when decisions get hard and trade-offs multiply.", imageW: 600, imageH: 450 },
      { id: "aa-3", title: "Scope", text: "Knowing what not to build is as important as knowing what to build. Scope discipline separates shipped products from endless prototypes.", imageW: 600, imageH: 350 },
      { id: "aa-4", title: "Foundation", text: "The first architecture decisions echo for years. Invest in clean interfaces, explicit boundaries, and a foundation that welcomes change.", imageW: 600, imageH: 500 },
    ],
  },
  {
    id: "bb",
    label: "BB",
    slides: [
      { id: "bb-1", title: "Prototype", text: "Build the smallest thing that proves the riskiest assumption. Speed of learning compounds. Throw it away when you are done.", imageW: 550, imageH: 420 },
      { id: "bb-2", title: "Iterate", text: "Rough edges are information, not failure. Each iteration sharpens the model of what the system needs to be. Measure, learn, adjust.", imageW: 600, imageH: 380 },
      { id: "bb-3", title: "Integrate", text: "Systems are not islands. The seams between components carry more complexity than the components themselves. Design the edges first.", imageW: 500, imageH: 450 },
      { id: "bb-4", title: "Harden", text: "Assertions, bounds, and invariants are not overhead. They are the safety net that lets you move fast without breaking things in production.", imageW: 580, imageH: 400 },
    ],
  },
  {
    id: "cc",
    label: "CC",
    slides: [
      { id: "cc-1", title: "Deploy", text: "Shipping is a feature. The ability to push changes confidently, roll back safely, and observe what happens is the real product.", imageW: 600, imageH: 430 },
      { id: "cc-2", title: "Observe", text: "Metrics, logs, and traces are not afterthoughts. Instrument from day one. You cannot improve what you cannot measure.", imageW: 550, imageH: 470 },
      { id: "cc-3", title: "Evolve", text: "The best systems are not the ones that are perfect on launch day. They are the ones that can adapt when the world changes around them.", imageW: 600, imageH: 390 },
    ],
  },
];

// ── Build a lookup: slide id → { sectionId, indexInSection } ──
function buildSectionMap(sections: SectionDef[]) {
  const map = new Map<string, { sectionId: string; index: number }>();
  sections.forEach((section) => {
    section.slides.forEach((slide, i) => {
      map.set(slide.id, { sectionId: section.id, index: i });
    });
  });
  return map;
}

// ── A single subsection (page-level slide) ───────
function SubSlide({
  slide,
  sectionLabel,
  index,
  totalInSection,
  isHighlighted,
}: {
  slide: SlideDef;
  sectionLabel: string;
  index: number;
  totalInSection: number;
  isHighlighted: boolean;
}) {
  return (
    <div data-sub={slide.id} className="slide subsection-slide">
      <div className="subsection-text">
        <span className="text-xs font-medium tracking-widest text-neutral-500 uppercase">
          {sectionLabel} / {index + 1}
        </span>
        <h2 className="text-3xl font-bold text-white max-md:text-2xl">{slide.title}</h2>
        <p className="text-neutral-400 text-lg leading-relaxed max-w-md max-md:text-base max-md:max-w-full">
          {slide.text}
        </p>
      </div>
      <div className="subsection-image">
        <img
          src={`https://placecats.com/${slide.imageW}/${slide.imageH}`}
          alt={`${slide.title} placeholder`}
          className="max-w-full max-h-[50vh] rounded-xl object-cover max-md:max-h-[32vh]"
        />
      </div>
      {/* Slider dots — left side, spans this section */}
      <div className="slide-dots">
        {Array.from({ length: totalInSection }, (_, i) => (
          <div
            key={i}
            className={`slide-dot ${i === index && isHighlighted ? "slide-dot--active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Transition slide ─────────────────────────────
function TransitionSlide({ label, count }: { label: string; count: number }) {
  return (
    <div className="slide transition-slide">
      <span className="transition-label">{label}</span>
      <span className="transition-sub">{count} ideas</span>
    </div>
  );
}

// ── Hero ─────────────────────────────────────────
function Hero() {
  return (
    <section className="slide hero">
      <h1 className="text-6xl font-bold text-white mb-6 tracking-tight">Takomo</h1>
      <p className="text-xl text-neutral-400 leading-relaxed max-w-xl">
        Native page scroll with snap. Each subsection locks into place. Keep
        scrolling and it flows through every slide.
      </p>
      <div className="mt-16 text-neutral-600 text-sm animate-bounce">Scroll down</div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────
export default function ScrollSection() {
  const [activeIndices, setActiveIndices] = useState<Record<string, number>>({});
  const sectionMapRef = useRef(buildSectionMap(SECTIONS));
  const snapRef = useRef<Snap | null>(null);

  // Set up Lenis snap once the Lenis instance is available
  useLenis((lenis) => {
    if (snapRef.current) return;

    // Wait one frame so the DOM elements exist
    requestAnimationFrame(() => {
      const els = document.querySelectorAll<HTMLElement>("[data-sub]");
      if (!els.length) return;

      const snap = new Snap(lenis, { type: "mandatory" });
      snap.addElements(Array.from(els), { align: "start" });
      snapRef.current = snap;
    });
  });

  // IntersectionObserver — track which subsection is centered → update dots
  useEffect(() => {
    const map = sectionMapRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-sub");
            const info = id ? map.get(id) : undefined;
            if (info) {
              setActiveIndices((prev) => ({ ...prev, [info.sectionId]: info.index }));
            }
          }
        });
      },
      { threshold: 0.55 }
    );

    document.querySelectorAll<HTMLElement>("[data-sub]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Hero />

      {SECTIONS.map((section) => (
        <div key={section.id}>
          <TransitionSlide label={section.label} count={section.slides.length} />
          {section.slides.map((slide, i) => (
            <SubSlide
              key={slide.id}
              slide={slide}
              sectionLabel={section.label}
              index={i}
              totalInSection={section.slides.length}
              isHighlighted={activeIndices[section.id] === i}
            />
          ))}
        </div>
      ))}

      <footer className="slide footer">
        <p>Takomo &mdash; Lenis scroll-snap layout</p>
      </footer>
    </>
  );
}
