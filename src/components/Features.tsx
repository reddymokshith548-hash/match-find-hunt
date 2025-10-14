import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Users, MessageCircle, Star, Zap, Shield, Sparkles, Rocket, Heart, Target, TrendingUp, Award } from "lucide-react";


const Features = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
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

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Matching",
      description: "Our smart algorithm analyzes skills, personality, and vision to find your perfect co-founder match.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Users,
      title: "Curated Community",
      description: "Connect with verified entrepreneurs, innovators, and startup enthusiasts from around the world.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: MessageCircle,
      title: "Seamless Communication",
      description: "Built-in messaging and video calls to get to know your potential co-founders before committing.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Star,
      title: "Skill Verification",
      description: "Verified profiles with portfolio reviews, LinkedIn integration, and peer recommendations.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: Zap,
      title: "Quick Matching",
      description: "Swipe through potential matches quickly with detailed compatibility scores and insights.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "Background checks, privacy controls, and secure collaboration tools for peace of mind.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ];


  return (
    <section 
      ref={sectionRef}
      className="py-32 relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, hsl(var(--accent) / 0.3), hsl(var(--background)))`,
      }}
    >
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.3), transparent)',
            transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.08}px) scale(${isVisible ? 1 : 0.5})`,
            opacity: isVisible ? 0.6 : 0,
            transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, hsl(var(--secondary) / 0.3), transparent)',
            transform: `translate(-${scrollY * 0.05}px, -${scrollY * 0.08}px) scale(${isVisible ? 1 : 0.5})`,
            opacity: isVisible ? 0.6 : 0,
            transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
            animationDelay: '1s',
          }}
        />

        {/* Floating Icons */}
        <Sparkles
          className="absolute top-32 right-1/4 w-10 h-10 text-primary/40 floating-element animate-pulse-glow"
          style={{
            transform: `translateY(${Math.sin(scrollY * 0.01) * 15}px) rotate(${scrollY * 0.1}deg) scale(${isVisible ? 1 : 0})`,
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
          }}
        />
        <Rocket
          className="absolute bottom-1/3 left-20 w-12 h-12 text-secondary/50 floating-element animate-tilt"
          style={{
            transform: `translateY(${Math.sin(scrollY * 0.008 + 2) * 20}px) rotate(${isVisible ? 0 : -45}deg) scale(${isVisible ? 1 : 0})`,
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
            animationDelay: '2s',
          }}
        />
        <Heart
          className="absolute top-1/2 right-32 w-8 h-8 text-primary/35 floating-element animate-scale-pulse"
          style={{
            transform: `translateY(${Math.sin(scrollY * 0.012 + 4) * 12}px) scale(${isVisible ? 1 : 0})`,
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s',
            animationDelay: '1.5s',
          }}
        />
        <Target
          className="absolute bottom-1/4 right-1/3 w-9 h-9 text-secondary/45 floating-element"
          style={{
            transform: `translateY(${Math.sin(scrollY * 0.009 + 1) * 18}px) rotate(${scrollY * 0.05}deg) scale(${isVisible ? 1 : 0})`,
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.8s',
            animationDelay: '3s',
          }}
        />
        <TrendingUp
          className="absolute top-2/3 left-1/4 w-10 h-10 text-primary/40 floating-element animate-pulse-glow"
          style={{
            transform: `translateY(${Math.sin(scrollY * 0.011 + 3) * 14}px) scale(${isVisible ? 1 : 0})`,
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 1s',
            animationDelay: '2.5s',
          }}
        />
        <Award
          className="absolute top-1/3 left-32 w-11 h-11 text-secondary/40 floating-element animate-scale-pulse"
          style={{
            transform: `translateY(${Math.sin(scrollY * 0.01 + 5) * 16}px) rotate(${scrollY * -0.08}deg) scale(${isVisible ? 1 : 0})`,
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 1.2s',
            animationDelay: '1s',
          }}
        />
        <Star
          className="absolute bottom-40 left-1/3 w-7 h-7 text-primary/45 floating-element"
          style={{
            transform: `translateY(${Math.sin(scrollY * 0.013 + 2) * 10}px) scale(${isVisible ? 1 : 0})`,
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 1.4s',
            animationDelay: '0.5s',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div 
          className="text-center mb-20"
          style={{
            transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
            opacity: isVisible ? 1 : 0,
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Why Choose <span className="gradient-text animate-scale-pulse">Lexach</span>?
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            We've built the most comprehensive platform for entrepreneurs to find, 
            connect, and collaborate with their ideal co-founders.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-container">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              variant="glass" 
              className={`group interactive-card border-primary/20 backdrop-blur-xl ${
                hoveredCard === index ? 'z-10 shadow-2xl shadow-primary/30' : ''
              }`}
              style={{ 
                transform: isVisible 
                  ? (hoveredCard === index 
                    ? 'scale(1.08) translateY(-15px) rotateX(5deg)' 
                    : `translateY(${Math.sin(scrollY * 0.01 + index) * 8}px)`)
                  : 'translateY(80px) scale(0.9)',
                opacity: isVisible ? 1 : 0,
                transition: `all ${hoveredCard === index ? '0.5s' : '1s'} cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.15}s`,
              }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="pb-4">
                <div 
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden transition-all duration-700 shadow-lg ${
                    hoveredCard === index ? 'scale-125 shadow-xl' : 'group-hover:scale-110'
                  }`}
                  style={{
                    background: hoveredCard === index 
                      ? `linear-gradient(135deg, hsl(var(--${index % 2 === 0 ? 'primary' : 'secondary'})), hsl(var(--${index % 2 === 0 ? 'primary' : 'secondary'}) / 0.6))`
                      : feature.bgColor,
                  }}
                >
                  {hoveredCard === index && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse-glow" />
                  )}
                  <feature.icon 
                    className={`w-8 h-8 z-10 transition-all duration-500 ${
                      hoveredCard === index ? 'text-white scale-110 animate-scale-pulse' : feature.color
                    }`} 
                  />
                </div>
                <CardTitle className={`text-2xl mb-3 transition-all duration-300 ${
                  hoveredCard === index ? 'gradient-text scale-105' : ''
                }`}>
                  {feature.title}
                </CardTitle>
                <CardDescription className={`text-base leading-relaxed transition-all duration-300 ${
                  hoveredCard === index ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/80'
                }`}>
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;