import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { initSentry } from '@/utils/sentry';
import { initGA4 } from '@/utils/analytics';

export const useAnalytics = () => {
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        // Fetch public analytics config from edge function
        const { data, error } = await supabase.functions.invoke('public-analytics-config');

        if (error) {
          console.warn('Analytics config error:', error);
          return;
        }

        // Safe Sentry initialization
        if (data?.sentryDsn) {
          const sentryInitialized = initSentry(data.sentryDsn);
          if (!sentryInitialized) {
            console.warn('Sentry initialization failed, continuing without error tracking');
          }
        }

        // Safe GA4 initialization
        if (data?.gaMeasurementId) {
          try {
            initGA4(data.gaMeasurementId);
          } catch (ga4Error) {
            console.warn('GA4 initialization failed:', ga4Error);
          }
        }
      } catch (error) {
        console.warn('Failed to initialize analytics:', error);
        // Continue app execution even if analytics fail
      }
    };

    initializeAnalytics();
  }, []);
};