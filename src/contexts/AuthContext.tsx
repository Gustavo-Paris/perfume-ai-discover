
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
        
        // Force refresh the session immediately from URL
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('❌ Refresh error:', refreshError);
        }
        
        // Wait for Supabase to fully process
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Get current session with retry logic
      console.log('📋 Getting session...');
      let session = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!session && attempts < maxAttempts) {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error(`❌ Session check error (attempt ${attempts + 1}):`, error);
        } else {
          session = data.session;
        }
        
        if (!session && attempts < maxAttempts - 1) {
          console.log(`⏳ Retrying session check in 1s... (attempt ${attempts + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        attempts++;
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
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name || email
          }
        }
      });

      if (error) {
        // Log security event for failed signup
        await supabase.rpc('log_security_event', {
          user_uuid: null,
          event_type_param: 'signup_failed',
          event_description_param: `Failed signup attempt for ${email}: ${error.message}`,
          risk_level_param: 'low',
          metadata_param: { email, error_message: error.message }
        });
        
        throw error;
      }
      
      // Log security event for successful signup
      await supabase.rpc('log_security_event', {
        user_uuid: data.user?.id,
        event_type_param: 'signup_success',
        event_description_param: `New user registered: ${email}`,
        risk_level_param: 'low',
        metadata_param: { email, name }
      });

      return { error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check rate limiting before attempting login
      const { data: rateLimitCheck } = await supabase.rpc('check_rate_limit', {
        email_param: email
      });
      
      const rateLimit = rateLimitCheck as any;
      if (rateLimit?.blocked) {
        const error = new Error(rateLimit.reason);
        
        // Log blocked attempt
        await supabase.rpc('log_login_attempt', {
          email_param: email,
          attempt_type_param: 'blocked',
          metadata_param: { blocked_reason: rateLimit.reason }
        });
        
        // Log security event
        await supabase.rpc('log_security_event', {
          user_uuid: null,
          event_type_param: 'login_blocked',
          event_description_param: `Login blocked for ${email}: ${rateLimit.reason}`,
          risk_level_param: 'high',
          metadata_param: { email, rate_limit_data: rateLimit }
        });
        
        throw error;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed attempt
        await supabase.rpc('log_login_attempt', {
          email_param: email,
          attempt_type_param: 'failed',
          metadata_param: { error_message: error.message }
        });
        
        // Log security event for suspicious activity
        const riskLevel = error.message.includes('Invalid login credentials') ? 'medium' : 'low';
        await supabase.rpc('log_security_event', {
          user_uuid: null,
          event_type_param: 'login_failed',
          event_description_param: `Failed login attempt for ${email}: ${error.message}`,
          risk_level_param: riskLevel,
          metadata_param: { email, error_message: error.message }
        });
        
        throw error;
      }
      
      // Log successful attempt
      await supabase.rpc('log_login_attempt', {
        email_param: email,
        attempt_type_param: 'success',
        metadata_param: { user_id: data.user?.id }
      });
      
      // Log security event for successful login
      await supabase.rpc('log_security_event', {
        user_uuid: data.user?.id,
        event_type_param: 'login_success',
        event_description_param: `Successful login for ${email}`,
        risk_level_param: 'low',
        metadata_param: { email }
      });

      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error };
    }
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
