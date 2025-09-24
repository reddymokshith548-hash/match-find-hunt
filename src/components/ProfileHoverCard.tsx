import { useState, useRef, useEffect } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Briefcase, Star, Play, Pause } from "lucide-react";

interface ProfileData {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  location?: string;
  experience?: string;
  profile_pic_url?: string;
  interests: string[];
  skills: string[];
  match_score?: number;
  intro_video_url?: string;
  rating?: number;
}

interface ProfileHoverCardProps {
  profile: ProfileData;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

export const ProfileHoverCard = ({ 
  profile, 
  children, 
  side = "top" 
}: ProfileHoverCardProps) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setShowVideo(true);
      if (profile.intro_video_url && videoRef.current) {
        setTimeout(() => {
          videoRef.current?.play();
          setIsVideoPlaying(true);
        }, 300); // Delay for smooth animation
      }
    } else {
      setShowVideo(false);
      setIsVideoPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  };

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

  return (
    <HoverCard openDelay={200} closeDelay={100} onOpenChange={handleOpenChange}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side={side} 
        className="w-80 p-0 border-0 shadow-2xl bg-background/95 backdrop-blur-sm"
        sideOffset={10}
      >
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            {/* Header with Profile Image or Video */}
            <div className="relative h-48 overflow-hidden rounded-t-lg">
              {profile.intro_video_url && showVideo ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    loop
                    muted
                    playsInline
                    poster={profile.profile_pic_url}
                  >
                    <source src={profile.intro_video_url} type="video/mp4" />
                  </video>
                  
                  {/* Video Controls */}
                  <button
                    onClick={toggleVideo}
                    className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-all duration-200"
                  >
                    {isVideoPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ) : (
                <img
                  src={profile.profile_pic_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              
              {/* Match Score Badge */}
              {profile.match_score && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-primary/90 text-primary-foreground font-semibold backdrop-blur-sm">
                    {profile.match_score}% Match
                  </Badge>
                </div>
              )}
            </div>

            {/* Profile Content */}
            <div className="p-4 space-y-4">
              {/* Basic Info */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{profile.name}</h3>
                  {profile.role && (
                    <p className="text-sm text-muted-foreground mb-2">{profile.role}</p>
                  )}
                  
                  {/* Location and Experience */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {profile.location}
                      </div>
                    )}
                    {profile.experience && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {profile.experience}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Rating */}
                {profile.rating && (
                  <div className="flex items-center gap-1 text-secondary">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{profile.rating}</span>
                  </div>
                )}
              </div>

              {/* Full Bio */}
              {profile.bio && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-foreground/80">About</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Full Interests List */}
              {profile.interests.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-foreground/80">Interests</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.map((interest, index) => (
                      <Badge 
                        key={index}
                        variant="secondary" 
                        className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {profile.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-foreground/80">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill, index) => (
                      <Badge 
                        key={index}
                        variant="outline" 
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </HoverCardContent>
    </HoverCard>
  );
};