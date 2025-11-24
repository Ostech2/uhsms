import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LoginProps {
  onLogin: (role: 'admin' | 'male-warden' | 'female-warden') => void;
}

export function Login({ onLogin }: LoginProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error("User not authorized or inactive");
      }

      onLogin(profile.role as 'admin' | 'male-warden' | 'female-warden');
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or user not authorized",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-primary">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">UCU-BBUC Hostel</h1>
          <p className="text-muted-foreground">Stock Management System</p>
        </div>

        <Card className="w-full bg-gradient-card shadow-xl">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your dashboard with your credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary text-white"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Only users created by admin can login</p>
        </div>
      </div>
    </div>
  );
}