import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { SubscriptionPreferences, IntensityPreference } from '@/types/subscription';

type PreferencesUpdate = Partial<Omit<SubscriptionPreferences, 'id' | 'subscription_id' | 'created_at' | 'updated_at'>>;

export const useSubscriptionPreferences = () => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const updatePreferences = async (
    subscriptionId: string,
    preferences: PreferencesUpdate
  ) => {
    try {
      setLoading(true);

      // Verificar se já existem preferências
      const { data: existing } = await supabase
        .from('subscription_preferences')
        .select('id')
        .eq('subscription_id', subscriptionId)
        .maybeSingle();

      let result;

      if (existing) {
        // Atualizar existente
        result = await supabase
          .from('subscription_preferences')
          .update(preferences)
          .eq('subscription_id', subscriptionId)
          .select()
          .single();
      } else {
        // Criar novo
        result = await supabase
          .from('subscription_preferences')
          .insert({
            subscription_id: subscriptionId,
            ...preferences
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: "Preferências atualizadas",
        description: "Suas preferências foram salvas com sucesso"
      });

      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      return result.data as SubscriptionPreferences;

    } catch (error: any) {
      console.error('Erro ao atualizar preferências:', error);
      toast({
        title: "Erro ao atualizar preferências",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    updatePreferences,
    loading
  };
};
