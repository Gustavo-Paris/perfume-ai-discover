import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDownloadLabel = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const downloadLabel = async (shipmentId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('download-label', {
        body: { shipment_id: shipmentId }
      });

      if (error) {
        throw error;
      }

      // If the response is a blob/binary data, create download
      if (data instanceof Blob || data instanceof ArrayBuffer) {
        const blob = data instanceof ArrayBuffer ? new Blob([data], { type: 'application/pdf' }) : data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `etiqueta-${shipmentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Etiqueta Baixada",
          description: "A etiqueta foi baixada com sucesso.",
        });
      } else {
        throw new Error('Formato de resposta inválido');
      }

      return data;
    } catch (error) {
      console.error('Error downloading label:', error);
      toast({
        title: "Erro ao Baixar Etiqueta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    downloadLabel,
    loading
  };
};