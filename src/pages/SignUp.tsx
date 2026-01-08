import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Phone, Mail, User } from "lucide-react";
import { signUpSchema, type SignUpFormData } from "@/lib/validationSchemas";
const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    // Check if user is already logged in and has a profile
    const checkAuthAndProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profile) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    };

    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Defer the async check to avoid deadlock
        setTimeout(() => {
          checkAuthAndProfile(session.user.id);
        }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate input data
      const validatedData = signUpSchema.parse({
        email,
        password,
        confirmPassword,
        fullName
      });
      const redirectUrl = `${window.location.origin}/onboarding`;
      const {
        error
      } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: validatedData.fullName
          }
        }
      });
      if (error) throw error;
      toast({
        title: "Account Created!",
        description: "Please check your email to confirm your account."
      });
      navigate('/onboarding');
    } catch (error: any) {
      if (error.issues) {
        // Zod validation errors
        const firstError = error.issues[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleSocialAuth = async (provider: 'google' | 'linkedin_oidc' | 'azure') => {
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/onboarding`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handlePhoneAuth = () => {
    toast({
      title: "Phone Authentication",
      description: "Phone authentication will be available soon!"
    });
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,191,165,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(28,61,90,0.1),transparent_50%)]" />
      
      <Card className="w-full max-w-md hover-tilt relative bg-card/80 backdrop-blur-sm border-accent/20 shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center animate-float">
            <span className="text-2xl font-bold text-white">LX</span>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">Join Lexach Now 🤟🏻</CardTitle>
            <CardDescription className="text-muted-foreground">
              Create your account and start finding co-founders
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button onClick={() => handleSocialAuth('google')} variant="outline" className="w-full hover-3d transition-all duration-300" size="lg">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </Button>

            

            

            <Button onClick={handlePhoneAuth} variant="outline" className="w-full hover-3d transition-all duration-300" size="lg">
              <Phone className="w-5 h-5 mr-2" />
              Sign up with Phone Number
            </Button>
          </div>

          <div className="relative">
            <Separator className="my-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-card px-4 text-muted-foreground text-sm">Or continue with Email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="fullName" type="text" placeholder="Enter your full name" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-10 hover-tilt" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 hover-tilt" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Create a password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} className="hover-tilt" required minLength={6} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="hover-tilt" required />
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full hover-3d transition-all duration-300 bg-accent text-base">
              {loading ? "Creating account..." : "Get Started"}
            </Button>
          </form>

          {/* Language Toggle (Optional) */}
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Globe className="w-4 h-4 mr-1" />
            <span>English</span>
          </div>

          {/* Small Login Link */}
          <div className="text-center pt-4 border-t border-border/20">
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-accent hover:text-accent/80 underline font-medium transition-colors">Sign in</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default SignUp;