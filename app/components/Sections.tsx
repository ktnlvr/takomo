"use client";

import { Reveal, TextReveal, CountUp } from "./Reveal";

function Kicker({ children }: { children: React.ReactNode }) {
  return <span className="kicker">{children}</span>;
}

/* ── Quote ─────────────────────────────────────── */
export function QuoteSlide() {
  return (
    <section className="slide glow" style={{ alignItems: "center", textAlign: "center" }}>
      <Reveal>
        <Kicker>Why now</Kicker>
      </Reveal>
      <div style={{ height: 28 }} />
      <TextReveal
        className="quote"
        text={`“The next big thing is Physical AI — AI with a body. Robots, autonomous machines, industrial systems… It's all coming.”`}
        accentFrom={16}
      />
      <Reveal delay={1.2}>
        <p className="sub" style={{ marginTop: 28 }}>
          Jensen Huang — CEO, NVIDIA
        </p>
      </Reveal>
    </section>
  );
}

/* ── Thesis ────────────────────────────────────── */
export function ThesisSlide() {
  const points = [
    "Writing software is becoming abundant and near-free.",
    "What stays scarce: working hardware, embodied systems, and the builders who ship them.",
    "The future will be built by people who build.",
  ];
  return (
    <section id="thesis" className="slide">
      <Reveal>
        <Kicker>The thesis</Kicker>
        <h2 className="headline">
          As AI makes software cheap, value moves to the physical world —{" "}
          <span className="accent">and to the people who can build it.</span>
        </h2>
      </Reveal>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 24, maxWidth: 760 }}>
        {points.map((p, i) => (
          <Reveal key={i} delay={0.15 * i}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span className={`num-badge ${i === points.length - 1 ? "solid" : ""}`}>{i + 1}</span>
              <p className="sub" style={{ paddingTop: 3 }}>
                {p}
                {i === points.length - 1 && (
                  <>
                    {" "}
                    <strong style={{ color: "var(--accent-soft)" }}>That is us.</strong>
                  </>
                )}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.5}>
        <p className="sub" style={{ marginTop: 40, fontStyle: "italic", fontSize: 15 }}>
          The binding constraint is no longer whether you can code it — it&apos;s whether a builder
          is funded, equipped, and surrounded well enough to make it real.
        </p>
      </Reveal>
    </section>
  );
}

