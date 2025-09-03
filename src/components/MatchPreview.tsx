import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, Briefcase, Star } from "lucide-react";

const MatchPreview = () => {
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
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            See How <span className="gradient-text">Matching</span> Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover compatible co-founders with detailed profiles, compatibility scores, 
            and smart recommendations based on your goals.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {mockProfiles.map((profile) => (
              <Card key={profile.id} variant="match" className="overflow-hidden">
                <div className="relative">
                  <img 
                    src={profile.image} 
                    alt={profile.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-secondary text-secondary-foreground font-semibold">
                      {profile.compatibility}% Match
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{profile.name}</h3>
                      <p className="text-muted-foreground text-sm mb-2">{profile.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {profile.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {profile.experience}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-secondary">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">4.9</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {profile.bio}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      <X className="w-4 h-4 mr-2" />
                      Pass
                    </Button>
                    <Button variant="hero" size="sm" className="flex-1">
                      <Heart className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="hero" size="lg">
              Start Matching Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MatchPreview;