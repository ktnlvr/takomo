import Nav from "./components/Nav";
import Hero from "./components/Hero";
import FloorPlanSection from "./components/FloorPlanSection";
import {
  QuoteSlide,
  ThesisSlide,
  ProblemSlide,
  FinlandSlide,
  GapSlide,
  AnswerSlide,
  CommunitiesSlide,
  TractionSlide,
  ModelSlide,
  PlanSlide,
  Footer,
} from "./components/Sections";

export default function Home() {
  return (
    <main id="top">
      <Nav />
      <Hero />
      <QuoteSlide />
      <ThesisSlide />
      <ProblemSlide />
      <FinlandSlide />
      <GapSlide />
      <AnswerSlide />
      <CommunitiesSlide />
      <TractionSlide />
      <ModelSlide />
      <FloorPlanSection />
      <PlanSlide />
      <Footer />
    </main>
  );
}
