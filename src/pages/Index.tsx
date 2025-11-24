import { useState, useEffect } from "react";
import { Login } from "@/components/Login";
import { AdminDashboard } from "@/components/AdminDashboard";
import { MaleWardenDashboard } from "@/components/MaleWardenDashboard";
import { FemaleWardenDashboard } from "@/components/FemaleWardenDashboard";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [currentUser, setCurrentUser] = useState<{
    role: 'admin' | 'male-warden' | 'female-warden';
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.email!);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.email!);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (email: string) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .single();

      if (profile) {
        setCurrentUser({ role: profile.role as 'admin' | 'male-warden' | 'female-warden' });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (role: 'admin' | 'male-warden' | 'female-warden') => {
    setCurrentUser({ role });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  switch (currentUser.role) {
    case 'admin':
      return <AdminDashboard onLogout={handleLogout} />;
    case 'male-warden':
      return <MaleWardenDashboard onLogout={handleLogout} />;
    case 'female-warden':
      return <FemaleWardenDashboard onLogout={handleLogout} />;
    default:
      return <Login onLogin={handleLogin} />;
  }
};

export default Index;