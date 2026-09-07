"use client";

import dynamic from "next/dynamic";
import { Reveal } from "./Reveal";

const FloorPlan = dynamic(() => import("./FloorPlan"), { ssr: false });

export default function FloorPlanSection() {
  return (
    <section id="space" className="slide floorplan-slide">
      <Reveal>
        <span className="kicker">The space</span>
        <h2 className="headline" style={{ margin: "12px 0 8px" }}>
          BMK5, Otaniemi. <span className="accent">One floor, everything a builder needs.</span>
        </h2>
        <p className="sub" style={{ maxWidth: 820 }}>
          The final building: Betonimiehenkuja 5 at Aalto. Explore the first floor — every zone is
          a piece of the pipeline from idea to shipped hardware.
        </p>
      </Reveal>
      <FloorPlan />
    </section>
  );
}
