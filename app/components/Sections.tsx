"use client";

import dynamic from "next/dynamic";
import { Reveal, CountUp } from "./Reveal";

const BuildingCanvas = dynamic(() => import("./BuildingCanvas"), { ssr: false });
const SierpinskiCanvas = dynamic(() => import("./SierpinskiCanvas"), { ssr: false });

function Kicker({ children }: { children: React.ReactNode }) {
  return <span className="kicker">{children}</span>;
}

/* ── Wordmark divider ──────────────────────────── */
export function WordmarkSlide() {
  return (
    <section className="slide glow" style={{ alignItems: "center", textAlign: "center" }}>
      <Reveal>
        <h2
          className="chrome-text"
          style={{
            fontSize: "clamp(3rem, 10vw, 7.5rem)",
            fontWeight: 900,
            letterSpacing: "0.03em",
            margin: "0 0 10px",
            filter: "drop-shadow(0 0 26px rgba(198,42,85,0.25))",
          }}
        >
          TAKOMO
        </h2>
      </Reveal>
      <Reveal delay={0.15}>
        <p style={{ color: "#fff", fontSize: "clamp(1.2rem, 2.4vw, 1.8rem)", fontWeight: 700 }}>
          Aalto Hardware Consortium
        </p>
      </Reveal>
      <Reveal delay={0.3}>
        <p className="sub" style={{ marginTop: 14 }}>
          The forge for building hardware.
        </p>
      </Reveal>
    </section>
  );
}

