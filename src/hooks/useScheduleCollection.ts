import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScheduleCollectionData {
  shipment_ids: string[];
  collection_date: string;
  collection_time_start?: string;
  collection_time_end?: string;
}

export const useScheduleCollection = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const scheduleCollection = async (data: ScheduleCollectionData) => {
    try {
      setLoading(true);
      
      const { data: result, error } = await supabase.functions.invoke('schedule-collection', {
        body: data
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Coleta Agendada",
        description: "A coleta foi agendada com sucesso no Melhor Envio.",
      });

      return result;
    } catch (error) {
      console.error('Error scheduling collection:', error);
      toast({
        title: "Erro ao Agendar Coleta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    scheduleCollection,
    loading
  };
};