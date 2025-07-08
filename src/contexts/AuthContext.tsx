
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Simple auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

  // Handle initial session and recovery tokens
  const handleInitialAuth = async () => {
    try {
      // Check URL for recovery tokens FIRST
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      const hasRecoveryTokens = hash.includes('access_token') && (hash.includes('type=recovery') || searchParams.get('type') === 'recovery');
      
      if (hasRecoveryTokens) {
        console.log('🔄 Recovery tokens detected, processing...');
        // Wait longer for Supabase to process the tokens
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // Get current session
      console.log('📋 Getting session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session check error:', error);
      }
      
      if (mounted) {
        console.log('✅ Session loaded:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      if (mounted) {
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    }
  };

    handleInitialAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name || email
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
    // Force page reload to clear all state
    window.location.href = '/auth';
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?type=recovery`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    return { error };
  };

  const updatePassword = async (password: string) => {
    
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      
      return { error };
    } catch (err) {
      console.error('Exception in updatePassword:', err);
      return { error: err };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