/* ── Traction ──────────────────────────────────── */
export function TractionSlide() {
  const stats = [
    { v: 250, s: "+", l: "events over the course of the year" },
    { v: 2000, s: "+", l: "event attendees" },
    { v: 1000, s: "", l: "community members, and growing" },
    { v: 50, s: "+", l: "systems in the hardware library" },
    { v: 20, s: "+", l: "projects supported" },
    { v: 10, s: "+", l: "industry partners" },
    { v: 15, s: "", l: "international collaborations (5 running, 10 inbound)" },
    { v: 10, s: "", l: "research collaborations" },
  ];
  return (
    <section className="slide">
      <Reveal>
        <Kicker>As a collective</Kicker>
        <h2 className="headline">We didn&apos;t wait for permission. We&apos;re already running.</h2>
      </Reveal>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
        }}
      >
        {stats.map((st, i) => (
          <Reveal key={st.l} delay={0.06 * i}>
            <div className="card">
              <CountUp value={st.v} suffix={st.s} />
              <div className="stat-label">{st.l}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── A day in the life ─────────────────────────── */
export function DaySlide() {
  const rows = [
    {
      when: "Morning",
      what: "Researchers run a ROS workshop; a founder team creates components on one of the 3D printers; the hardware library checks out a Jetson and an FPGA board.",
    },
    {
      when: "Midday",
      what: "An industry partner drops in with a real-world problem; two members spin up a project around it over lunch.",
    },
    {
      when: "Afternoon",
      what: "The satellite team runs a vibration test; a robotics squad iterates on a rover; a solo builder debugs a board beside a PhD who's done it before.",
    },
    {
      when: "Evening",
      what: "A build session, a talk, a demo night; someone decides to turn their prototype into a company.",
    },
  ];
  return (
    <section className="slide">
      <Reveal>
        <Kicker>On the floor</Kicker>
        <h2 className="headline">What a day in the life looks like.</h2>
      </Reveal>
      <div className="day-grid">
        <div>
          {rows.map((r, i) => (
            <Reveal key={r.when} delay={0.1 * i}>
              <div className="timeline-row">
                <span className={`num-badge ${i === rows.length - 1 ? "solid" : ""}`}>{i + 1}</span>
                <span className="when">{r.when}</span>
                <span className="what">{r.what}</span>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2}>
          <div className="day-canvas">
            <BuildingCanvas />
            <div className="caption">BMK5 · Betonimiehenkuja 5 · our wing lit</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── The bar: comparison table ─────────────────── */
export function BarSlide() {
  const cols = ["", "Builders", "Industry backing", "Outputs", "Running since"];
  const rows: { org: string; cells: string[]; us?: boolean }[] = [
    {
      org: "MIT",
      cells: [
        "35+ makerspaces (Project Manus)",
        "34 corporate members fund ~25% of the Media Lab's $66\u201380M budget",
        "Fab labs began here",
        "Decades",
      ],
    },
    {
      org: "ETH Zurich",
      cells: [
        "3,000+ students through the Student Project House",
        "Pro-bono experts and fellowships",
        "Spinoffs; student ideas built since 2016",
        "2016",
      ],
    },
    {
      org: "Newlab",
      cells: [
        "400+ member startups",
        "Largely self-funded via corporate and government projects",
        "$4B VC raised, $3B exits, $17B+ valuation, 264 days quicker to a series A",
        "2016",
      ],
    },
    {
      org: "Dream Hall · TU Delft",
      cells: [
        "13 student teams, 400+ students",
        "Dedicated workshops, equipment, technical support",
        "Rockets, race cars, robots and other hardware",
        "25+ years",
      ],
    },
    {
      org: "TAKOMO",
      cells: [
        "1,000+ community members across three communities",
        "10+ industry partners before dedicated funding",
        "250+ events a year, 20+ projects, student satellites, competition robots",
        "Already running",
      ],
      us: true,
    },
  ];
  const conclusions = [
    "Every peer pairs open floor space with institutional money; the space alone is never the product.",
    "The strongest models are demand-funded: corporate members and partner projects carry Newlab and the Media Lab.",
    "All of them started from a running community, not an empty building.",
    "TAKOMO enters at the same starting point the winners had, with the community already at scale.",
  ];
  return (
    <section className="slide">
      <Reveal>
        <Kicker>The bar</Kicker>
        <h2 className="headline">We know what we are measuring against.</h2>
      </Reveal>
      <div className="compare-grid">
        <Reveal delay={0.1}>
          <div className="compare-scroll">
            <table className="compare-table">
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.org} className={r.us ? "us" : undefined}>
                    <td>{r.org}</td>
                    {r.cells.map((c, i) => (
                      <td key={i}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
        <div className="conclusions">
          <Reveal delay={0.2}>
            <h3>What the table says</h3>
          </Reveal>
          {conclusions.map((c, i) => (
            <Reveal key={i} delay={0.25 + i * 0.08}>
              <div className="card" style={{ padding: "14px 18px" }}>
                <p>{c}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Why us / now / here ───────────────────────── */
export function WhySlide() {
  const cols = [
    {
      t: "Why us",
      d: "Three shipping communities, 1,000+ people already engaged and waiting for this to happen, partners already in, before a single euro of dedicated funding.",
    },
    {
      t: "Why now",
      d: "Physical AI is inflecting; software is commoditising; the builders exist but lack the space and resources.",
    },
    {
      t: "Why here",
      d: "Aalto and our communities have the talent, the design DNA, and a proven record of student-led ventures going global.",
    },
  ];
  return (
    <section className="slide glow">
      <Reveal>
        <Kicker>Why us, why now, why here</Kicker>
        <h2 className="headline">The right team, the right moment, the right place.</h2>
      </Reveal>
      <div className="why-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {cols.map((c, i) => (
            <Reveal key={c.t} delay={0.12 * i}>
              <div className="card">
                <h3>{c.t}</h3>
                <p style={{ marginTop: 10 }}>{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.25}>
          <div className="sierpinski">
            <SierpinskiCanvas />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Footer ────────────────────────────────────── */
export function Footer() {
  return (
    <footer id="contact" className="slide footer glow">
      <Reveal>
        <Kicker>Team &amp; structure</Kicker>
        <h2 className="headline">Built and maintained by a hardware consortium.</h2>
        <p className="sub">
          HSA ry owns Thinkin&apos; Rocks Oy, which operates the TAKOMO space. ASA and AROC are
          founding communities with their own governance and budgets. Legal and bookkeeping stay
          separate across entities. TAKOMO holds no assets; the loop is the product.
        </p>
      </Reveal>
      <Reveal delay={0.15}>
        <p className="sub" style={{ marginTop: 24 }}>
          <a href="mailto:matias.korte@thinkinrocks.com">matias.korte@thinkinrocks.com</a>
          {" · "}+358 40 098 0609
        </p>
      </Reveal>
      <Reveal delay={0.25}>
        <div className="footer-bottom">
          <span>TAKOMO · Aalto Hardware Consortium</span>
          <span>From atoms to impact</span>
          <span>Otaniemi · Espoo · Finland</span>
        </div>
      </Reveal>
    </footer>
  );
}
