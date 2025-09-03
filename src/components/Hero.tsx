import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Users, Zap, Heart } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/20 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,hsl(var(--primary)/0.05)_1px,transparent_1px),linear-gradient(-45deg,hsl(var(--secondary)/0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-gradient-primary text-white px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              Where Great Ideas Meet Great Partners
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Find Your Perfect{" "}
              <span className="gradient-text">Co-founder</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Connect with passionate entrepreneurs who share your vision. 
              Build the next big thing together with AI-powered matching that 
              understands your skills, personality, and startup goals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button variant="hero" size="lg" className="group">
                Start Finding Partners
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="glass" size="lg" className="group">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex flex-col sm:flex-row gap-8 text-center lg:text-left">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">10K+</div>
                  <div className="text-sm text-muted-foreground">Entrepreneurs</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">2.5K+</div>
                  <div className="text-sm text-muted-foreground">Successful Matches</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="Entrepreneurs collaborating and connecting"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-secondary rounded-full flex items-center justify-center shadow-glow-teal animate-pulse">
              <Zap className="w-8 h-8 text-white" />
            </div>
            
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-glow">
              <Heart className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;