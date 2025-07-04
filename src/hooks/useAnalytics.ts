import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { initSentry } from '@/utils/sentry';
import { initGA4 } from '@/utils/analytics';

export const useAnalytics = () => {
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        // Get Sentry DSN from Supabase secrets
        const { data: sentryData } = await supabase.functions.invoke('secrets', {
          body: { name: 'SENTRY_DSN' }
        });

        // Get GA Measurement ID from Supabase secrets  
        const { data: gaData } = await supabase.functions.invoke('secrets', {
          body: { name: 'GA_MEASUREMENT_ID' }
        });

        if (sentryData?.value) {
          initSentry(sentryData.value);
        }

        if (gaData?.value) {
          initGA4(gaData.value);
        }
      } catch (error) {
        console.warn('Failed to initialize analytics:', error);
      }
    };

    initializeAnalytics();
  }, []);
};