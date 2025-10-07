import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserSubscription, SubscriptionPreferences } from '@/types/subscription';

export const useUserSubscription = () => {
  return useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*),
          preferences:subscription_preferences(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;

      return {
        ...data,
        preferences: data.preferences?.[0] as SubscriptionPreferences | undefined
      } as UserSubscription & { preferences?: SubscriptionPreferences };
    },
    enabled: true
  });
};
