import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  organization: any | null;
  userRole: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, companyName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  canManageOrganization: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [organization, setOrganization] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [canManageOrganization, setCanManageOrganization] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        // Handle auth errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('Token refresh failed, signing out');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setOrganization(null);
          setUserRole(null);
          setCanManageOrganization(false);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user profile and organization data
          setTimeout(async () => {
            const isNewLogin = event === 'SIGNED_IN';
            await fetchUserData(session.user.id, isNewLogin);
          }, 0);
        } else {
          setProfile(null);
          setOrganization(null);
          setUserRole(null);
          setCanManageOrganization(false);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        if (error.message.includes('Invalid Refresh Token') || 
            error.message.includes('Refresh Token Not Found')) {
          console.log('Invalid refresh token, clearing session');
          await supabase.auth.signOut();
        }
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          await fetchUserData(session.user.id, false); // false = não é novo login
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const fetchUserData = async (userId: string, isNewLogin: boolean = false) => {
    try {
      // Fetch profile first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Se não encontrou perfil e é um novo login, vai para user-profile
        if (isNewLogin && location.pathname !== '/user-profile') {
          navigate('/user-profile');
        }
        return;
      }

      // Fetch organization separately if profile has organization_id
      let organizationData = null;
      if (profileData?.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .single();

        if (orgError) {
          console.error('Error fetching organization:', orgError);
        } else {
          organizationData = orgData;
        }
      }

      // Fetch user role separately
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, granted_at')
        .eq('user_id', userId)
        .single();

      if (roleError) {
        console.error('Error fetching role:', roleError);
        setUserRole(null);
        setCanManageOrganization(false);
      } else {
        setUserRole(roleData.role);
        setCanManageOrganization(['owner', 'admin'].includes(roleData.role));
      }

      setProfile(profileData);
      setOrganization(organizationData);

      // Lógica de navegação após login bem-sucedido
      if (isNewLogin) {
        // Se tem perfil completo, vai para dashboard
        if (profileData && profileData.full_name && organizationData) {
          if (location.pathname === '/signin' || location.pathname === '/') {
            navigate('/dashboard');
          }
        } else {
          // Se não tem perfil completo, vai para user-profile
          if (location.pathname !== '/user-profile') {
            navigate('/user-profile');
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, companyName?: string) => {
    const redirectUrl = `${window.location.origin}/user-profile`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          company_name: companyName
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      organization,
      userRole,
      loading,
      signUp,
      signIn,
      signOut,
      canManageOrganization
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}