import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, Briefcase, Star, Sparkles } from "lucide-react";
import { useAuthRouting } from "@/hooks/useAuthRouting";

const MatchPreview = () => {
  const { handleConnect, handlePass, handleStartMatching } = useAuthRouting();
  const [draggedCard, setDraggedCard] = useState<number | null>(null);
  const [cardRotation, setCardRotation] = useState<{ [key: number]: { x: number, y: number } }>({});
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
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

  const handleMouseMove = (e: React.MouseEvent, cardId: number) => {
    const card = cardRefs.current[cardId];
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const rotateX = (e.clientY - centerY) / 10;
    const rotateY = (e.clientX - centerX) / 10;
    
    setCardRotation(prev => ({
      ...prev,
      [cardId]: { x: -rotateX, y: rotateY }
    }));
  };

  const handleMouseLeave = (cardId: number) => {
    setCardRotation(prev => ({
      ...prev,
      [cardId]: { x: 0, y: 0 }
    }));
  };
  const mockProfiles = [
    {
      id: 1,
      name: "Sarah Chen",
      title: "Full-Stack Developer & Product Designer",
      location: "San Francisco, CA",
      experience: "5+ years",
      compatibility: 94,
      skills: ["React", "Python", "UI/UX", "Product Strategy"],
      bio: "Passionate about building consumer apps that solve real problems. Looking for a business-minded co-founder to launch a healthtech startup.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    },
    {
      id: 2,
      name: "Marcus Johnson",
      title: "Business Development & Marketing Expert",
      location: "New York, NY",
      experience: "8+ years",
      compatibility: 89,
      skills: ["Growth Marketing", "Sales", "Business Strategy", "Fundraising"],
      bio: "Experienced in scaling B2B SaaS companies. Seeking a technical co-founder to build the next generation of productivity tools.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    },
  ];


  return (
    <section 
      ref={sectionRef}
      className="py-32 relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, hsl(var(--background)), hsl(var(--accent) / 0.2))`,
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-20 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.25), transparent)',
            transform: `translate(${scrollY * 0.03}px, ${scrollY * 0.06}px) scale(${isVisible ? 1 : 0.5})`,
            opacity: isVisible ? 0.5 : 0,
            transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        <div 
          className="absolute bottom-1/3 left-10 w-96 h-96 rounded-full blur-3xl animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, hsl(var(--secondary) / 0.25), transparent)',
            transform: `translate(-${scrollY * 0.03}px, -${scrollY * 0.06}px) scale(${isVisible ? 1 : 0.5})`,
            opacity: isVisible ? 0.5 : 0,
            transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
            animationDelay: '2s',
          }}
        />
        <Sparkles 
          className="absolute top-20 right-1/4 w-8 h-8 text-primary/30"
          style={{
            transform: `translateY(${Math.sin(scrollY * 0.01) * 20}px) scale(${isVisible ? 1 : 0})`,
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div 
          className="text-center mb-20"
          style={{
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.95)',
            opacity: isVisible ? 1 : 0,
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            See How <span className="gradient-text animate-scale-pulse">Matching</span> Works
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            Discover compatible co-founders with detailed profiles, compatibility scores, 
            and smart recommendations based on your goals.
          </p>
        </div>

        <div className="max-w-4xl mx-auto perspective-container">
          <div className="grid lg:grid-cols-2 gap-10">
            {mockProfiles.map((profile, index) => (
              <Card 
                key={profile.id} 
                ref={el => cardRefs.current[profile.id] = el}
                variant="match" 
                className="overflow-hidden interactive-card group relative border-primary/20 backdrop-blur-xl shadow-xl"
                style={{ 
                  transform: isVisible
                    ? (cardRotation[profile.id] 
                      ? `perspective(1500px) rotateX(${cardRotation[profile.id].x}deg) rotateY(${cardRotation[profile.id].y}deg) scale(1.03) translateY(${Math.sin(scrollY * 0.01 + index) * 5}px)`
                      : `perspective(1500px) rotateX(0deg) rotateY(0deg) scale(1) translateY(${Math.sin(scrollY * 0.01 + index) * 5}px)`)
                    : 'perspective(1500px) rotateX(0deg) rotateY(0deg) scale(0.85) translateY(80px)',
                  opacity: isVisible ? 1 : 0,
                  transition: `all ${cardRotation[profile.id] ? '0.1s' : '1s'} cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.3}s`,
                }}
                onMouseMove={(e) => handleMouseMove(e, profile.id)}
                onMouseLeave={() => handleMouseLeave(profile.id)}
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={profile.image} 
                    alt={profile.name}
                    className="w-full h-56 object-cover transition-transform duration-1000 group-hover:scale-115"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-secondary text-secondary-foreground font-semibold animate-pulse-glow hover:scale-110 transition-transform shadow-lg shadow-secondary/30">
                      {profile.compatibility}% Match
                    </Badge>
                  </div>
                  <Sparkles className="absolute top-3 left-3 w-5 h-5 text-white/70 opacity-0 group-hover:opacity-100 animate-float transition-opacity duration-300" />
                  
                  {/* Glow Effect on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold mb-1 group-hover:gradient-text transition-all duration-300">
                        {profile.name}
                      </h3>
                      <p className="text-muted-foreground text-base mb-3 group-hover:text-foreground/80 transition-colors">
                        {profile.title}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 hover-3d group/location">
                          <MapPin className="w-4 h-4 group-hover/location:text-primary transition-colors" />
                          {profile.location}
                        </div>
                        <div className="flex items-center gap-1 hover-3d group/exp">
                          <Briefcase className="w-4 h-4 group-hover/exp:text-secondary transition-colors" />
                          {profile.experience}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-secondary hover-3d cursor-pointer">
                      <Star className="w-5 h-5 fill-current animate-scale-pulse" />
                      <span className="text-base font-medium">4.9</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm md:text-base text-muted-foreground mb-5 leading-relaxed group-hover:text-foreground/90 transition-colors">
                    {profile.bio}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {profile.skills.map((skill, skillIndex) => (
                      <Badge 
                        key={skillIndex} 
                        variant="secondary" 
                        className="text-xs hover-3d hover:bg-primary hover:text-primary-foreground transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 hover-tilt hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300 group/pass"
                      onClick={handlePass}
                    >
                      <X className="w-4 h-4 mr-2 group-hover/pass:rotate-90 transition-transform" />
                      Pass
                    </Button>
                    <Button 
                      variant="hero" 
                      size="sm" 
                      className="flex-1 hover-3d animate-pulse-glow shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 group/connect"
                      onClick={handleConnect}
                    >
                      <Heart className="w-4 h-4 mr-2 group-hover/connect:scale-125 transition-transform" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div 
            className="text-center mt-16"
            style={{
              transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.9)',
              opacity: isVisible ? 1 : 0,
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.8s',
            }}
          >
            <Button 
              variant="hero" 
              size="lg" 
              className="hover-3d animate-pulse-glow group shadow-2xl shadow-primary/40 hover:shadow-primary/50 text-lg px-8 py-6"
              onClick={handleStartMatching}
            >
              Start Matching Now
              <Sparkles className="w-6 h-6 ml-2 group-hover:rotate-12 group-hover:scale-125 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MatchPreview;