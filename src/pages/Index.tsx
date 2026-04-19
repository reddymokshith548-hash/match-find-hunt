import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import MatchPreview from "@/components/MatchPreview";
import Footer from "@/components/Footer";
import WireframeLoader from "@/components/WireframeLoader";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Trigger UI reveal slightly before loader fully exits for smooth handoff
    const t = setTimeout(() => setRevealed(true), 2900);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {loading && <WireframeLoader onComplete={() => setLoading(false)} />}
      <div
        className={`min-h-screen bg-background transition-all duration-700 ease-out ${
          revealed ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <Navigation />
        <Hero />
        <Features />
        <MatchPreview />
        <Footer />
      </div>
    </>
  );
};

export default Index;
