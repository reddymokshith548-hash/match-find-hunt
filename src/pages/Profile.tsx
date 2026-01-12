import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Brain, 
  Target, 
  Flame, 
  MapPin, 
  Briefcase, 
  Sparkles,
  RefreshCw,
  Users,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import FounderSyncHistory from '@/components/FounderSyncHistory';

interface ProfileData {
  id: string;
  name: string;
  bio: string | null;
  role: string | null;
  location: string | null;
  skills: string[] | null;
  interests: string[] | null;
  stage: string | null;
  profile_pic_url: string | null;
}

interface FounderSyncData {
  personality_type: string | null;
  leadership_style: string | null;
  risk_tolerance: string | null;
  completed_at: string;
}

const traitLabels: Record<string, Record<string, { label: string; description: string; color: string; icon: string }>> = {
  personality_type: {
    analytical: { label: 'Analytical', description: 'Data-driven decision maker who values logic and structure', color: 'bg-blue-500', icon: '🔬' },
    visionary: { label: 'Visionary', description: 'Big-picture thinker focused on long-term direction', color: 'bg-purple-500', icon: '🔮' },
    executional: { label: 'Executional', description: 'Action-oriented doer who drives results', color: 'bg-orange-500', icon: '⚡' },
    Analytical: { label: 'Analytical', description: 'Data-driven decision maker who values logic and structure', color: 'bg-blue-500', icon: '🔬' },
    Visionary: { label: 'Visionary', description: 'Big-picture thinker focused on long-term direction', color: 'bg-purple-500', icon: '🔮' },
    Executor: { label: 'Executor', description: 'Action-oriented doer who drives results', color: 'bg-orange-500', icon: '⚡' },
  },
  leadership_style: {
    strategist: { label: 'Strategist', description: 'Plans carefully and directs with precision', color: 'bg-indigo-500', icon: '♟️' },
    operator: { label: 'Operator', description: 'Drives execution and maintains momentum', color: 'bg-green-500', icon: '🚀' },
    collaborator: { label: 'Collaborator', description: 'Builds consensus and inspires teamwork', color: 'bg-cyan-500', icon: '🤝' },
    Structured: { label: 'Structured', description: 'Plans carefully and directs with precision', color: 'bg-indigo-500', icon: '♟️' },
    Inspirational: { label: 'Inspirational', description: 'Motivates through vision and purpose', color: 'bg-cyan-500', icon: '✨' },
    'Action-Oriented': { label: 'Action-Oriented', description: 'Drives execution and maintains momentum', color: 'bg-green-500', icon: '🚀' },
  },
  risk_tolerance: {
    low: { label: 'Cautious', description: 'Prefers certainty and careful analysis', color: 'bg-slate-500', icon: '🛡️' },
    medium: { label: 'Balanced', description: 'Weighs options carefully before acting', color: 'bg-amber-500', icon: '⚖️' },
    high: { label: 'Bold', description: 'Embraces uncertainty and acts quickly', color: 'bg-red-500', icon: '🔥' },
    Conservative: { label: 'Conservative', description: 'Prefers certainty and careful analysis', color: 'bg-slate-500', icon: '🛡️' },
    Strategic: { label: 'Strategic', description: 'Weighs options carefully before acting', color: 'bg-amber-500', icon: '⚖️' },
    Adaptive: { label: 'Adaptive', description: 'Embraces uncertainty and acts quickly', color: 'bg-red-500', icon: '🔥' },
  },
};

const getTraitInfo = (traitType: string, value: string | null) => {
  if (!value) return null;
  const map = traitLabels[traitType];
  return map?.[value] || { label: value, description: '', color: 'bg-gray-500', icon: '❓' };
};

