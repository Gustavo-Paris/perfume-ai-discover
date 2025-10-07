import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useSubscriptionCheckout = () => {
  const [loading, setLoading] = useState(false);

  const createCheckout = async (planId: string) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Não autorizado",
          description: "Você precisa estar logado para assinar",
          variant: "destructive"
        });
        return null;
      }

      const { data, error } = await supabase.functions.invoke('subscription-checkout', {
        body: { plan_id: planId }
      });

      if (error) throw error;

      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
        return data;
      }

      throw new Error('URL de checkout não retornada');

    } catch (error: any) {
      console.error('Erro ao criar checkout:', error);
      toast({
        title: "Erro ao criar checkout",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckout,
    loading
  };
};
