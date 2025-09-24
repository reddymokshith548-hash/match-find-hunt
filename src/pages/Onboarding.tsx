import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
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

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          user_id: user.id,
          ...formData
        }]);

      if (error) throw error;

      toast({
        title: "Profile created successfully!",
        description: "Welcome to FindBaee. Let's find your perfect match!",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-card">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold gradient-text">
            Welcome to FindBaee
          </CardTitle>
          <p className="text-muted-foreground">
            Step {step} of 3 - Let's build your profile
          </p>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full ${
                    i <= step ? 'bg-primary' : 'bg-muted'
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
                <Label htmlFor="profile_pic">Profile Picture URL (Optional)</Label>
                <Input
                  id="profile_pic"
                  value={formData.profile_pic_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, profile_pic_url: e.target.value }))}
                  placeholder="https://example.com/your-photo.jpg"
                  className="hover-tilt"
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
                onClick={handleSubmit}
                disabled={!isStepValid() || loading}
                variant="hero"
              >
                {loading ? 'Creating...' : 'Complete Profile'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}