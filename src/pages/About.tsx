import { useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const About = () => {
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = sectionsRef.current
      .filter((section): section is HTMLDivElement => section !== null)
      .map((section) => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("animate-slide-up");
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
        className="relative min-h-screen flex flex-col items-center justify-center px-6 py-32 overflow-hidden opacity-0"
        style={{
          background: "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(220 25% 10%) 100%)"
        }}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.15) 1px, transparent 0)",
            backgroundSize: "40px 40px"
          }} />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto text-center space-y-8">
          <h1 className="text-7xl md:text-9xl font-bold tracking-tighter mb-6">
            ABOUT US
          </h1>
          
          <p className="text-2xl md:text-4xl font-light text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Lexach is the meeting point of vision and opportunity.
          </p>
          
          <div className="mt-16 w-full max-w-5xl mx-auto aspect-video bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden hover-3d">
            <video 
              className="w-full h-full object-cover"
              poster="/placeholder.svg"
              controls
            >
              <source src="" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
      </section>

      {/* Company Manifesto */}
      <section 
        ref={(el) => { if (el) sectionsRef.current[1] = el as HTMLDivElement; }}
        className="relative px-6 py-32 opacity-0"
      >
        <div className="max-w-5xl mx-auto">
          <div className="space-y-8 text-lg md:text-xl leading-relaxed text-foreground/90">
            <p>
              Founded by four co-founders who believe India's startup ecosystem deserves a sharper edge, we are building a platform that does more than connect—it curates.
            </p>
            
            <p>
              At our core, Lexach is designed to match entrepreneurs, innovators, and creators with the partners, resources, and ventures that align with their ambitions. In a landscape crowded with noise, we bring clarity: the right profile meets the right opportunity, at the right moment.
            </p>
            
            <p>
              We are not just shaping connections—we are shaping culture. By rethinking how startups discover and collaborate, Lexach is setting a new standard for how India builds.
            </p>
            
            <p className="font-semibold">
              Precision in design, intelligence in matching, and purpose in every detail—this is the ethos that drives us.
            </p>
            
            <p className="text-2xl md:text-3xl font-bold gradient-text pt-8">
              Our mission is simple: to empower the bold. With Lexach, startups don't just find partners—they find their future.
            </p>
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section 
        ref={(el) => { if (el) sectionsRef.current[2] = el as HTMLDivElement; }}
        className="relative px-6 py-32 opacity-0"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-bold text-center mb-20 tracking-tight">
            THE ARCHITECTS
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {founders.map((founder, index) => (
              <div
                key={index}
                className="group relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 md:p-10 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/50"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative space-y-6">
                  <div className="w-full aspect-square bg-muted/50 rounded-xl overflow-hidden mb-6">
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-6xl font-bold">
                        {founder.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold">
                    {founder.name}
                  </h3>
                  
                  <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
                    {founder.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
