import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Users, MessageCircle, Star, Zap, Shield } from "lucide-react";

const Features = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
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
    <section className="py-24 bg-accent/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full animate-float" />
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-secondary/10 rounded-full animate-float-slow" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-primary/5 rounded-full animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 animate-slide-up">
            Why Choose <span className="gradient-text animate-scale-pulse">FindBaee</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto opacity-0 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            We've built the most comprehensive platform for entrepreneurs to find, 
            connect, and collaborate with their ideal co-founders.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-container">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              variant="glass" 
              className={`group interactive-card border-white/30 opacity-0 animate-slide-up ${
                hoveredCard === index ? 'z-10' : ''
              }`}
              style={{ 
                animationDelay: `${index * 0.1}s`, 
                animationFillMode: 'forwards',
                transform: hoveredCard === index ? 'scale(1.05) translateY(-10px)' : ''
              }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 transition-all duration-500 ${
                  hoveredCard === index 
                    ? 'scale-110 animate-pulse-glow' 
                    : 'group-hover:scale-110'
                }`}>
                  <feature.icon className={`w-6 h-6 ${feature.color} transition-all duration-300 ${
                    hoveredCard === index ? 'animate-scale-pulse' : ''
                  }`} />
                </div>
                <CardTitle className="text-xl mb-2 group-hover:gradient-text transition-all duration-300">{feature.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed group-hover:text-foreground/80 transition-colors">
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