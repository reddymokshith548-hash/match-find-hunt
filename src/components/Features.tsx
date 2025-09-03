import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Users, MessageCircle, Star, Zap, Shield } from "lucide-react";

const Features = () => {
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
    <section className="py-24 bg-accent/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Why Choose <span className="gradient-text">FindBaee</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We've built the most comprehensive platform for entrepreneurs to find, 
            connect, and collaborate with their ideal co-founders.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              variant="glass" 
              className="group hover:shadow-xl transition-smooth border-white/30"
            >
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
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