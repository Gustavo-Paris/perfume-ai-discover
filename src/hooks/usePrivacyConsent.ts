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

  // Check if user has given consent (cookie-based)
  const hasLocalConsent = hasConsent(consentType);

  // Mutation to record consent in database
  const recordConsent = useMutation({
    mutationFn: async ({ consented }: { consented: boolean }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('privacy_consents')
        .insert({
          user_id: user.user?.id || null,
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
    giveConsent(consentType);
    await recordConsent.mutateAsync({ consented: true });
  };

  const rejectConsent = async () => {
    revokeConsent(consentType);
    await recordConsent.mutateAsync({ consented: false });
  };

  return {
    hasConsent: hasLocalConsent,
    consentHistory,
    acceptConsent,
    rejectConsent,
    isRecording: recordConsent.isPending
  };
};