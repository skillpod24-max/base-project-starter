import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface PublicProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string | null;
}

interface PublicAuthContextType {
  user: User | null;
  session: Session | null;
  profile: PublicProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (phone: string, password: string) => Promise<{ error: any }>;
  signUp: (phone: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const PublicAuthContext = createContext<PublicAuthContextType | undefined>(undefined);

export const PublicAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        checkAdminRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await (supabase as any)
      .from('public_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    setProfile(data as PublicProfile | null);
  };

  const checkAdminRole = async (userId: string) => {
    const { data } = await (supabase as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signIn = async (phone: string, password: string) => {
    const email = `${phone.replace(/\D/g, '')}@sportsarena.app`;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signUp = async (phone: string, password: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const email = `${cleanPhone}@sportsarena.app`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          phone: cleanPhone,
          name
        }
      }
    });

    if (error) return { error };

    if (data.user) {
      const { error: profileError } = await (supabase as any)
        .from('public_profiles')
        .insert({
          user_id: data.user.id,
          name,
          phone: cleanPhone,
          email: null
        });

      if (profileError) return { error: profileError };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <PublicAuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      loading, 
      isAdmin,
      signIn, 
      signUp, 
      signOut,
      refreshProfile 
    }}>
      {children}
    </PublicAuthContext.Provider>
  );
};

export const usePublicAuth = () => {
  const context = useContext(PublicAuthContext);
  if (context === undefined) {
    throw new Error('usePublicAuth must be used within a PublicAuthProvider');
  }
  return context;
};
