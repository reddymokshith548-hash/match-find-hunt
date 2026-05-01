import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, Save, Sparkles, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import FounderSync from '@/components/FounderSync';

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showFounderSync, setShowFounderSync] = useState(false);
  const [founderSyncCompleted, setFounderSyncCompleted] = useState(false);
  const [founderSyncResults, setFounderSyncResults] = useState<any>(null);

  // Notification preferences
  const [emailNewMatch, setEmailNewMatch] = useState(true);
  const [emailNewMessage, setEmailNewMessage] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchFounderSyncResults();
      fetchNotificationPrefs();
    }
  }, [user]);

  // Check if we should open FounderSync directly
  useEffect(() => {
    if (searchParams.get('foundersync') === 'true') {
      setShowFounderSync(true);
    }
  }, [searchParams]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setName(data.name || '');
        setEmail(user.email || '');
        setRole(data.role || '');
        setLocation(data.location || '');
        setBio(data.bio || '');
        setGender(data.gender || '');
        setProfilePicUrl(data.profile_pic_url || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    }
  };

  const fetchFounderSyncResults = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('foundersync_results')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFounderSyncCompleted(true);
        setFounderSyncResults(data);
      }
    } catch (error) {
      console.error('Error fetching FounderSync results:', error);
    }
  };

  const fetchNotificationPrefs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setEmailNewMatch(data.email_new_match);
      setEmailNewMessage(data.email_new_message);
    }
  };

  const updateNotificationPref = async (
    field: 'email_new_match' | 'email_new_message',
    value: boolean,
  ) => {
    if (!user) return;
    if (field === 'email_new_match') setEmailNewMatch(value);
    else setEmailNewMessage(value);
    setSavingPrefs(true);
    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: user.id,
          email_new_match: field === 'email_new_match' ? value : emailNewMatch,
          email_new_message: field === 'email_new_message' ? value : emailNewMessage,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    setSavingPrefs(false);
    if (error) {
      toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
      // revert
      if (field === 'email_new_match') setEmailNewMatch(!value);
      else setEmailNewMessage(!value);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const tempUrl = URL.createObjectURL(file);
      setProfilePicUrl(tempUrl);
      toast({
        title: "Photo uploaded",
        description: "Profile picture updated successfully"
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          role,
          location,
          bio,
          gender,
          profile_pic_url: profilePicUrl
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all password fields",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully"
      });

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFounderSyncComplete = () => {
    setShowFounderSync(false);
    setFounderSyncCompleted(true);
    fetchFounderSyncResults();
    toast({
      title: "FounderSync Complete",
      description: "Your compatibility profile has been updated."
    });
  };

  if (showFounderSync) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center">
            <Button variant="ghost" onClick={() => setShowFounderSync(false)} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
            <h1 className="text-2xl font-bold gradient-text">FounderSync Assessment</h1>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <FounderSync 
            onComplete={handleFounderSyncComplete}
            showSkip={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold gradient-text">Settings</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* FounderSync Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>FounderSync</CardTitle>
            </div>
            <CardDescription>
              Your co-founder compatibility assessment helps us find better matches for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {founderSyncCompleted ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Assessment Completed</span>
                </div>
                {founderSyncResults && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{founderSyncResults.personality_type}</Badge>
                    <Badge variant="outline">{founderSyncResults.leadership_style} Leader</Badge>
                    <Badge variant="outline">{founderSyncResults.risk_tolerance} Risk</Badge>
                  </div>
                )}
                <Button variant="outline" onClick={() => setShowFounderSync(true)}>
                  Retake Assessment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You haven't completed the FounderSync assessment yet. Take it now to get better co-founder recommendations.
                </p>
                <Button onClick={() => setShowFounderSync(true)} variant="hero">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Take Assessment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profilePicUrl} />
                <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <Button variant="outline" disabled={uploading} asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <p className="text-sm text-muted-foreground mt-2">Max file size: 5MB</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled className="bg-muted" />
              <p className="text-sm text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-Binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g., Founder, Developer" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={4} maxLength={300} />
              <p className="text-sm text-muted-foreground">{bio.length}/300 characters</p>
            </div>

            <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">Old Password</Label>
              <Input id="old-password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Enter old password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
            </div>
            <Button onClick={handleChangePassword} disabled={loading} className="w-full" variant="secondary">
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