/* ── Problem ───────────────────────────────────── */
export function ProblemSlide() {
  const missing = [
    { t: "Funding", d: "Hardware costs far more than software — the real crutch." },
    { t: "Equipment", d: "Specialised tools, components, and infrastructure." },
    { t: "Expertise", d: "Real systems need many disciplines at once." },
    { t: "Community", d: "Building goes faster when it happens together." },
    { t: "Iteration", d: "Physical systems demand time, testing, repetition." },
  ];
  return (
    <section className="slide">
      <Reveal>
        <Kicker>The problem</Kicker>
        <h2 className="headline">
          The problem was never a shortage of ideas. It&apos;s the environment to build them.
        </h2>
      </Reveal>
      <Reveal delay={0.15}>
        <div className="pipeline">
          {["Idea", "Research", "Prototype"].map((s) => (
            <span key={s} style={{ display: "contents" }}>
              <span className="chip">{s}</span>
              <span className="arrow">→</span>
            </span>
          ))}
          <span className="chip active">Product</span>
        </div>
      </Reveal>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 14,
        }}
      >
        {missing.map((m, i) => (
          <Reveal key={m.t} delay={0.08 * i}>
            <div className="card" style={{ height: "100%" }}>
              <span className="num-badge">{i + 1}</span>
              <h3 style={{ margin: "14px 0 8px", color: i === 0 ? "var(--accent-soft)" : undefined }}>
                {m.t}
              </h3>
              <p>{m.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── Opportunity: Finland ──────────────────────── */
export function FinlandSlide() {
  const rows: [string, string, string][] = [
    ["Nokia", "€4.5B", "€19.2B"],
    ["UPM", "€488M", "€10.3B"],
    ["Wärtsilä", "€296M", "€6.5B"],
    ["Kone", "€203M", "€11.1B"],
    ["Valmet", "€123M", "€5.4B"],
  ];
  return (
    <section className="slide">
      <Reveal>
        <Kicker>The opportunity</Kicker>
        <h2 className="headline">Finland knows how to build hardware. It always has.</h2>
      </Reveal>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px, 1.2fr) minmax(260px, 1fr)",
          gap: 20,
          alignItems: "start",
        }}
        className="max-md:!grid-cols-1"
      >
        <Reveal delay={0.1}>
          <div className="card" style={{ padding: "10px 6px" }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>R&amp;D funding</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([c, rd, rev]) => (
                  <tr key={c}>
                    <td>{c}</td>
                    <td>{rd}</td>
                    <td>{rev}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ padding: "10px 14px 6px", fontSize: 12, fontStyle: "italic" }}>
              Top Finnish R&amp;D spenders, 2024 · Source: Valtioneuvosto
            </p>
          </div>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Reveal delay={0.2}>
            <div className="card">
              <h3 style={{ color: "var(--accent-soft)" }}>Legacy</h3>
              <p style={{ marginTop: 8 }}>
                A century of building globally recognised technology companies — a foundation for
                the next generation of deep-tech.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="card">
              <h3 style={{ color: "var(--accent-soft)" }}>Design</h3>
              <p style={{ marginTop: 8 }}>
                Finnish products win on engineering and world-class design — the combination that
                competes globally.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Gap ───────────────────────────────────────── */
export function GapSlide() {
  const facts = [
    { big: "~150", small: "startups in A Grid (25,000 m²)" },
    { big: "Slush", small: "born from Aalto students" },
    { big: "Rovio · Supercell · Wolt", small: "the software lineage" },
  ];
  return (
    <section className="slide glow">
      <Reveal>
        <Kicker>The gap</Kicker>
        <h2 className="headline">Aalto has the talent. It&apos;s missing the shared home.</h2>
        <p className="sub">
          World-class research, engineering talent, entrepreneurial culture, and industry ties.{" "}
          <span style={{ color: "var(--accent-soft)", fontWeight: 600 }}>
            Yet technical projects still lack one place
          </span>{" "}
          where researchers, engineers, founders, and industry partners can collaborate, prototype,
          and turn ideas into real technology.
        </p>
      </Reveal>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginTop: 34,
        }}
      >
        {facts.map((f, i) => (
          <Reveal key={f.small} delay={0.12 * i}>
            <div className="card" style={{ height: "100%" }}>
              <h3 style={{ fontSize: 22 }}>{f.big}</h3>
              <p style={{ marginTop: 8 }}>{f.small}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.45}>
        <p className="sub" style={{ marginTop: 30, fontStyle: "italic", fontSize: 15 }}>
          TAKOMO does for atoms what Aalto&apos;s students already did for software.
        </p>
      </Reveal>
    </section>
  );
}

/* ── Answer ────────────────────────────────────── */
export function AnswerSlide() {
  return (
    <section className="slide glow" style={{ alignItems: "center", textAlign: "center" }}>
      <Reveal>
        <Kicker>The answer</Kicker>
      </Reveal>
      <Reveal delay={0.1}>
        <h2
          style={{
            fontSize: "clamp(3.5rem, 11vw, 8.5rem)",
            fontWeight: 900,
            letterSpacing: "0.03em",
            color: "#fff",
            margin: "18px 0 8px",
            textShadow: "0 0 80px rgba(59,110,246,0.45)",
          }}
        >
          TAKOMO
        </h2>
      </Reveal>
      <Reveal delay={0.25}>
        <p style={{ color: "var(--accent-soft)", fontSize: "clamp(1.1rem, 2vw, 1.4rem)", fontWeight: 600 }}>
          The forge for Aalto&apos;s hardware building.
        </p>
      </Reveal>
      <Reveal delay={0.4}>
        <p className="sub" style={{ marginTop: 24, maxWidth: 560 }}>
          A shared space, a shared stack of tools, and a shared community where ambitious technical
          projects get funded, equipped, and shipped. Forged on a day-to-day basis.
        </p>
      </Reveal>
    </section>
  );
}

/* ── Communities ───────────────────────────────── */
export function CommunitiesSlide() {
  const comms = [
    {
      tag: "TR",
      name: "Thinkin' Rocks",
      role: "operates the space",
      desc: "Applied engineering lab and prototyping infrastructure for builders, hackers, and founders in hardware and emerging compute.",
      quote: "“Turn white papers into working products.”",
    },
    {
      tag: "ASA",
      name: "Aalto Space Association",
      role: "founding community",
      desc: "Satellite technology, rocketry, and astronomy — behind Aalto-3, a student-built 1U CubeSat, and the EnduroSat rover competition.",
      quote: "Aalto's 6th satellite, student-built.",
    },
    {
      tag: "ARC",
      name: "Aalto Robotics Club",
      role: "founding community",
      desc: "Real-world robotics: teaching ROS and ML from scratch, competing internationally, building an autonomous logistics robot.",
      quote: "Robots that leave the lab.",
    },
  ];
  return (
    <section id="communities" className="slide">
      <Reveal>
        <Kicker>The founding communities</Kicker>
        <h2 className="headline">Three proven communities, one roof.</h2>
      </Reveal>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {comms.map((c, i) => (
          <Reveal key={c.tag} delay={0.12 * i}>
            <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
              <span className="num-badge solid" style={{ width: 44, fontSize: 12 }}>
                {c.tag}
              </span>
              <h3 style={{ fontSize: 18 }}>{c.name}</h3>
              <span className="kicker" style={{ fontSize: 10.5 }}>{c.role}</span>
              <p style={{ flex: 1 }}>{c.desc}</p>
              <p style={{ fontStyle: "italic", color: "#aab6d8" }}>{c.quote}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.4}>
        <div className="card" style={{ marginTop: 16 }}>
          <p>
            <strong style={{ color: "var(--accent-soft)" }}>Aalto University</strong> is our founding
            institutional partner. Each community runs and funds its own projects; TAKOMO is the
            common ground — one shared, joint ideological foundation.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

/* ── Traction ──────────────────────────────────── */
export function TractionSlide() {
  const stats = [
    { v: 1000, s: "+", l: "event attendees" },
    { v: 20, s: "+", l: "events (13 YTD)" },
    { v: 8, s: "", l: "industry partners" },
    { v: 3, s: "", l: "international collaborations" },
    { v: 40, s: "+", l: "systems in the hardware library" },
    { v: 10, s: "+", l: "hardware projects supported" },
  ];
  return (
    <section className="slide">
      <Reveal>
        <Kicker>Traction</Kicker>
        <h2 className="headline">We didn&apos;t wait for permission. We&apos;re already running.</h2>
      </Reveal>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 16,
        }}
      >
        {stats.map((st, i) => (
          <Reveal key={st.l} delay={0.07 * i}>
            <div className="card">
              <CountUp value={st.v} suffix={st.s} />
              <div className="stat-label">{st.l}</div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.4}>
        <p className="sub" style={{ marginTop: 26, fontStyle: "italic", fontSize: 14 }}>
          Thinkin&apos; Rocks, last 8 months · plus ASA&apos;s student satellites &amp; ARC&apos;s
          international robotics competitions — all before dedicated funding.
        </p>
      </Reveal>
    </section>
  );
}

/* ── Model ─────────────────────────────────────── */
export function ModelSlide() {
  return (
    <section className="slide">
      <Reveal>
        <Kicker>The model</Kicker>
        <h2 className="headline">We turn talent into a pipeline that compounds.</h2>
      </Reveal>
      <Reveal delay={0.15}>
        <div className="pipeline" style={{ maxWidth: 900 }}>
          {["Build", "Learn", "Connect"].map((s) => (
            <span key={s} style={{ display: "contents" }}>
              <span className="chip">{s}</span>
              <span className="arrow">→</span>
            </span>
          ))}
          <span className="chip solid">Ship</span>
        </div>
        <p className="sub" style={{ fontStyle: "italic", fontSize: 14 }}>
          ↺ people and IP re-enter TAKOMO stronger each cycle
        </p>
      </Reveal>
      <Reveal delay={0.3}>
        <div className="card" style={{ marginTop: 28, maxWidth: 900 }}>
          <p>
            <strong style={{ color: "var(--accent-soft)" }}>In:</strong> students, researchers,
            devs, founders — with clarity, passion, direction, and a place to create freely.{" "}
            <strong style={{ color: "var(--accent-soft)" }}>Out:</strong> technology and the people
            who make it.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

/* ── Plan / timeline ───────────────────────────── */
export function PlanSlide() {
  const rows = [
    {
      when: "Now → Q4 2026",
      what: "Charter signed; shared space equipped and open; weekly build sessions, workshops, and demo nights running; membership + governance formalised.",
    },
    {
      when: "Q1–Q2 2027",
      what: "Monthly flagship programming; growing participation from students, builders, industry; 15+ partnerships across industry and the ecosystem.",
    },
    {
      when: "Q3 2027",
      what: "First flagship innovation program completed; outcomes measured and documented; expansion planning begins.",
    },
    {
      when: "Q4 2027",
      what: "Supported projects progress into startups (some VC-funded); TAKOMO recognised as a key platform connecting research, talent, and hardware in Finland.",
    },
  ];
  return (
    <section id="plan" className="slide">
      <Reveal>
        <Kicker>The plan</Kicker>
        <h2 className="headline">Here&apos;s exactly what we&apos;ll do this year.</h2>
      </Reveal>
      <div style={{ maxWidth: 900 }}>
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
      <Reveal delay={0.5}>
        <p className="sub" style={{ marginTop: 32 }}>
          The bar we measure against: MIT&apos;s Project Manus, ETH Zurich&apos;s Student Project
          House, Newlab.{" "}
          <span style={{ color: "var(--accent-soft)" }}>
            TAKOMO is the Nordic forge built to reach that tier — starting from a running community.
          </span>
        </p>
      </Reveal>
    </section>
  );
}

/* ── Footer ────────────────────────────────────── */
export function Footer() {
  return (
    <footer id="contact" className="slide footer glow">
      <Reveal>
        <Kicker>Team &amp; contact</Kicker>
        <h2 className="headline">Built by people who already ship.</h2>
        <p className="sub">
          Thinkin&apos; Rocks and HSA leadership — Matias Korte, Yerzhan Zamashev, Artur Roos,
          Milana Begantsova, Oleksandr Osadchuk.
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
          <span>TAKOMO — a forge for hardware at Aalto</span>
          <span>From atoms to impact</span>
          <span>Otaniemi · Espoo · Finland</span>
        </div>
      </Reveal>
    </footer>
  );
}
