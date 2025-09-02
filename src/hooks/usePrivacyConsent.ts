import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { hasConsent, giveConsent, revokeConsent, COOKIE_NAMES } from '@/utils/privacy';

export interface PrivacyConsent {
  id: string;
  user_id?: string;
  consent_type: string;
  consented: boolean;
  ip_address?: string;
  created_at: string;
  expires_at?: string;
}

export const usePrivacyConsent = (consentType: keyof typeof COOKIE_NAMES) => {
  const queryClient = useQueryClient();
  const [consentState, setConsentState] = useState(() => hasConsent(consentType));

  // Re-check consent state periodically
  useEffect(() => {
    const checkConsent = () => {
      const currentConsent = hasConsent(consentType);
      setConsentState(currentConsent);
    };
    
    checkConsent();
    const interval = setInterval(checkConsent, 100);
    
    return () => clearInterval(interval);
  }, [consentType]);

  // Mutation to record consent in database
  const recordConsent = useMutation({
    mutationFn: async ({ consented }: { consented: boolean }) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Only record consent for authenticated users to comply with RLS policies
      if (!user.user?.id) {
        console.log('Skipping database consent recording for anonymous user');
        return null;
      }
      
      const { data, error } = await supabase
        .from('privacy_consents')
        .insert({
          user_id: user.user.id,
          consent_type: COOKIE_NAMES[consentType],
          consented,
          expires_at: consented 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
            : null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-consents'] });
    }
  });

  // Get user's consent history
  const { data: consentHistory = [] } = useQuery({
    queryKey: ['privacy-consents', consentType],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('privacy_consents')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('consent_type', COOKIE_NAMES[consentType])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PrivacyConsent[];
    }
  });

  const acceptConsent = async () => {
    try {
      console.log('Accepting consent...');
      console.log('Before setting cookie, all cookies:', document.cookie);
      giveConsent(consentType);
      console.log('After setting cookie, all cookies:', document.cookie);
      
      // Force immediate check
      const cookieName = COOKIE_NAMES[consentType];
      const directCookieCheck = document.cookie.split(';').find(c => c.trim().startsWith(`${cookieName}=`));
      console.log('Direct cookie check:', directCookieCheck);
      console.log('hasConsent check:', hasConsent(consentType));
      
      setConsentState(true);
      await recordConsent.mutateAsync({ consented: true });
      console.log('Consent recorded successfully');
    } catch (error) {
      console.error('Error accepting consent:', error);
      giveConsent(consentType);
      setConsentState(true);
    }
  };

  const rejectConsent = async () => {
    try {
      console.log('Rejecting consent...');
      console.log('Before removing cookie, all cookies:', document.cookie);
      revokeConsent(consentType);
      console.log('After removing cookie, all cookies:', document.cookie);
      setConsentState(false);
      await recordConsent.mutateAsync({ consented: false });
      console.log('Rejection recorded successfully');
    } catch (error) {
      console.error('Error rejecting consent:', error);
      revokeConsent(consentType);
      setConsentState(false);
    }
  };

  return {
    hasConsent: consentState,
    consentHistory,
    acceptConsent,
    rejectConsent,
    isRecording: recordConsent.isPending
  };
};