const TraitCard = ({ 
  icon: Icon, 
  title, 
  value, 
  traitType 
}: { 
  icon: React.ElementType;
  title: string;
  value: string | null;
  traitType: string;
}) => {
  const info = getTraitInfo(traitType, value);
  
  if (!info) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-4 text-center">
          <Icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">Not assessed</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className={`h-1 ${info.color}`} />
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{info.icon}</div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="font-semibold mt-0.5">{info.label}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{info.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Profile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [founderSync, setFounderSync] = useState<FounderSyncData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user, id]);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Determine if viewing own profile or someone else's
      const profileUserId = id || user.id;
      const viewing = !id || id === user.id;
      setIsOwnProfile(viewing);

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq(viewing ? 'user_id' : 'id', profileUserId)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch FounderSync data (only for own profile)
      if (viewing) {
        const { data: fsData, error: fsError } = await supabase
          .from('foundersync_results')
          .select('personality_type, leadership_style, risk_tolerance, completed_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fsError) throw fsError;
        setFounderSync(fsData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="grid gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">This profile doesn't exist or you don't have permission to view it.</p>
            <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold gradient-text">
            {isOwnProfile ? 'My Profile' : profile.name}
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                <AvatarImage src={profile.profile_pic_url || undefined} />
                <AvatarFallback className="text-2xl">{profile.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                {profile.role && (
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Briefcase className="w-4 h-4" />
                    {profile.role}
                  </p>
                )}
                {profile.location && (
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </p>
                )}
                {profile.bio && (
                  <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>
                )}

                {/* Skills */}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {profile.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                    Edit Profile
                  </Button>
                  {!founderSync && (
                    <Button variant="hero" size="sm" onClick={() => navigate('/settings?foundersync=true')}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Take FounderSync
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* FounderSync Traits (only for own profile) */}
        {isOwnProfile && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle>FounderSync Profile</CardTitle>
                  </div>
                  {founderSync && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/settings?foundersync=true')}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retake
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {founderSync 
                    ? 'Your co-founder compatibility traits based on FounderSync assessment'
                    : 'Complete FounderSync to discover your co-founder compatibility traits'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {founderSync ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    <TraitCard
                      icon={Brain}
                      title="Thinking Style"
                      value={founderSync.personality_type}
                      traitType="personality_type"
                    />
                    <TraitCard
                      icon={Target}
                      title="Leadership Style"
                      value={founderSync.leadership_style}
                      traitType="leadership_style"
                    />
                    <TraitCard
                      icon={Flame}
                      title="Risk Tolerance"
                      value={founderSync.risk_tolerance}
                      traitType="risk_tolerance"
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Discover Your Co-Founder Style</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                      Take the 10-question FounderSync assessment to understand your thinking, leadership, and risk preferences.
                    </p>
                    <Button variant="hero" onClick={() => navigate('/settings?foundersync=true')}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start FounderSync
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compatibility Insights */}
            {founderSync && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle>What This Means For Matches</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        You Work Well With
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {getCompatibilityRecommendations(founderSync).good.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Consider Carefully
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {getCompatibilityRecommendations(founderSync).consider.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trait History */}
            <FounderSyncHistory />
          </>
        )}
      </div>
    </div>
  );
}

function getCompatibilityRecommendations(fs: FounderSyncData): { good: string[]; consider: string[] } {
  const good: string[] = [];
  const consider: string[] = [];

  // Thinking style recommendations
  const thinking = fs.personality_type?.toLowerCase();
  if (thinking === 'analytical' || thinking === 'analyst') {
    good.push('Visionaries who can dream big while you validate');
    good.push('Executors who can act on your analysis');
    consider.push('Another analytical type might slow decision-making');
  } else if (thinking === 'visionary') {
    good.push('Analytical types who can ground your ideas');
    good.push('Executors who can bring your vision to life');
    consider.push('Two visionaries may struggle with execution');
  } else if (thinking === 'executional' || thinking === 'executor') {
    good.push('Visionaries who can set the direction');
    good.push('Analytical types who can optimize your efforts');
    consider.push('Two executors may lack strategic alignment');
  }

  // Leadership style recommendations
  const leadership = fs.leadership_style?.toLowerCase();
  if (leadership === 'strategist' || leadership === 'structured') {
    good.push('Operators who can execute your strategies');
  } else if (leadership === 'operator' || leadership === 'action-oriented') {
    good.push('Strategists who can provide direction');
  } else if (leadership === 'collaborator' || leadership === 'inspirational') {
    good.push('Both operators and strategists benefit from your cohesion');
  }

  // Risk tolerance recommendations
  const risk = fs.risk_tolerance?.toLowerCase();
  if (risk === 'low' || risk === 'conservative') {
    good.push('Someone with medium risk tolerance for balance');
    consider.push('Another low-risk partner may miss opportunities');
  } else if (risk === 'high' || risk === 'adaptive') {
    good.push('Someone more cautious to balance your boldness');
    consider.push('Two high-risk takers may overlook dangers');
  }

  return { good, consider };
}
