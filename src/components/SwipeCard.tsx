import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, X, MapPin, Briefcase, Sparkles } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  bio: string;
  role: string;
  skills: string[];
  interests: string[];
  stage: string;
  looking_for: string[];
  profile_pic_url?: string;
  location?: string;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  style?: React.CSSProperties;
}

export default function SwipeCard({ profile, onSwipeLeft, onSwipeRight, style }: SwipeCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    startPosRef.current = { x: clientX, y: clientY };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;
    
    setDragPosition({ x: deltaX, y: deltaY });
    setRotation(deltaX * 0.1);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;

    const threshold = 100;
    
    if (Math.abs(dragPosition.x) > threshold) {
      if (dragPosition.x > 0) {
        // Swipe right - like
        animateSwipeOff(true);
      } else {
        // Swipe left - pass
        animateSwipeOff(false);
      }
    } else {
      // Return to center
      setDragPosition({ x: 0, y: 0 });
      setRotation(0);
    }
    
    setIsDragging(false);
  };

  const animateSwipeOff = (isRight: boolean) => {
    const direction = isRight ? 1000 : -1000;
    setDragPosition({ x: direction, y: dragPosition.y });
    setRotation(direction * 0.1);
    
    setTimeout(() => {
      if (isRight) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }, 300);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDragMove(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragPosition]);

  const opacity = 1 - Math.abs(dragPosition.x) / 500;
  const likeOpacity = Math.max(0, dragPosition.x / 100);
  const nopeOpacity = Math.max(0, -dragPosition.x / 100);

  return (
    <div
      ref={cardRef}
      className="absolute w-full h-full select-none"
      style={{
        transform: `translate(${dragPosition.x}px, ${dragPosition.y}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: isDragging ? 'grabbing' : 'grab',
        ...style,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Card className="h-full overflow-hidden shadow-2xl border-2" style={{ opacity }}>
        {/* Like/Nope Indicators */}
        <div
          className="absolute top-8 right-8 z-10 border-4 border-green-500 text-green-500 font-bold text-3xl px-4 py-2 rotate-12 rounded-lg"
          style={{ opacity: likeOpacity }}
        >
          LIKE
        </div>
        <div
          className="absolute top-8 left-8 z-10 border-4 border-red-500 text-red-500 font-bold text-3xl px-4 py-2 -rotate-12 rounded-lg"
          style={{ opacity: nopeOpacity }}
        >
          NOPE
        </div>

        <CardContent className="p-0 h-full flex flex-col">
          {/* Profile Image */}
          <div className="relative h-2/3 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
            {profile.profile_pic_url ? (
              <img
                src={profile.profile_pic_url}
                alt={profile.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Avatar className="w-48 h-48">
                  <AvatarFallback className="text-6xl">{profile.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Name and Role */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h2 className="text-3xl font-bold mb-1">{profile.name}</h2>
              <div className="flex items-center gap-2 text-lg mb-2">
                <Briefcase className="w-5 h-5" />
                <span>{profile.role}</span>
              </div>
              {profile.location && (
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="h-1/3 p-6 overflow-y-auto">
            {profile.bio && (
              <p className="text-sm mb-4 leading-relaxed">{profile.bio}</p>
            )}
            
            {profile.stage && (
              <div className="mb-3">
                <Badge variant="secondary" className="mb-2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {profile.stage}
                </Badge>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">SKILLS</h4>
                <div className="flex flex-wrap gap-1">
                  {profile.skills.slice(0, 5).map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {profile.skills.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{profile.skills.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {profile.looking_for && profile.looking_for.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">LOOKING FOR</h4>
                <div className="flex flex-wrap gap-1">
                  {profile.looking_for.map((item, idx) => (
                    <Badge key={idx} variant="default" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
