import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para atualizações em tempo real dos perfumes
 * Escuta mudanças nas tabelas que afetam preços dos perfumes
 */
export const usePerfumeRealTimeUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('perfume-pricing-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'perfumes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['perfumes'] });
          queryClient.invalidateQueries({ queryKey: ['perfumes-with-costs'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'perfume_prices'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
          queryClient.invalidateQueries({ queryKey: ['perfumes'] });
          queryClient.invalidateQueries({ queryKey: ['perfumes-with-costs'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_lots'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['inventory-lots'] });
          queryClient.invalidateQueries({ queryKey: ['perfumes'] });
          queryClient.invalidateQueries({ queryKey: ['perfumes-with-costs'] });
          queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'materials'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['materials'] });
          queryClient.invalidateQueries({ queryKey: ['perfumes'] });
          queryClient.invalidateQueries({ queryKey: ['perfumes-with-costs'] });
          queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'material_lots'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['material-lots'] });
          queryClient.invalidateQueries({ queryKey: ['materials'] });
          queryClient.invalidateQueries({ queryKey: ['perfumes'] });
          queryClient.invalidateQueries({ queryKey: ['perfumes-with-costs'] });
          queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};