import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Phone, Mail } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/validationSchemas";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input data
      const validatedData = loginSchema.parse({ email, password });
      
      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });
      if (error) throw error;
      toast({ title: "Welcome back!", description: "You've successfully signed in." });
      navigate('/dashboard');
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
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'linkedin_oidc' | 'azure') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePhoneAuth = () => {
    toast({
      title: "Phone Authentication",
      description: "Phone authentication will be available soon!",
    });
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      toast({
        title: "Password Reset",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,191,165,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(28,61,90,0.1),transparent_50%)]" />
      
      <Card className="w-full max-w-md hover-tilt relative bg-card/80 backdrop-blur-sm border-accent/20 shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center animate-float">
            <span className="text-2xl font-bold text-white">FB</span>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to your FindBaee account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => handleSocialAuth('google')}
              variant="outline"
              className="w-full hover-3d transition-all duration-300"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Login with Google
            </Button>

            <Button
              onClick={() => handleSocialAuth('linkedin_oidc')}
              variant="outline"
              className="w-full hover-3d transition-all duration-300"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="#0A66C2" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Login with LinkedIn
            </Button>

            <Button
              onClick={() => handleSocialAuth('azure')}
              variant="outline"
              className="w-full hover-3d transition-all duration-300"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="#00A4EF" viewBox="0 0 24 24">
                <path d="M12 0L1.608 4.8v14.4L12 24l10.392-4.8V4.8L12 0zm5.376 17.28H9.024L16.8 6.72h-4.224l-2.304 3.456L8.064 6.72H3.84l8.256 12.096H7.68l2.112-3.456z"/>
              </svg>
              Login with Microsoft
            </Button>

            <Button
              onClick={handlePhoneAuth}
              variant="outline"
              className="w-full hover-3d transition-all duration-300"
              size="lg"
            >
              <Phone className="w-5 h-5 mr-2" />
              Login with Phone Number
            </Button>
          </div>

          <div className="relative">
            <Separator className="my-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-card px-4 text-muted-foreground text-sm">Or continue with Email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 hover-tilt"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="hover-tilt"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full hover-3d transition-all duration-300 bg-primary"
              disabled={loading}
              size="lg"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={handleForgotPassword}
              className="text-sm text-primary hover:text-primary/80 transition-colors underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Language Toggle (Optional) */}
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Globe className="w-4 h-4 mr-1" />
            <span>English</span>
          </div>

          {/* Small Sign Up Link */}
          <div className="text-center pt-4 border-t border-border/20">
            <p className="text-xs text-muted-foreground">
              Don't have an account?{" "}
              <Link 
                to="/signup" 
                className="text-primary hover:text-primary/80 underline font-medium transition-colors"
              >
                sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;