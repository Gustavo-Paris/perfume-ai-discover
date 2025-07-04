import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PointsTransaction {
  id: string;
  user_id: string;
  delta: number;
  balance_after: number;
  source: string;
  description?: string;
  order_id?: string;
  created_at: string;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  min_points: number;
  multiplier: number;
  created_at: string;
}

export const usePointsTransactions = () => {
  return useQuery({
    queryKey: ['points-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PointsTransaction[];
    }
  });
};

export const useLoyaltyTiers = () => {
  return useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .order('min_points', { ascending: true });
      
      if (error) throw error;
      return data as LoyaltyTier[];
    }
  });
};

export const useUserPoints = () => {
  return useQuery({
    queryKey: ['user-points'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('get_user_points_balance', { user_uuid: user.user.id });
      
      if (error) throw error;
      return data as number;
    }
  });
};

export const useAddPointsTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      delta,
      source,
      description,
      orderId
    }: {
      delta: number;
      source: string;
      description?: string;
      orderId?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('add_points_transaction', {
          user_uuid: user.user.id,
          points_delta: delta,
          transaction_source: source,
          transaction_description: description,
          related_order_id: orderId
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
    }
  });
};

export const useCurrentTier = () => {
  const { data: points = 0 } = useUserPoints();
  const { data: tiers = [] } = useLoyaltyTiers();
  
  const currentTier = tiers
    .filter(tier => points >= tier.min_points)
    .sort((a, b) => b.min_points - a.min_points)[0];
  
  const nextTier = tiers.find(tier => tier.min_points > points);
  
  return {
    currentTier,
    nextTier,
    pointsToNext: nextTier ? nextTier.min_points - points : 0
  };
};