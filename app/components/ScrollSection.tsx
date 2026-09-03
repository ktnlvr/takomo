"use client";

import { useEffect, useRef, useState } from "react";

// ── Data model (composable) ──────────────────────
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
      {
        id: "aa-1",
        title: "Origins",
        text: "Every great project begins with a single question. What are we building, and why does it matter? The answer shapes everything that follows.",
        imageW: 600,
        imageH: 400,
      },
      {
        id: "aa-2",
        title: "Vision",
        text: "A clear vision cuts through complexity. It is the north star that keeps the team aligned when decisions get hard and trade-offs multiply.",
        imageW: 600,
        imageH: 450,
      },
      {
        id: "aa-3",
        title: "Scope",
        text: "Knowing what not to build is as important as knowing what to build. Scope discipline separates shipped products from endless prototypes.",
        imageW: 600,
        imageH: 350,
      },
      {
        id: "aa-4",
        title: "Foundation",
        text: "The first architecture decisions echo for years. Invest in clean interfaces, explicit boundaries, and a foundation that welcomes change.",
        imageW: 600,
        imageH: 500,
      },
    ],
  },
  {
    id: "bb",
    label: "BB",
    slides: [
      {
        id: "bb-1",
        title: "Prototype",
        text: "Build the smallest thing that proves the riskiest assumption. Speed of learning compounds. Throw it away when you are done.",
        imageW: 550,
        imageH: 420,
      },
      {
        id: "bb-2",
        title: "Iterate",
        text: "Rough edges are information, not failure. Each iteration sharpens the model of what the system needs to be. Measure, learn, adjust.",
        imageW: 600,
        imageH: 380,
      },
      {
        id: "bb-3",
        title: "Integrate",
        text: "Systems are not islands. The seams between components carry more complexity than the components themselves. Design the edges first.",
        imageW: 500,
        imageH: 450,
      },
      {
        id: "bb-4",
        title: "Harden",
        text: "Assertions, bounds, and invariants are not overhead. They are the safety net that lets you move fast without breaking things in production.",
        imageW: 580,
        imageH: 400,
      },
    ],
  },
  {
    id: "cc",
    label: "CC",
    slides: [
      {
        id: "cc-1",
        title: "Deploy",
        text: "Shipping is a feature. The ability to push changes confidently, roll back safely, and observe what happens is the real product.",
        imageW: 600,
        imageH: 430,
      },
      {
        id: "cc-2",
        title: "Observe",
        text: "Metrics, logs, and traces are not afterthoughts. Instrument from day one. You cannot improve what you cannot measure.",
        imageW: 550,
        imageH: 470,
      },
      {
        id: "cc-3",
        title: "Evolve",
        text: "The best systems are not the ones that are perfect on launch day. They are the ones that can adapt when the world changes around them.",
        imageW: 600,
        imageH: 390,
      },
    ],
  },
];

// ── A single scrollable subsection (text + image) ─
function SubSlide({
  slide,
  sectionLabel,
  index,
}: {
  slide: SlideDef;
  sectionLabel: string;
  index: number;
}) {
  return (
    <div data-sub={slide.id} className="subsection">
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
    </div>
  );
}

// ── A section: 100vh locked frame + isolated scroll ─
function SectionBlock({ section }: { section: SectionDef }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollElRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollElRef.current;
    if (!el) return;

    let scrollTimer: ReturnType<typeof setTimeout>;
    let isSnapping = false;

    const getSubEls = () =>
      Array.from(el.querySelectorAll<HTMLElement>("[data-sub]"));

    const getNearestIndex = () => {
      const containerRect = el.getBoundingClientRect();
      const mid = containerRect.top + containerRect.height / 2;
      const subEls = getSubEls();
      let best = 0;
      let bestDist = Infinity;
      subEls.forEach((subEl, i) => {
        const rect = subEl.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    };

    const updateSlider = () => {
      setActiveIndex(getNearestIndex());
    };

    const snapToNearest = () => {
      if (isSnapping) return;

      const subEls = getSubEls();
      if (!subEls.length) return;

      const best = getNearestIndex();
      const containerRect = el.getBoundingClientRect();
      const mid = containerRect.top + containerRect.height / 2;
      const bestRect = subEls[best].getBoundingClientRect();
      const bestCenter = bestRect.top + bestRect.height / 2;
      const error = Math.abs(bestCenter - mid);

      // Already snapped — nothing to do
      if (error < 2) return;

      // Snap into place
      isSnapping = true;
      setActiveIndex(best);
      el.scrollTo({ top: subEls[best].offsetTop, behavior: "smooth" });
      setTimeout(() => {
        isSnapping = false;
      }, 400);
    };

    const onScroll = () => {
      updateSlider();
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(snapToNearest, 120);
    };

    // Ensure we start snapped to the first subsection
    updateSlider();

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(scrollTimer);
    };
  }, []);

  return (
    <div className="section-frame">
      <div className="section-scroll" ref={scrollElRef}>
        {section.slides.map((slide, i) => (
          <SubSlide key={slide.id} slide={slide} sectionLabel={section.label} index={i} />
        ))}
      </div>

      <div className="subsection-slider">
        {section.slides.map((s, i) => (
          <div
            key={s.id}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex ? "bg-white scale-150" : "bg-neutral-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Full-page hero ───────────────────────────────
function Hero() {
  return (
    <section className="hero">
      <h1 className="text-6xl font-bold text-white mb-6 tracking-tight">Takomo</h1>
      <p className="text-xl text-neutral-400 leading-relaxed max-w-xl">
        Native page scroll with snap. Each section is an isolated scrollable
        area. Keep scrolling and it flows from slide to slide.
      </p>
      <div className="mt-16 text-neutral-600 text-sm animate-bounce">Scroll down</div>
    </section>
  );
}

// ── Transition slide (section intro) ─────────────
function TransitionSlide({ label, count }: { label: string; count: number }) {
  return (
    <div className="transition-slide">
      <span className="transition-label">{label}</span>
      <span className="transition-sub">{count} ideas</span>
    </div>
  );
}

// ── Page composition ─────────────────────────────
export default function ScrollSection() {
  return (
    <>
      <Hero />

      {SECTIONS.map((section) => (
        <div key={section.id}>
          <TransitionSlide label={section.label} count={section.slides.length} />
          <SectionBlock section={section} />
        </div>
      ))}

      <footer className="footer">
        <p>Takomo &mdash; native scroll-snap layout</p>
      </footer>
    </>
  );
}
