import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Briefcase, Eye, Heart } from "lucide-react";

export interface PeekProfile {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  location?: string;
  experience?: string;
  skills?: string[];
  interests?: string[];
  match_score?: number;
  profile_pic_url?: string;
}

interface Props {
  profile: PeekProfile | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenFull?: (id: string) => void;
  onConnect?: (profile: PeekProfile) => void;
}

/**
 * Lightweight, enlarged preview shown on long-press. Distinct from the full
 * profile page – just the essentials at a glance.
 */
export default function ProfilePeekDialog({ profile, open, onOpenChange, onOpenFull, onConnect }: Props) {
  if (!profile) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="relative h-56 w-full bg-muted">
          {profile.profile_pic_url ? (
            <img src={profile.profile_pic_url} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-3xl">{profile.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          {typeof profile.match_score === "number" && (
            <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
              {Math.round(profile.match_score)}% match
            </Badge>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-2xl font-semibold leading-tight">{profile.name}</h3>
            {profile.role && <p className="text-sm text-muted-foreground">{profile.role}</p>}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {profile.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
            )}
            {profile.experience && (
              <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{profile.experience}</span>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm text-foreground/90 line-clamp-4">{profile.bio}</p>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.slice(0, 8).map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.slice(0, 6).map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenFull?.(profile.id)}>
              <Eye className="w-4 h-4 mr-1.5" /> Full profile
            </Button>
            {onConnect && (
              <Button variant="hero" className="flex-1" onClick={() => onConnect(profile)}>
                <Heart className="w-4 h-4 mr-1.5" /> Connect
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}