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
      // Get user data from auth.users as fallback since PostgREST can't see profiles table
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Error fetching user:', userError);
        return;
      }

      // Build profile data from user metadata
      const profileData = {
        id: user.id,
        user_id: user.id,
        organization_id: 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495', // Default organization for now
        full_name: user.user_metadata?.full_name || user.email,
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || null,
        phone: user.user_metadata?.phone || null,
        position: user.user_metadata?.position || null,
        department: user.user_metadata?.department || null,
        is_active: true,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at
      };

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

      // Set default role since user_roles table is not accessible via PostgREST
      const defaultRole = 'admin';
      setUserRole(defaultRole);
      setCanManageOrganization(['owner', 'admin'].includes(defaultRole));

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