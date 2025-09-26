import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause } from "lucide-react";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  const founders = [
    {
      name: "P. Mokshith Reddy",
      bio: "Architect of Lexach's digital infrastructure; backend, UI/UX, AI integration.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "Puranjay Mahindrakar", 
      bio: "Tech + AI lead, hands-on across marketing, finance, and strategy.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "Tanujj Gangadeb",
      bio: "Strategy, business development, R&D, and outreach; believes age doesn't limit impact.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "G.V. Sashagna Naidu",
      bio: "Visionary leader driving innovation and strategic partnerships across the startup ecosystem.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            top: '10%',
            left: '10%'
          }}
        />
        <div 
          className="absolute w-64 h-64 bg-secondary/5 rounded-full blur-3xl"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * 0.01}px)`,
            bottom: '20%',
            right: '15%'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="group hover:bg-white/5 transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Textured Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,191,165,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(28,61,90,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,255,255,0.02)_50%,transparent_51%)] bg-[size:20px_20px]" />
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <h1 className="text-8xl md:text-9xl lg:text-[12rem] font-black tracking-tighter mb-8 opacity-0 animate-slide-up">
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              ABOUT
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse-glow">
              US
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/70 font-light tracking-wide opacity-0 animate-slide-up max-w-3xl mx-auto leading-relaxed" 
             style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            Lexach is the meeting point of vision and opportunity.
          </p>

          {/* Geometric Accent */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-10">
            <div className="w-[800px] h-[800px] border border-white/5 rounded-full animate-pulse" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="relative w-full h-screen overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />
        
        {/* Video Placeholder */}
        <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
          <div className="text-center z-20 relative">
            <div className="w-24 h-24 border-2 border-white/30 rounded-full flex items-center justify-center mb-6 mx-auto hover:border-white/60 transition-all duration-300 cursor-pointer group">
              {isVideoPlaying ? (
                <Pause className="w-8 h-8 text-white/80 group-hover:text-white transition-colors" />
              ) : (
                <Play className="w-8 h-8 text-white/80 group-hover:text-white transition-colors ml-1" />
              )}
            </div>
            <p className="text-white/60 text-sm tracking-widest uppercase">Team Commitment Video</p>
          </div>
          
          {/* Abstract Tech Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(0,191,165,0.1)_50%,transparent_60%)] bg-[size:100px_100px] animate-pulse" />
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Divider */}
          <div className="flex items-center mb-16 opacity-0 animate-slide-up">
            <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent flex-1" />
            <div className="px-8">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent flex-1" />
          </div>

          <div className="text-center opacity-0 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <h2 className="text-5xl md:text-6xl font-bold mb-16 tracking-tight">
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                Our Mission
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl leading-relaxed text-white/80 font-light max-w-5xl mx-auto">
              Founded by four co-founders who believe India's startup ecosystem deserves a sharper edge, 
              <span className="text-primary font-medium"> Lexach is a platform that curates—not just connects</span>. 
              We match entrepreneurs, innovators, and creators with the right partners, mentors, and investors. 
              <span className="text-secondary font-medium"> Precision in design, intelligence in matching, and purpose in every detail</span>—that's the ethos that drives us.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20 opacity-0 animate-slide-up">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight">
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                The Founders
              </span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-primary to-secondary mx-auto" />
          </div>

          {/* Founders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {founders.map((founder, index) => (
              <Card 
                key={founder.name}
                className="group bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden opacity-0 animate-slide-up hover:scale-105 hover:-translate-y-2"
                style={{ 
                  animationDelay: `${0.4 + index * 0.1}s`, 
                  animationFillMode: 'forwards' 
                }}
              >
                <CardContent className="p-8 text-center">
                  {/* Founder Image */}
                  <div className="relative mb-6">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-white/20 group-hover:border-primary/50 transition-all duration-300">
                      <img 
                        src={founder.image} 
                        alt={founder.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    {/* Glow Effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Founder Info */}
                  <h3 className="text-xl font-semibold mb-4 text-white group-hover:text-primary transition-colors duration-300">
                    {founder.name}
                  </h3>
                  
                  <p className="text-white/70 text-sm leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                    {founder.bio}
                  </p>

                  {/* Decorative Element */}
                  <div className="mt-6 w-12 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Geometric Accent */}
      <div className="relative h-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
    </div>
  );
};

export default About;