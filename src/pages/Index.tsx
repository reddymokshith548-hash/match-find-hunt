import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import MatchPreview from "@/components/MatchPreview";
import Footer from "@/components/Footer";
import IntroAnimation from "@/components/IntroAnimation";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <IntroAnimation storageKey="lexach-intro-landing" />
      <Navigation />
      <Hero />
      <Features />
      <MatchPreview />
      <Footer />
    </div>
  );
};

export default Index;
