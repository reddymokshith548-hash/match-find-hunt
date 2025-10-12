import { useEffect, useRef, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Users, Rocket, Target } from "lucide-react";

const About = () => {
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observers = sectionsRef.current
      .filter((section): section is HTMLDivElement => section !== null)
      .map((section) => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.remove("opacity-0", "translate-y-20");
                entry.target.classList.add("opacity-100", "translate-y-0");
              }
            });
          },
          { threshold: 0.1 }
        );
        
        observer.observe(section);
        return observer;
      });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const founders = [
    {
      name: "P. Mokshith Reddy",
      bio: "Hallo I'm Mokshith Reddy Pondugula, a 15-year-old entrepreneur and the architect behind Lexach's digital infrastructure. I design intuitive user interfaces, manage scalable back-end systems, and integrate AI models seamlessly to make our platform smarter and more useful for our community. With a meticulous eye for detail and a high-level focus on performance, I ensure Lexach runs smoothly today and is ready to grow for tomorrow. Beyond technology, I'm passionate about empowering founders to connect, collaborate, and bring their ideas to life. Lexach isn't just a platform—it's a vision to make the startup journey simpler, smarter, and more connected. Building the brains behind brilliant ideas."
    },
    {
      name: "Puranjay Mahindrakar",
      bio: "Konnichiwa I'm Puranjay Mahindrakar, a 15-year-old entrepreneur driven by a passion for technology and AI. At this age, I'm leading Lexach, a platform designed to help founders find their perfect co-founders, collaborators, mentors, and investors streamlining the startup journey. In my role, I actively contribute across all domains—technology, marketing, finance, and strategy—ensuring every facet of the project thrives. My approach is hands on, collaborative, and relentlessly focused on delivering value. Lexach is more than just a platform; it's a vision to empower founders, foster collaboration, and transform ideas into successful ventures. Connecting visionaries, building futures."
    },
    {
      name: "Tanujj Gangadeb",
      bio: "Hello reader! I'm Tanujj Gangadeb, a 15-year-old entrepreneur, absolutely intrigued by the world of entrepreneurship, startups and technology. With a love and passion to solve real world problems, I like being behind the cockpit of solutions, just like here in Lexach, which is here to be your best friend while building something of your dreams by getting you your desired connections, mentorship, and capital, all under the magic of AI matchmaking! I look over the regular overall operations like R&D, Strategy planning, Business Development and content writing with pitch and outreach being my forte! I try to bring utility to the table and provide whatever is needed. With the belief that age should not limit impact, I am here with an aspiration to make great things happen!"
    },
    {
      name: "G.V. Sashagna Naidu",
      bio: "I'm G.V. Sashagna Naidu, a 15-year-old entrepreneur with a passion for building and innovating. At Lexach, I focus on turning ideas into real solutions, blending creativity with technology to make an impact. I believe age is never a barrier to ambition — it's all about vision, teamwork, and execution. My journey is just beginning, but my goal is clear: to push boundaries, solve problems, and create products that truly matter."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section - Apple Style */}
      <section 
        ref={(el) => { if (el) sectionsRef.current[0] = el as HTMLDivElement; }}
        className="relative flex flex-col items-center justify-center px-6 py-32 overflow-hidden opacity-0 translate-y-20 transition-all duration-1000 min-h-screen"
        style={{
          transform: `translateY(${scrollY * 0.3}px)`,
        }}
      >
        {/* Gradient Orb Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse-glow"
            style={{ transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.15}px)` }}
          />
          <div 
            className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-pulse-glow"
            style={{ transform: `translate(-${scrollY * 0.1}px, -${scrollY * 0.15}px)` }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
              <span className="block animate-fade-in">About</span>
              <span className="block gradient-text animate-fade-in" style={{ animationDelay: '0.2s' }}>Lexach</span>
            </h1>
            
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-3xl mx-auto animate-fade-in font-light" style={{ animationDelay: '0.4s' }}>
              The meeting point of vision and opportunity.
            </p>
          </div>

          {/* Floating Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {[
              { icon: Users, label: "Co-founders", value: "1000+" },
              { icon: Rocket, label: "Startups", value: "500+" },
              { icon: Target, label: "Matches", value: "2000+" },
              { icon: Sparkles, label: "Success Rate", value: "95%" },
            ].map((stat, i) => (
              <div 
                key={i}
                className="glass-card p-6 rounded-2xl hover-3d"
                style={{ 
                  animationDelay: `${0.8 + i * 0.1}s`,
                  transform: `translateY(${Math.sin(scrollY * 0.01 + i) * 10}px)`
                }}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Manifesto - Scroll Reveal */}
      <section 
        ref={(el) => { if (el) sectionsRef.current[1] = el as HTMLDivElement; }}
        className="relative px-6 py-32 opacity-0 translate-y-20 transition-all duration-1000 overflow-hidden"
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        
        {/* Parallax Lines */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-primary to-transparent"
              style={{
                top: `${20 + i * 15}%`,
                left: 0,
                right: 0,
                transform: `translateX(${scrollY * (0.05 + i * 0.02)}px)`,
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="space-y-8">
            <div className="overflow-hidden">
              <p className="text-lg md:text-2xl leading-relaxed font-light animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Founded by four co-founders who believe India's startup ecosystem deserves a sharper edge, we are building a platform that does more than connect—<span className="gradient-text font-semibold text-2xl md:text-3xl">it curates</span>.
              </p>
            </div>
            
            <div className="overflow-hidden">
              <p className="text-lg md:text-2xl leading-relaxed font-light animate-fade-in" style={{ animationDelay: '0.4s' }}>
                At our core, Lexach is designed to match entrepreneurs, innovators, and creators with the partners, resources, and ventures that align with their ambitions. In a landscape crowded with noise, we bring <span className="gradient-text font-semibold text-2xl md:text-3xl">clarity</span>: the right profile meets the right opportunity, at the right moment.
              </p>
            </div>
            
            <div className="overflow-hidden">
              <p className="text-lg md:text-2xl leading-relaxed font-light animate-fade-in" style={{ animationDelay: '0.6s' }}>
                We are not just shaping connections—we are shaping <span className="gradient-text font-semibold text-2xl md:text-3xl">culture</span>. By rethinking how startups discover and collaborate, Lexach is setting a new standard for how India builds.
              </p>
            </div>
            
            <div className="relative py-8 my-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-2xl" />
              <p className="relative text-xl md:text-3xl font-medium leading-relaxed text-center">
                <span className="gradient-text block mb-2">Precision in design.</span>
                <span className="gradient-text block mb-2">Intelligence in matching.</span>
                <span className="gradient-text block">Purpose in every detail.</span>
              </p>
            </div>
            
            <div className="text-center pt-8 animate-fade-in" style={{ animationDelay: '1s' }}>
              <p className="text-2xl md:text-4xl lg:text-5xl font-bold gradient-text leading-tight">
                Our mission is simple: to empower the bold.
              </p>
              <p className="text-xl md:text-2xl text-muted-foreground mt-4 font-light">
                With Lexach, startups don't just find partners—they find their future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founders Section - Interactive Cards */}
      <section 
        ref={(el) => { if (el) sectionsRef.current[2] = el as HTMLDivElement; }}
        className="relative px-6 py-32 opacity-0 translate-y-20 transition-all duration-1000 bg-gradient-to-b from-background to-primary/5"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold gradient-text animate-fade-in">
              The Architects
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Meet the visionaries building the future of startup collaboration
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {founders.map((founder, index) => (
              <Card
                key={index}
                variant="glass"
                className={`group interactive-card border-primary/20 overflow-hidden backdrop-blur-xl transition-all duration-500 ${
                  hoveredCard === index ? 'z-10 scale-105 shadow-2xl shadow-primary/20' : 'hover:border-primary/40'
                }`}
                style={{ 
                  transform: hoveredCard === index 
                    ? 'scale(1.05) translateY(-10px) rotateX(2deg)' 
                    : `translateY(${Math.sin(scrollY * 0.01 + index) * 5}px)`,
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardContent className="p-6 md:p-8">
                  <div className="flex gap-6 items-start">
                    <div 
                      className={`w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-700 ${
                        hoveredCard === index 
                          ? 'scale-110 shadow-lg shadow-primary/50' 
                          : 'group-hover:scale-105'
                      }`}
                      style={{
                        background: hoveredCard === index 
                          ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' 
                          : 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))',
                      }}
                    >
                      {hoveredCard === index && (
                        <div className="absolute inset-0 bg-primary/20 animate-pulse-glow" />
                      )}
                      <div className={`text-2xl md:text-4xl font-bold z-10 transition-all duration-300 ${
                        hoveredCard === index ? 'text-white scale-110' : 'text-primary'
                      }`}>
                        {founder.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xl md:text-2xl font-bold mb-3 transition-all duration-300 ${
                        hoveredCard === index ? 'gradient-text scale-105' : ''
                      }`}>
                        {founder.name}
                      </h3>
                      
                      <p className={`text-sm md:text-base leading-relaxed text-muted-foreground group-hover:text-foreground/90 transition-all duration-500 ${
                        hoveredCard === index ? 'text-foreground' : 'line-clamp-6'
                      }`}>
                        {founder.bio}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
