import Nav from "./components/Nav";
import Hero from "./components/Hero";
import SnapScroll from "./components/SnapScroll";
import FloorPlanSection from "./components/FloorPlanSection";
import StickyChapter from "./components/StickyChapter";
import {
  WordmarkSlide,
  TractionSlide,
  DaySlide,
  BarSlide,
  WhySlide,
  Footer,
} from "./components/Sections";

export default function Home() {
  return (
    <main id="top">
      <Nav />
      <SnapScroll />
      <Hero />

      <StickyChapter
        id="collective"
        kicker="Takomo is"
        scene="nut"
        headline={
          <>
            Where ambitious builders come to build{" "}
            <span className="accent">the physical future.</span>
          </>
        }
        items={[
          {
            title: "A collective, not a company.",
            body: (
              <>
                We are a <strong>hardware consortium</strong> facilitating a makerspace for its
                members: three proven communities under one roof, with Aalto University as the
                founding institutional partner.
              </>
            ),
          },
          {
            title: "Thinkin' Rocks: hardware & compute.",
            body: (
              <>
                Supports builders, researchers, and entrepreneurs working on hardware and emerging
                computational systems, and promotes knowledge sharing and experimentation in the
                field. <strong>It operates the space.</strong>
              </>
            ),
          },
          {
            title: "Aalto Space Association: satellites & rocketry.",
            body: (
              <>
                Promotes education and cooperation in satellite technology, rocketry, and astronomy
                at Aalto. <strong>Behind student-built satellites</strong> and international rover
                competitions.
              </>
            ),
          },
          {
            title: "Aalto Robotics Club: robotics & automation.",
            body: (
              <>
                Unites people around ambitious, real-world projects in robotics with access to
                modern tools and resources, <strong>mentored by industry specialists and active
                researchers.</strong>
              </>
            ),
          },
        ]}
      />

      <WordmarkSlide />

      <StickyChapter
        id="shift"
        kicker="The shift"
        scene="board"
        headline={
          <>
            The world is shifting <span className="accent">back to hardware.</span>
          </>
        }
        items={[
          {
            title: "Software is becoming abundant.",
            body: (
              <>
                AI now writes <strong>~41% of all code</strong>, and 75% of new code at Google.
                Software got easy. The scarce thing is no longer the ability to write it; the value
                moved to the physical world.
              </>
            ),
          },
          {
            title: "Capital is moving from models to machines.",
            body: (
              <>
                Deep tech takes a record <strong>~32% of all European VC</strong>: a third of
                Europe&apos;s venture money now flows into hardware, energy, and industry. Robotics
                and physical AI raised $27.6B last year across 1,000+ deals.
              </>
            ),
          },
          {
            title: "The industrial base is being rebuilt.",
            body: (
              <>
                AI is climbing out of the cloud and into the real world. Industrial companies, the
                backbone of the Finnish economy, <strong>need to automate to stay competitive.</strong>
              </>
            ),
          },
          {
            title: "Europe is re-industrializing.",
            body: (
              <>
                Draghi&apos;s estimate: the EU needs <strong>~€800B a year</strong> in new
                investment to stay competitive. A €100B Clean Industrial Deal, a Chips Act, a
                scramble for sovereignty. Finland aims to be at the head of that movement, a
                target that won&apos;t be achieved by hoping.
              </>
            ),
          },
        ]}
      />

      <StickyChapter
        id="problem"
        kicker="The problem"
        scene="ruin"
        headline={
          <>
            We have the talent. <span className="accent">We are missing a shared home.</span>
          </>
        }
        items={[
          {
            title: "The engineer and the researcher.",
            body: (
              <>
                Lacks <strong>equipment for fast prototyping</strong>. The idea is sound and the
                skills are there, but the mill, the bench, and the test rig are behind someone
                else&apos;s door.
              </>
            ),
          },
          {
            title: "The student.",
            body: (
              <>
                Lacks <strong>funding, community, and resources</strong> to purchase equipment.
                Hardware costs real money before it ever works.
              </>
            ),
          },
          {
            title: "The hobbyist.",
            body: (
              <>
                Lacks <strong>community for feedback and ideas</strong>. Building alone is slow;
                building next to someone who has done it before is how skill spreads.
              </>
            ),
          },
          {
            title: "The problem is connecting builders to output.",
            body: (
              <>
                When early-stage resources stay scattered (equipment, expertise, funding,
                community, iteration), <strong>value leaks at every step</strong> and everyone
                loses. Plug the funnel and output reaches the market.
              </>
            ),
          },
        ]}
      />

      <StickyChapter
        id="model"
        kicker="The model"
        scene="wheel"
        headline={
          <>
            Capability, <span className="accent">not companies.</span>
          </>
        }
        items={[
          {
            title: "The Commons is the main event.",
            body: (
              <>
                TAKOMO takes builders, improves their skills with hard physical technology, then
                connects each one to wherever they actually want to go. People learn tools, use
                the shops, build their own projects and help on other people&apos;s.{" "}
                <strong>Most members live here and never need anything else. That&apos;s the point.</strong>
              </>
            ),
          },
          {
            title: "The engine is the connection layer.",
            body: (
              <>
                Making people capable is half of it; matching is the other half. Peers, technical
                staff, mentors, corporate partners, capital, Aalto research, alumni.{" "}
                <strong>A brief board, a regular demo cycle, review points, and a deal desk</strong>{" "}
                turn capability into somewhere to go.
              </>
            ),
          },
          {
            title: "Four kinds of output.",
            body: (
              <>
                <strong>Philosophical</strong>: a culture where the future is built, not waited
                for. <strong>Professional</strong>: engineers who can prototype, collaborate, and
                ship. <strong>Financial</strong>: prototypes become products, builders become
                founders. <strong>International</strong>: a visible community that attracts talent
                and gives it a reason to stay.
              </>
            ),
          },
          {
            title: "The flywheel is the moat.",
            body: (
              <>
                More people building means more projects, more exits, more returning founders and
                mentors, which pulls in more talent, capital, and partners.{" "}
                <strong>The loop is the actual product.</strong> The thousand square metres is just
                the place it runs.
              </>
            ),
          },
        ]}
      />

      <TractionSlide />
      <DaySlide />
      <FloorPlanSection />
      <BarSlide />
      <WhySlide />
      <Footer />
    </main>
  );
}
