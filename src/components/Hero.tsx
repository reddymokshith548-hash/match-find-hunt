import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Users, Zap, Heart, Sparkles, Rocket, Star } from "lucide-react";
import { useAuthRouting } from "@/hooks/useAuthRouting";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  const { handleStartFindingPartners, handleGetStarted } = useAuthRouting();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden perspective-container"
      style={{
        background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, hsl(var(--primary) / 0.15), transparent 50%), linear-gradient(135deg, hsl(var(--background)), hsl(var(--accent) / 0.2))`,
        transform: `translateY(${scrollY * 0.5}px)`,
      }}
    >
      {/* Dynamic Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(45deg, hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(-45deg, hsl(var(--secondary) / 0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          transform: `translateY(${scrollY * 0.2}px)`,
        }}
      />
      
      {/* Animated Gradient Orbs */}
      <div 
        className="absolute top-1/4 -left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-glow"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.4), transparent)',
          transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.15}px) scale(${isVisible ? 1 : 0.5})`,
          opacity: isVisible ? 1 : 0,
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      <div 
        className="absolute bottom-1/4 -right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-glow"
        style={{
          background: 'radial-gradient(circle, hsl(var(--secondary) / 0.4), transparent)',
          transform: `translate(-${scrollY * 0.1}px, -${scrollY * 0.15}px) scale(${isVisible ? 1 : 0.5})`,
          opacity: isVisible ? 1 : 0,
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
          animationDelay: '0.5s',
        }}
      />
      
      {/* Floating 3D Elements with Parallax */}
      <div 
        className="absolute top-20 left-10 w-8 h-8 bg-primary/30 rounded-full floating-element animate-pulse-glow"
        style={{
          transform: `translate(${mousePosition.x * 0.03}px, ${mousePosition.y * 0.03}px) scale(${isVisible ? 1 : 0})`,
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      <div 
        className="absolute top-1/3 right-20 w-6 h-6 bg-secondary/40 rounded-full floating-element"
        style={{
          transform: `translate(${mousePosition.x * -0.04}px, ${mousePosition.y * 0.04}px) scale(${isVisible ? 1 : 0})`,
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
          animationDelay: '2s',
        }}
      />
      <div 
        className="absolute bottom-1/4 left-1/4 w-10 h-10 bg-primary/20 rounded-full floating-element animate-scale-pulse"
        style={{
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * -0.03}px) scale(${isVisible ? 1 : 0})`,
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
          animationDelay: '4s',
        }}
      />
      
      {/* Floating Icons with Depth */}
      <Sparkles 
        className="absolute top-1/4 right-1/3 w-8 h-8 text-secondary/50 floating-element"
        style={{
          transform: `translate(${mousePosition.x * 0.035}px, ${mousePosition.y * 0.025}px) scale(${isVisible ? 1 : 0})`,
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
          animationDelay: '1s',
        }}
      />
      <Rocket 
        className="absolute bottom-1/3 right-10 w-10 h-10 text-primary/40 floating-element animate-tilt"
        style={{
          transform: `translate(${mousePosition.x * -0.03}px, ${mousePosition.y * 0.035}px) rotate(${isVisible ? 0 : -45}deg) scale(${isVisible ? 1 : 0})`,
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
          animationDelay: '3s',
        }}
      />
      <Star 
        className="absolute top-1/2 left-20 w-7 h-7 text-secondary/60 floating-element animate-pulse-glow"
        style={{
          transform: `translate(${mousePosition.x * 0.04}px, ${mousePosition.y * -0.02}px) scale(${isVisible ? 1 : 0})`,
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.5s',
          animationDelay: '5s',
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div 
            className="text-center lg:text-left"
            style={{
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(-100px) translateY(50px)',
              opacity: isVisible ? 1 : 0,
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div className="inline-flex items-center gap-2 bg-gradient-primary text-white px-5 py-2.5 rounded-full text-sm font-medium mb-8 hover-3d animate-pulse-glow shadow-lg shadow-primary/30">
              <Zap className="w-4 h-4 animate-scale-pulse" />
              Where Great Ideas Meet Great Partners
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 hover-tilt">
              Find Your Perfect{" "}
              <span className="gradient-text animate-scale-pulse block mt-2">Co-founder</span>
            </h1>
            
            <p 
              className="text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed font-light"
              style={{
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                opacity: isVisible ? 1 : 0,
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
              }}
            >
              Connect with passionate entrepreneurs who share your vision. Build the next big thing together with AI-powered matching that understands your skills, personality, and startup goals.
            </p>
            
            <div 
              className="flex flex-col sm:flex-row gap-4 mb-12"
              style={{
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                opacity: isVisible ? 1 : 0,
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
              }}
            >
              <Button 
                variant="hero" 
                size="lg" 
                className="group hover-3d animate-pulse-glow shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40"
                onClick={handleStartFindingPartners}
              >
                Start Finding Partners
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
              </Button>
              <Button variant="glass" size="lg" className="group hover-tilt shadow-lg hover:shadow-xl">
                <Play className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform" />
                Watch Demo
              </Button>
            </div>
            
            {/* Stats */}
            <div 
              className="flex flex-col sm:flex-row gap-8 text-center lg:text-left"
              style={{
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                opacity: isVisible ? 1 : 0,
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s',
              }}
            >
              <div className="flex items-center gap-3 hover-3d group cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-500 animate-pulse-glow shadow-lg shadow-primary/20">
                  <Users className="w-6 h-6 text-primary group-hover:scale-125 transition-transform duration-500" />
                </div>
                <div>
                  <div className="text-3xl font-bold gradient-text">10K+</div>
                  <div className="text-sm text-muted-foreground">Entrepreneurs</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 hover-3d group cursor-pointer">
                <div 
                  className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-xl flex items-center justify-center group-hover:from-secondary/30 group-hover:to-secondary/20 transition-all duration-500 animate-pulse-glow shadow-lg shadow-secondary/20"
                  style={{ animationDelay: '1s' }}
                >
                  <Heart className="w-6 h-6 text-secondary group-hover:scale-125 transition-transform duration-500" />
                </div>
                <div>
                  <div className="text-3xl font-bold gradient-text">2.5K+</div>
                  <div className="text-sm text-muted-foreground">Successful Matches</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Image */}
          <div 
            className="relative"
            style={{
              transform: isVisible ? 'translateX(0) translateY(0) scale(1)' : 'translateX(100px) translateY(50px) scale(0.8)',
              opacity: isVisible ? 1 : 0,
              transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
            }}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl hover-tilt interactive-card group">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent z-10" />
              <img 
                src={heroImage} 
                alt="Entrepreneurs collaborating and connecting" 
                className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110" 
              />
            </div>
            
            {/* Floating Action Buttons */}
            <div 
              className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center animate-float hover-3d cursor-pointer animate-pulse-glow shadow-2xl shadow-secondary/50"
              style={{
                transform: `translate(${mousePosition.x * 0.015}px, ${mousePosition.y * 0.015}px) scale(${isVisible ? 1 : 0})`,
                opacity: isVisible ? 1 : 0,
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.8s',
              }}
            >
              <Zap className="w-10 h-10 text-white animate-scale-pulse" />
            </div>
            
            <div 
              className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center animate-float-slow hover-3d cursor-pointer shadow-2xl shadow-primary/50"
              style={{
                transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * -0.015}px) scale(${isVisible ? 1 : 0})`,
                opacity: isVisible ? 1 : 0,
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 1s',
                animationDelay: '2s',
              }}
            >
              <Heart className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Hero;