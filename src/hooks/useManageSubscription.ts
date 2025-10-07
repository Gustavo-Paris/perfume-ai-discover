import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const useManageSubscription = () => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const pauseSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'paused' })
        .eq('id', subscriptionId);

      if (error) throw error;

      // Registrar no histórico
      await supabase.rpc('log_subscription_event', {
        p_subscription_id: subscriptionId,
        p_event_type: 'paused',
        p_event_data: { paused_at: new Date().toISOString() }
      });

      toast({
        title: "Assinatura pausada",
        description: "Sua assinatura foi pausada com sucesso"
      });

      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      return true;

    } catch (error: any) {
      console.error('Erro ao pausar assinatura:', error);
      toast({
        title: "Erro ao pausar assinatura",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resumeSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'active' })
        .eq('id', subscriptionId);

      if (error) throw error;

      await supabase.rpc('log_subscription_event', {
        p_subscription_id: subscriptionId,
        p_event_type: 'resumed',
        p_event_data: { resumed_at: new Date().toISOString() }
      });

      toast({
        title: "Assinatura reativada",
        description: "Sua assinatura foi reativada com sucesso"
      });

      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      return true;

    } catch (error: any) {
      console.error('Erro ao reativar assinatura:', error);
      toast({
        title: "Erro ao reativar assinatura",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          cancel_at_period_end: true,
          status: 'cancelled'
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      await supabase.rpc('log_subscription_event', {
        p_subscription_id: subscriptionId,
        p_event_type: 'cancel_requested',
        p_event_data: { requested_at: new Date().toISOString() }
      });

      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura será cancelada ao final do período pago"
      });

      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      return true;

    } catch (error: any) {
      console.error('Erro ao cancelar assinatura:', error);
      toast({
        title: "Erro ao cancelar assinatura",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    loading
  };
};
