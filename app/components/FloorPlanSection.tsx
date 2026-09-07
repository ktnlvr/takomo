"use client";

import dynamic from "next/dynamic";

const FloorPlan = dynamic(() => import("./FloorPlan"), { ssr: false });

export default function FloorPlanSection() {
  return (
    <section id="space">
      <FloorPlan />
    </section>
  );
}
