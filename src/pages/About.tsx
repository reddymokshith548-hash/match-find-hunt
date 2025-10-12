import { useEffect, useRef, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    const observers = sectionsRef.current
      .filter((section): section is HTMLDivElement => section !== null)
      .map((section) => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.remove("opacity-0");
                entry.target.classList.add("opacity-100");
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
      
      {/* Hero Section */}
      <section 
        ref={(el) => { if (el) sectionsRef.current[0] = el as HTMLDivElement; }}
        className="relative flex flex-col items-center justify-center px-6 py-20 overflow-hidden opacity-0 transition-opacity duration-1000"
      >
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            About Us
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Lexach is the meeting point of vision and opportunity.
          </p>
          
          <div className="mt-8 w-full max-w-4xl mx-auto">
            <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="aspect-video bg-muted/30">
                  <video 
                    className="w-full h-full object-cover"
                    poster="/placeholder.svg"
                    controls
                  >
                    <source src="" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Company Manifesto */}
      <section 
        ref={(el) => { if (el) sectionsRef.current[1] = el as HTMLDivElement; }}
        className="relative px-6 py-16 md:py-20 opacity-0 transition-opacity duration-1000 overflow-hidden"
      >
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/95 z-10" />
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-20"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-digital-futuristic-tunnel-with-neon-lines-28888-large.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="max-w-4xl mx-auto relative z-20">
          <div className="space-y-6 md:space-y-8">
            <p className="text-base md:text-lg leading-relaxed text-foreground/90 animate-fade-in">
              Founded by four co-founders who believe India's startup ecosystem deserves a sharper edge, we are building a platform that does more than connect—<span className="gradient-text font-semibold">it curates</span>.
            </p>
            
            <p className="text-base md:text-lg leading-relaxed text-foreground/90 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              At our core, Lexach is designed to match entrepreneurs, innovators, and creators with the partners, resources, and ventures that align with their ambitions. In a landscape crowded with noise, we bring <span className="gradient-text font-semibold">clarity</span>: the right profile meets the right opportunity, at the right moment.
            </p>
            
            <p className="text-base md:text-lg leading-relaxed text-foreground/90 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              We are not just shaping connections—we are shaping <span className="gradient-text font-semibold">culture</span>. By rethinking how startups discover and collaborate, Lexach is setting a new standard for how India builds.
            </p>
            
            <div className="relative py-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-xl" />
              <p className="relative text-base md:text-lg font-semibold text-foreground leading-relaxed">
                <span className="gradient-text">Precision in design, intelligence in matching, and purpose in every detail</span>—this is the ethos that drives us.
              </p>
            </div>
            
            <p className="text-lg md:text-2xl font-bold gradient-text pt-4 animate-fade-in" style={{ animationDelay: '0.8s' }}>
              Our mission is simple: to empower the bold. With Lexach, startups don't just find partners—they find their future.
            </p>
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section 
        ref={(el) => { if (el) sectionsRef.current[2] = el as HTMLDivElement; }}
        className="relative px-6 py-16 md:py-20 opacity-0 transition-opacity duration-1000"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-12 tracking-tight">
            The Architects
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 perspective-container">
            {founders.map((founder, index) => (
              <Card
                key={index}
                variant="glass"
                className={`group interactive-card border-white/30 overflow-hidden ${
                  hoveredCard === index ? 'z-10' : ''
                }`}
                style={{ 
                  transform: hoveredCard === index ? 'scale(1.05) translateY(-10px)' : ''
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex gap-4 items-start">
                    <div className={`w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 transition-all duration-500 ${
                      hoveredCard === index 
                        ? 'scale-110 animate-pulse-glow bg-primary/20' 
                        : 'group-hover:scale-110'
                    }`}>
                      <div className={`text-xl md:text-2xl font-bold transition-all duration-300 ${
                        hoveredCard === index ? 'text-primary animate-scale-pulse' : 'text-primary/70'
                      }`}>
                        {founder.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base md:text-lg font-bold mb-2 transition-all duration-300 ${
                        hoveredCard === index ? 'gradient-text' : ''
                      }`}>
                        {founder.name}
                      </h3>
                      
                      <p className={`text-xs md:text-sm leading-relaxed text-muted-foreground group-hover:text-foreground/80 transition-colors ${
                        hoveredCard === index ? '' : 'line-clamp-6'
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
