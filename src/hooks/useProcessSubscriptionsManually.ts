import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ProcessResult {
  success: boolean;
  processed: number;
  errors: Array<{
    subscriptionId: string;
    error: string;
  }>;
  details: Array<{
    subscriptionId: string;
    status: 'success' | 'error';
    message: string;
  }>;
}

export const useProcessSubscriptionsManually = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{
    total: number;
    current: number;
    details: ProcessResult['details'];
  }>({ total: 0, current: 0, details: [] });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processSubscriptions = async (dryRun: boolean = false) => {
    setIsProcessing(true);
    setProgress({ total: 0, current: 0, details: [] });

    try {
      toast({
        title: dryRun ? 'Simulando processamento...' : 'Processando assinaturas...',
        description: 'Por favor aguarde enquanto processamos as assinaturas.',
      });

      const { data, error } = await supabase.functions.invoke('process-monthly-subscriptions', {
        body: { 
          forceRun: true,
          dryRun 
        },
      });

      if (error) throw error;

      const result = data as ProcessResult;

      setProgress({
        total: result.processed + result.errors.length,
        current: result.processed + result.errors.length,
        details: result.details || [],
      });

      if (result.success) {
        toast({
          title: dryRun ? 'Simulação concluída!' : 'Processamento concluído!',
          description: `${result.processed} assinatura(s) processada(s). ${result.errors.length} erro(s).`,
          variant: result.errors.length > 0 ? 'destructive' : 'default',
        });
      } else {
        throw new Error('Falha no processamento');
      }

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['subscription-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });

      return result;
    } catch (err: any) {
      console.error('Erro ao processar assinaturas:', err);
      toast({
        title: 'Erro ao processar',
        description: err.message || 'Ocorreu um erro ao processar as assinaturas.',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processSubscriptions,
    isProcessing,
    progress,
  };
};
