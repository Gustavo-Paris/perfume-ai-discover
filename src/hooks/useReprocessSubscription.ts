import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const useReprocessSubscription = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  const reprocessSelection = async (subscriptionId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Validar se a assinatura existe e está ativa
      const { data: subscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('id, status')
        .eq('id', subscriptionId)
        .single();

      if (fetchError) throw fetchError;

      if (!subscription) {
        throw new Error('Assinatura não encontrada');
      }

      if (subscription.status !== 'active') {
        throw new Error('Apenas assinaturas ativas podem ser reprocessadas');
      }

      toast({
        title: 'Reprocessando seleção...',
        description: 'Aguarde enquanto selecionamos novos perfumes'
      });

      // Chamar edge function para reprocessar
      const { data, error: functionError } = await supabase.functions.invoke(
        'process-monthly-subscriptions',
        {
          body: { subscriptionId }
        }
      );

      if (functionError) throw functionError;

      if (!data || data.error) {
        throw new Error(data?.error || 'Erro ao reprocessar seleção');
      }

      toast({
        title: 'Seleção reprocessada com sucesso',
        description: `${data.processed || 0} perfumes selecionados`
      });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['subscription-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-history', subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });

      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao reprocessar seleção';
      console.error('Erro ao reprocessar:', err);
      
      setError(err);
      
      toast({
        title: 'Erro ao reprocessar seleção',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    reprocessSelection,
    loading,
    error
  };
};
