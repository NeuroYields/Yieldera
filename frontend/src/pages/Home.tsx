import MatrixRain from "../components/MatrixRain";
import Navbar from "../components/NavbarLanding";
import Hero from "../components/Hero";
import Features from "../components/Features";
import ArchitectureSection from "../components/ArchitectureSection";
import CallToAction from "../components/CallToAction";
import Footer from "../components/Footer";
import HederaSection from "../components/HederaSection";
import TechStack from "../components/TechStack";
import FAQ from "../components/FAQ";
import ProblemSolutionSection from "../components/ProblemSolutionSection";
import Marquee from "react-fast-marquee";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-background relative">
      {/* Matrix Rain Background */}
      <MatrixRain />
      {/* Navigation */}
      <Navbar />

      {/* Disclaimer Marquee */}
      <div className="bg-yellow-500/10 border-y border-yellow-500/30 py-2 mt-16">
        <Marquee speed={50} gradient={false}>
          <span className="font-mono text-sm text-yellow-400 mx-8">
            $YLD is a fictional token displayed for the Hedera Hello Future:
            Origins Hackathon 2025, solely to illustrate potential token utility
            within the project.
          </span>
        </Marquee>
      </div>

      {/* Page Sections */}
      <main>
        <Hero />
        <div id="architecture">
          <ArchitectureSection />
        </div>
        <div id="techstack">
          <TechStack />
        </div>
        <div id="problems">
          <ProblemSolutionSection />
        </div>
        <div id="features">
          <Features />
        </div>

        <div id="hedera">
          <HederaSection />
        </div>

        <CallToAction />
        <div id="faq">
          <FAQ />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
