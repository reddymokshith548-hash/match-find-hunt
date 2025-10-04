import { useState, useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";

const About = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play();
        setIsVideoPlaying(true);
      }
    }
  };

  const teamMembers = [
    {
      name: "P. Mokshith Reddy",
      bio: "Hallo I'm Mokshith Reddy Pondugula, a 15-year-old entrepreneur and the architect behind Lexach's digital infrastructure. I design intuitive user interfaces, manage scalable back-end systems, and integrate AI models seamlessly to make our platform smarter and more useful for our community. With a meticulous eye for detail and a high-level focus on performance, I ensure Lexach runs smoothly today and is ready to grow for tomorrow.\n\nBeyond technology, I'm passionate about empowering founders to connect, collaborate, and bring their ideas to life. Lexach isn't just a platform—it's a vision to make the startup journey simpler, smarter, and more connected. Building the brains behind brilliant ideas.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "Puranjay Mahindrakar",
      bio: "Konnichiwa I'm Puranjay Mahindrakar, a 15-year-old entrepreneur driven by a passion for technology and AI. At this age, I'm leading Lexach, a platform designed to help founders find their perfect co-founders, collaborators, mentors, and investors streamlining the startup journey.\n\nIn my role, I actively contribute across all domains—technology, marketing, finance, and strategy—ensuring every facet of the project thrives. My approach is hands on, collaborative, and relentlessly focused on delivering value.\n\nLexach is more than just a platform; it's a vision to empower founders, foster collaboration, and transform ideas into successful ventures. Connecting visionaries, building futures.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "Tanujj Gangadeb",
      bio: "Hello reader! I'm Tanujj Gangadeb, a 15-year-old entrepreneur, absolutely intrigued by the world of entrepreneurship, startups and technology. With a love and passion to solve real world problems, I like being behind the cockpit of solutions, just like here in Lexach, which is here to be your best friend while building something of your dreams by getting you your desired connections, mentorship, and capital, all under the magic of AI matchmaking!\n\nI look over the regular overall operations like R&D, Strategy planning, Business Development and content writing with pitch and outreach being my forte! I try to bring utility to the table and provide whatever is needed. With the belief that age should not limit impact, I am here with an aspiration to make great things happen!",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "G.V. Sashagna Naidu",
      bio: "Coming soon...",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
      placeholder: true
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-primary/5 rounded-full blur-3xl transition-all duration-1000"
          style={{
            left: `${mousePosition.x * 100}%`,
            top: `${mousePosition.y * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        <div 
          className="absolute w-64 h-64 bg-secondary/5 rounded-full blur-3xl transition-all duration-1500"
          style={{
            left: `${(1 - mousePosition.x) * 100}%`,
            top: `${(1 - mousePosition.y) * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      {/* Geometric Grid Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-7xl mx-auto">
          {/* Main Title */}
          <h1 className="text-8xl md:text-9xl lg:text-[12rem] font-black tracking-tighter mb-8 opacity-0 animate-slide-up">
            <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              ABOUT
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse-glow">
              US
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-300 font-light tracking-wide mb-16 opacity-0 animate-slide-up max-w-4xl mx-auto" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            Lexach is the meeting point of vision and opportunity.
          </p>

          {/* Video Section */}
          <div className="relative w-full max-w-6xl mx-auto opacity-0 animate-slide-up" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
            <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
              {/* Video Placeholder */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=675&fit=crop"
                loop
                muted
                playsInline
              >
                <source src="/placeholder-video.mp4" type="video/mp4" />
              </video>
              
              {/* Video Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
              
              {/* Play Button */}
              <button
                onClick={toggleVideo}
                className="absolute inset-0 flex items-center justify-center group"
              >
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
                  {isVideoPlaying ? (
                    <Pause className="w-8 h-8 text-white ml-0" />
                  ) : (
                    <Play className="w-8 h-8 text-white ml-1" />
                  )}
                </div>
              </button>

              {/* Video Label */}
              <div className="absolute bottom-6 left-6">
                <span className="text-white/80 text-sm font-medium tracking-wide">
                  TEAM COMMITMENT VIDEO
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 animate-slide-up" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-white to-transparent animate-pulse" />
        </div>
      </section>

      {/* Company Overview Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        {/* Section Divider */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="space-y-8 text-lg md:text-xl leading-relaxed text-gray-300 opacity-0 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <p>
              Founded by four co-founders who believe India's startup ecosystem deserves a sharper edge, we are building a platform that does more than connect—it <span className="text-white font-medium">curates</span>.
            </p>
            
            <p>
              At our core, Lexach is designed to match entrepreneurs, innovators, and creators with the partners, resources, and ventures that align with their ambitions. In a landscape crowded with noise, we bring <span className="text-primary font-medium">clarity</span>: the right profile meets the right opportunity, at the right moment.
            </p>
            
            <p>
              We are not just shaping connections—we are <span className="text-secondary font-medium">shaping culture</span>. By rethinking how startups discover and collaborate, Lexach is setting a new standard for how India builds.
            </p>
            
            <p className="text-white font-medium">
              Precision in design, intelligence in matching, and purpose in every detail—this is the ethos that drives us.
            </p>
            
            <p className="text-2xl md:text-3xl font-light text-white pt-8">
              Our mission is simple: to <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-medium">empower the bold</span>. With Lexach, startups don't just find partners—they find their future.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        {/* Section Divider */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-20 opacity-0 animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                THE TEAM
              </span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-primary to-secondary mx-auto" />
          </div>

          {/* Team Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={member.name}
                className="group opacity-0 animate-slide-up"
                style={{ 
                  animationDelay: `${0.2 + index * 0.1}s`, 
                  animationFillMode: 'forwards' 
                }}
              >
                <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 h-full transition-all duration-500 hover:bg-gray-800/50 hover:border-gray-700 hover:transform hover:scale-105">
                  {/* Member Image */}
                  <div className="relative mb-6">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-primary transition-all duration-300">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    {member.placeholder && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Member Name */}
                  <h3 className="text-xl font-semibold text-white mb-4 text-center group-hover:text-primary transition-colors duration-300">
                    {member.name}
                  </h3>

                  {/* Member Bio */}
                  <div className="text-sm text-gray-400 leading-relaxed space-y-3">
                    {member.bio.split('\n\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="group-hover:text-gray-300 transition-colors duration-300">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-12" />
          <div className="text-center">
            <p className="text-gray-500 text-sm tracking-wide">
              LEXACH — WHERE VISION MEETS OPPORTUNITY
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;