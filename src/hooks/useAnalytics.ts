import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { initSentry } from '@/utils/sentry';
import { initGA4 } from '@/utils/analytics';

export const useAnalytics = () => {
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        // Fetch public analytics config from edge function
        const { data } = await supabase.functions.invoke('public-analytics-config');

        if (data?.sentryDsn) {
          initSentry(data.sentryDsn);
        }

        if (data?.gaMeasurementId) {
          initGA4(data.gaMeasurementId);
        }
      } catch (error) {
        console.warn('Failed to initialize analytics:', error);
      }
    };

    initializeAnalytics();
  }, []);
};