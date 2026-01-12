import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { profileSchema } from '@/lib/validationSchemas';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import FounderSync from '@/components/FounderSync';

const SKILLS_OPTIONS = [
  'React', 'JavaScript', 'Python', 'Marketing', 'Design', 'Product Management',
  'Finance', 'Sales', 'Data Science', 'Machine Learning', 'Blockchain',
  'Mobile Development', 'DevOps', 'UX/UI Design', 'Business Development'
];

const INTERESTS_OPTIONS = [
  'Tech', 'AI', 'Sustainability', 'Social Impact', 'Healthcare', 'Fintech',
  'E-commerce', 'Education', 'Gaming', 'Crypto', 'Web3', 'IoT', 'Robotics'
];

const LOOKING_FOR_OPTIONS = [
  'Co-Founder', 'Mentor', 'Investor', 'Team Members', 'Advisor', 'Partner'
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showFounderSync, setShowFounderSync] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false);

  // Check if user already has a profile
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) {
        setCheckingProfile(false);
        return;
      }
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (profile) {
          // User already has a profile, redirect to dashboard
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      }
      
      setCheckingProfile(false);
    };

    if (!authLoading) {
      checkExistingProfile();
    }
  }, [user, authLoading, navigate]);
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    role: '',
    skills: [] as string[],
    interests: [] as string[],
    stage: '',
    looking_for: [] as string[],
    profile_pic_url: ''
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const addTag = (field: 'skills' | 'interests' | 'looking_for', value: string) => {
    if (!formData[field].includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value]
      }));
    }
  };

  const removeTag = (field: 'skills' | 'interests' | 'looking_for', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }));
  };

  const handleSubmitProfile = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create your profile.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    setLoading(true);
    try {
      // Validate form data
      const validatedData = profileSchema.parse(formData);
      
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          name: validatedData.name,
          bio: validatedData.bio,
          role: validatedData.role,
          skills: validatedData.skills,
          interests: validatedData.interests,
          stage: validatedData.stage,
          looking_for: validatedData.looking_for,
          profile_pic_url: validatedData.profile_pic_url || null
        });

      if (error) throw error;

      setProfileCreated(true);
      setShowFounderSync(true);
    } catch (error: any) {
      if (error.issues) {
        // Zod validation errors
        const firstError = error.issues[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save profile. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFounderSyncComplete = () => {
    toast({
      title: "Profile created successfully!",
      description: "Welcome to Lexach. Let's find your perfect co-founder!",
    });
    navigate('/dashboard');
  };

  const handleFounderSyncSkip = () => {
    toast({
      title: "Profile created!",
      description: "You can take the FounderSync assessment anytime from Settings.",
    });
    navigate('/dashboard');
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name.trim() !== '' && formData.bio.trim() !== '';
      case 2:
        return formData.role !== '' && formData.skills.length > 0 && formData.interests.length > 0;
      case 3:
        return formData.stage !== '' && formData.looking_for.length > 0;
      default:
        return false;
    }
  };

  // Show loading while checking auth or profile
  if (authLoading || checkingProfile) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to complete your profile.</p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show FounderSync after profile is created
  if (showFounderSync) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <FounderSync 
          onComplete={handleFounderSyncComplete}
          onSkip={handleFounderSyncSkip}
          showSkip={true}
        />
      </div>
    );
  }

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-card">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold gradient-text">
            Welcome to Lexach
          </CardTitle>
          <p className="text-muted-foreground">
            Step {step} of {totalSteps} - Let's build your profile
          </p>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full ${
                    i < step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="hover-tilt"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio *</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself in a few sentences..."
                  rows={3}
                  className="hover-tilt"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_pic">Profile Picture</Label>
                <ProfilePictureUpload
                  currentUrl={formData.profile_pic_url}
                  onUploadComplete={(url) => setFormData(prev => ({ ...prev, profile_pic_url: url }))}
                  userName={formData.name}
                />
              </div>
            </div>
          )}

          {/* Step 2: Professional Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Professional Details</h3>
              
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Entrepreneur">Entrepreneur</SelectItem>
                    <SelectItem value="Mentor">Mentor</SelectItem>
                    <SelectItem value="Investor">Investor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Skills & Expertise *</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="cursor-pointer">
                      {skill}
                      <X
                        className="ml-1 h-3 w-3"
                        onClick={() => removeTag('skills', skill)}
                      />
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={(value) => addTag('skills', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add skills" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILLS_OPTIONS.filter(skill => !formData.skills.includes(skill)).map((skill) => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Interests *</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.interests.map((interest) => (
                    <Badge key={interest} variant="outline" className="cursor-pointer">
                      {interest}
                      <X
                        className="ml-1 h-3 w-3"
                        onClick={() => removeTag('interests', interest)}
                      />
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={(value) => addTag('interests', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add interests" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERESTS_OPTIONS.filter(interest => !formData.interests.includes(interest)).map((interest) => (
                      <SelectItem key={interest} value={interest}>{interest}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Startup Journey */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Your Startup Journey</h3>
              
              <div className="space-y-2">
                <Label>Current Stage *</Label>
                <Select value={formData.stage} onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Where are you in your journey?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Idea">💡 Idea Stage</SelectItem>
                    <SelectItem value="Prototype">🔧 Prototype</SelectItem>
                    <SelectItem value="Early Startup">🚀 Early Startup</SelectItem>
                    <SelectItem value="Scaling">📈 Scaling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Looking For *</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.looking_for.map((item) => (
                    <Badge key={item} variant="default" className="cursor-pointer">
                      {item}
                      <X
                        className="ml-1 h-3 w-3"
                        onClick={() => removeTag('looking_for', item)}
                      />
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={(value) => addTag('looking_for', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="What are you looking for?" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOOKING_FOR_OPTIONS.filter(item => !formData.looking_for.includes(item)).map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={step === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                variant="hero"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmitProfile}
                disabled={!isStepValid() || loading}
                variant="hero"
              >
                {loading ? 'Creating...' : 'Continue to FounderSync'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
