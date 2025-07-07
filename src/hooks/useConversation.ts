import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConversationMessage, StreamingResponse } from '@/types/conversation';

export const useConversation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    userMessage: string,
    conversationHistory: ConversationMessage[]
  ): Promise<StreamingResponse> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('conversational-recommend', {
        body: { 
          message: userMessage,
          conversationHistory
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Erro na comunicação com o servidor');
      }

      if (!data) {
        throw new Error('Resposta vazia do servidor');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      let errorMessage = 'Erro inesperado. Tente novamente.';
      
      if (err instanceof Error) {
        if (err.message.includes('Rate limit') || err.message.includes('Muitas solicitações')) {
          errorMessage = 'Muitas solicitações. Aguarde um momento e tente novamente.';
        } else if (err.message.includes('API key') || err.message.includes('Configuração')) {
          errorMessage = 'Serviço temporariamente indisponível. Nossa equipe foi notificada.';
        } else if (err.message.includes('indisponível') || err.message.includes('temporarily unavailable')) {
          errorMessage = 'Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sendMessage,
    loading,
    error,
    setError
  };
};