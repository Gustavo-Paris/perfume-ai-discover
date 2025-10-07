import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { hasConsent, giveConsent, revokeConsent, COOKIE_NAMES } from '@/utils/privacy';
import { debugLog, debugError } from '@/utils/removeDebugLogsProduction';

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
        debugLog('Skipping database consent recording for anonymous user');
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
      debugLog('Accepting consent...');
      debugLog('Before setting cookie, all cookies:', document.cookie);
      giveConsent(consentType);
      debugLog('After setting cookie, all cookies:', document.cookie);
      
      // Force immediate check
      const cookieName = COOKIE_NAMES[consentType];
      const directCookieCheck = document.cookie.split(';').find(c => c.trim().startsWith(`${cookieName}=`));
      debugLog('Direct cookie check:', directCookieCheck);
      debugLog('hasConsent check:', hasConsent(consentType));
      
      setConsentState(true);
      await recordConsent.mutateAsync({ consented: true });
      debugLog('Consent recorded successfully');
    } catch (error) {
      debugError('Error accepting consent:', error);
      giveConsent(consentType);
      setConsentState(true);
    }
  };

  const rejectConsent = async () => {
    try {
      debugLog('Rejecting consent...');
      debugLog('Before removing cookie, all cookies:', document.cookie);
      revokeConsent(consentType);
      debugLog('After removing cookie, all cookies:', document.cookie);
      setConsentState(false);
      await recordConsent.mutateAsync({ consented: false });
      debugLog('Rejection recorded successfully');
    } catch (error) {
      debugError('Error rejecting consent:', error);
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