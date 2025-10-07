import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CancelNFeParams {
  fiscal_note_id: string;
  justificativa: string;
}

export const useCancelNFe = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const cancelNFe = async ({ fiscal_note_id, justificativa }: CancelNFeParams) => {
    try {
      setLoading(true);

      if (justificativa.length < 15) {
        throw new Error('A justificativa deve ter no mínimo 15 caracteres');
      }

      const { data, error } = await supabase.functions.invoke('cancel-nfe', {
        body: { fiscal_note_id, justificativa }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao cancelar NFe');
      }

      toast({
        title: "NFe Cancelada",
        description: "A nota fiscal foi cancelada com sucesso.",
      });

      return data;
    } catch (error: any) {
      console.error('Error cancelling NFe:', error);
      toast({
        title: "Erro ao Cancelar NFe",
        description: error.message || "Erro desconhecido ao cancelar nota fiscal",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    cancelNFe,
    loading
  };
};
