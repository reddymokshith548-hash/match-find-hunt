import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Users, Zap, Heart, Sparkles, Rocket, Star } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
const Hero = () => {
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0
  });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth * 100,
        y: e.clientY / window.innerHeight * 100
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  return <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/20 overflow-hidden perspective-container">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,hsl(var(--primary)/0.05)_1px,transparent_1px),linear-gradient(-45deg,hsl(var(--secondary)/0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      {/* Floating 3D Elements */}
      <div className="absolute top-20 left-10 w-6 h-6 bg-primary/20 rounded-full floating-element animate-pulse-glow" style={{
      transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
    }} />
      <div className="absolute top-1/3 right-20 w-4 h-4 bg-secondary/30 rounded-full floating-element" style={{
      transform: `translate(${mousePosition.x * -0.03}px, ${mousePosition.y * 0.03}px)`,
      animationDelay: '2s'
    }} />
      <div className="absolute bottom-1/4 left-1/4 w-8 h-8 bg-primary/10 rounded-full floating-element animate-scale-pulse" style={{
      transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * -0.02}px)`,
      animationDelay: '4s'
    }} />
      
      {/* Floating Icons */}
      <Sparkles className="absolute top-1/4 right-1/3 w-6 h-6 text-secondary/40 floating-element" style={{
      transform: `translate(${mousePosition.x * 0.025}px, ${mousePosition.y * 0.015}px)`,
      animationDelay: '1s'
    }} />
      <Rocket className="absolute bottom-1/3 right-10 w-8 h-8 text-primary/30 floating-element animate-tilt" style={{
      transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * 0.025}px)`,
      animationDelay: '3s'
    }} />
      <Star className="absolute top-1/2 left-20 w-5 h-5 text-secondary/50 floating-element animate-pulse-glow" style={{
      transform: `translate(${mousePosition.x * 0.03}px, ${mousePosition.y * -0.01}px)`,
      animationDelay: '5s'
    }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-gradient-primary text-white px-4 py-2 rounded-full text-sm font-medium mb-8 hover-3d animate-pulse-glow">
              <Zap className="w-4 h-4 animate-scale-pulse" />
              Where Great Ideas Meet Great Partners
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6 hover-tilt">
              Find Your Perfect{" "}
              <span className="gradient-text animate-scale-pulse">Co-founder</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed opacity-0 animate-slide-up" style={{
            animationDelay: '0.2s',
            animationFillMode: 'forwards'
          }}>Connect with passionate entrepreneurs who share your vision. Build next big thing together with AI-powered matching that understands your skills, personality, and startup goals.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12 opacity-0 animate-slide-up" style={{
            animationDelay: '0.4s',
            animationFillMode: 'forwards'
          }}>
              <Button variant="hero" size="lg" className="group hover-3d animate-pulse-glow">
                Start Finding Partners
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="glass" size="lg" className="group hover-tilt">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex flex-col sm:flex-row gap-8 text-center lg:text-left opacity-0 animate-slide-up" style={{
            animationDelay: '0.6s',
            animationFillMode: 'forwards'
          }}>
              <div className="flex items-center gap-2 hover-3d group">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors animate-pulse-glow">
                  <Users className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">10K+</div>
                  <div className="text-sm text-muted-foreground">Entrepreneurs</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 hover-3d group">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center group-hover:bg-secondary/20 transition-colors animate-pulse-glow" style={{
                animationDelay: '1s'
              }}>
                  <Heart className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">2.5K+</div>
                  <div className="text-sm text-muted-foreground">Successful Matches</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Image */}
          <div className="relative opacity-0 animate-slide-up" style={{
          animationDelay: '0.3s',
          animationFillMode: 'forwards'
        }}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl hover-tilt interactive-card">
              <img src={heroImage} alt="Entrepreneurs collaborating and connecting" className="w-full h-auto object-cover transition-transform duration-700 hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-secondary rounded-full flex items-center justify-center animate-float hover-3d cursor-pointer animate-pulse-glow" style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
          }}>
              <Zap className="w-8 h-8 text-white animate-scale-pulse" />
            </div>
            
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center animate-float-slow hover-3d cursor-pointer" style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`,
            animationDelay: '2s'
          }}>
              <Heart className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;