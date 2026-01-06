import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account, or sign in directly if email confirmation is disabled.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { text: "Maximize turf slot utilization & revenue" },
    { text: "Track payments & expenses in real-time" },
    { text: "Manage bookings with visual slot calendar" },
    { text: "Complete customer history & analytics" },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-600 via-emerald-500 to-green-600 overflow-hidden">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 p-12 flex-col justify-between relative">
        {/* Sports SVG decorations */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {/* Football */}
          <svg className="absolute top-10 left-10 w-24 h-24" viewBox="0 0 100 100" fill="white">
            <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="3" fill="none"/>
            <polygon points="50,15 65,35 60,55 40,55 35,35" fill="white"/>
            <line x1="50" y1="15" x2="50" y2="5" stroke="white" strokeWidth="2"/>
            <line x1="65" y1="35" x2="80" y2="25" stroke="white" strokeWidth="2"/>
            <line x1="60" y1="55" x2="75" y2="70" stroke="white" strokeWidth="2"/>
            <line x1="40" y1="55" x2="25" y2="70" stroke="white" strokeWidth="2"/>
            <line x1="35" y1="35" x2="20" y2="25" stroke="white" strokeWidth="2"/>
          </svg>
          {/* Cricket bat */}
          <svg className="absolute top-40 right-20 w-20 h-32" viewBox="0 0 60 120" fill="white">
            <rect x="22" y="0" width="16" height="70" rx="3" fill="white"/>
            <rect x="25" y="70" width="10" height="40" fill="white"/>
            <circle cx="30" cy="115" r="5" fill="white"/>
          </svg>
          {/* Badminton shuttlecock */}
          <svg className="absolute bottom-32 left-20 w-16 h-20" viewBox="0 0 50 70" fill="white">
            <ellipse cx="25" cy="60" rx="8" ry="6" fill="white"/>
            <path d="M17 55 L25 10 L33 55" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M20 55 L25 20 L30 55" stroke="white" strokeWidth="2" fill="none"/>
          </svg>
          {/* Tennis ball */}
          <svg className="absolute bottom-20 right-32 w-20 h-20" viewBox="0 0 80 80" fill="none" stroke="white" strokeWidth="2">
            <circle cx="40" cy="40" r="35"/>
            <path d="M15 25 Q40 40 15 55"/>
            <path d="M65 25 Q40 40 65 55"/>
          </svg>
          {/* Basketball */}
          <svg className="absolute top-1/3 left-1/3 w-28 h-28" viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth="2">
            <circle cx="50" cy="50" r="45"/>
            <line x1="5" y1="50" x2="95" y2="50"/>
            <line x1="50" y1="5" x2="50" y2="95"/>
            <path d="M50 5 Q80 50 50 95"/>
            <path d="M50 5 Q20 50 50 95"/>
          </svg>
          {/* Volleyball */}
          <svg className="absolute bottom-40 left-1/2 w-24 h-24" viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth="2">
            <circle cx="50" cy="50" r="45"/>
            <path d="M50 5 Q60 50 50 95"/>
            <path d="M50 5 Q40 50 50 95"/>
            <path d="M8 35 Q50 40 92 35"/>
          </svg>
          {/* Goal post */}
          <svg className="absolute top-20 right-1/3 w-32 h-24" viewBox="0 0 120 80" fill="none" stroke="white" strokeWidth="3">
            <line x1="10" y1="80" x2="10" y2="10"/>
            <line x1="110" y1="80" x2="110" y2="10"/>
            <line x1="10" y1="10" x2="110" y2="10"/>
            <line x1="10" y1="10" x2="0" y2="0"/>
            <line x1="110" y1="10" x2="120" y2="0"/>
          </svg>
          {/* Net pattern */}
          <svg className="absolute bottom-10 right-10 w-40 h-20" viewBox="0 0 160 80" fill="none" stroke="white" strokeWidth="1" opacity="0.5">
            <line x1="0" y1="40" x2="160" y2="40"/>
            {[0,20,40,60,80,100,120,140,160].map(x => (
              <line key={x} x1={x} y1="0" x2={x} y2="80"/>
            ))}
            {[0,20,40,60,80].map(y => (
              <line key={y} x1="0" y1={y} x2="160" y2={y}/>
            ))}
          </svg>
          {/* Turf grass pattern */}
          <svg className="absolute top-2/3 left-10 w-48 h-16" viewBox="0 0 200 60" fill="white" opacity="0.3">
            {[0,15,30,45,60,75,90,105,120,135,150,165,180].map(x => (
              <path key={x} d={`M${x} 60 Q${x+5} 30 ${x+7} 0`} stroke="white" strokeWidth="2" fill="none"/>
            ))}
          </svg>
        </div>

        {/* Logo and title */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 3v18"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">TurfManager</h1>
              <p className="text-white/80">Complete Turf Management Solution</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Everything you need to run your turf business
          </h2>
          <div className="space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg text-white font-medium">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/60 text-sm">
            Trusted by turf owners across India
          </p>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 bg-background lg:rounded-l-3xl">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 3v18"/>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">TurfManager</h1>
            <p className="text-sm text-muted-foreground">
              Complete Turf Management Solution
            </p>
          </div>

          {/* Form header */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-semibold text-foreground">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isLogin ? "Sign in to manage your turf" : "Get started with TurfManager"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-1">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`h-12 ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`h-12 ${errors.password ? "border-destructive" : ""}`}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
              disabled={loading}
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-emerald-500 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          {/* Mobile features */}
          <div className="lg:hidden pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-4">Why TurfManager?</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-muted-foreground">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;