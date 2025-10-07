import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export const useAccessLog = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const logAccess = useMutation({
    mutationFn: async ({ route }: { route: string }) => {
      if (!user) return null;

      const { data, error } = await supabase
        .rpc('log_user_access', {
          user_uuid: user.id,
          access_route: route,
          client_user_agent: navigator.userAgent
        });

      if (error) throw error;
      return data;
    }
  });

  return {
    logAccess: logAccess.mutateAsync,
    isLogging: logAccess.isPending
  };
};

// Hook to automatically log route access
export const useRouteLogger = (route: string) => {
  const { logAccess } = useAccessLog();
  const { user } = useAuth();

  useEffect(() => {
    if (user && route) {
      // Log access with a small delay to avoid excessive logging
      const timer = setTimeout(() => {
        logAccess({ route }).catch(() => {});
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, route, logAccess]);
};