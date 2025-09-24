import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, Briefcase, Star, Sparkles } from "lucide-react";
import { useAuthRouting } from "@/hooks/useAuthRouting";

const MatchPreview = () => {
  const { handleConnect, handlePass, handleStartMatching } = useAuthRouting();
  const [draggedCard, setDraggedCard] = useState<number | null>(null);
  const [cardRotation, setCardRotation] = useState<{ [key: number]: { x: number, y: number } }>({});
  const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

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
    <section className="py-24 bg-background dark:bg-gradient-to-br dark:from-background dark:via-background/95 dark:to-primary/5 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Sparkles className="absolute top-20 right-1/4 w-6 h-6 text-primary/20 animate-float" />
        <div className="absolute bottom-1/3 left-10 w-20 h-20 bg-secondary/5 rounded-full animate-float-slow" />
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-primary/5 rounded-full animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 animate-slide-up">
            See How <span className="gradient-text animate-scale-pulse">Matching</span> Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto opacity-0 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            Discover compatible co-founders with detailed profiles, compatibility scores, 
            and smart recommendations based on your goals.
          </p>
        </div>

        <div className="max-w-4xl mx-auto perspective-container">
          <div className="grid lg:grid-cols-2 gap-8">
            {mockProfiles.map((profile, index) => (
              <Card 
                key={profile.id} 
                ref={el => cardRefs.current[profile.id] = el}
                variant="match" 
                className="overflow-hidden interactive-card opacity-0 animate-slide-up group relative"
                style={{ 
                  animationDelay: `${index * 0.2}s`, 
                  animationFillMode: 'forwards',
                  transform: cardRotation[profile.id] 
                    ? `perspective(1000px) rotateX(${cardRotation[profile.id].x}deg) rotateY(${cardRotation[profile.id].y}deg) scale(1.02)`
                    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
                }}
                onMouseMove={(e) => handleMouseMove(e, profile.id)}
                onMouseLeave={() => handleMouseLeave(profile.id)}
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={profile.image} 
                    alt={profile.name}
                    className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-secondary text-secondary-foreground font-semibold animate-pulse-glow hover:scale-110 transition-transform">
                      {profile.compatibility}% Match
                    </Badge>
                  </div>
                  {/* Floating sparkle effect */}
                  <Sparkles className="absolute top-2 left-2 w-4 h-4 text-white/60 opacity-0 group-hover:opacity-100 animate-float transition-opacity duration-300" />
                </div>
                
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1 group-hover:gradient-text transition-all duration-300">{profile.name}</h3>
                      <p className="text-muted-foreground text-sm mb-2 group-hover:text-foreground/70 transition-colors">{profile.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 hover-3d">
                          <MapPin className="w-4 h-4 group-hover:text-primary transition-colors" />
                          {profile.location}
                        </div>
                        <div className="flex items-center gap-1 hover-3d">
                          <Briefcase className="w-4 h-4 group-hover:text-secondary transition-colors" />
                          {profile.experience}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-secondary hover-3d">
                      <Star className="w-4 h-4 fill-current animate-scale-pulse" />
                      <span className="text-sm font-medium">4.9</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed group-hover:text-foreground/80 transition-colors">
                    {profile.bio}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {profile.skills.map((skill, skillIndex) => (
                      <Badge 
                        key={skillIndex} 
                        variant="secondary" 
                        className="text-xs hover-3d hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                        style={{ animationDelay: `${skillIndex * 0.1}s` }}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 hover-tilt hover:border-destructive hover:text-destructive transition-all duration-300"
                      onClick={handlePass}
                    >
                      <X className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                      Pass
                    </Button>
                    <Button 
                      variant="hero" 
                      size="sm" 
                      className="flex-1 hover-3d animate-pulse-glow"
                      onClick={handleConnect}
                    >
                      <Heart className="w-4 h-4 mr-2 group-hover:animate-scale-pulse" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12 opacity-0 animate-slide-up" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            <Button 
              variant="hero" 
              size="lg" 
              className="hover-3d animate-pulse-glow group"
              onClick={handleStartMatching}
            >
              Start Matching Now
              <Sparkles className="w-5 h-5 ml-2 group-hover:animate-scale-pulse" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MatchPreview;