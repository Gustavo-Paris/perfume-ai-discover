
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConversationMessage, ConversationState, StreamingResponse } from '@/types/conversation';

export const useConversationalRecommend = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationState>({
    messages: [],
    isComplete: false,
    userProfile: {}
  });

  const sendMessage = useCallback(async (userMessage: string) => {
    setLoading(true);
    setError(null);

    try {
      // Only add user message to conversation if it's not a system context message
      const isSystemMessage = userMessage.includes('viu as 3 recomendações') || 
                              userMessage.includes('Continue a conversa');
      
      let newUserMessage: ConversationMessage | null = null;
      
      if (!isSystemMessage) {
        newUserMessage = {
          role: 'user',
          content: userMessage,
          timestamp: new Date()
        };

        setConversation(prev => ({
          ...prev,
          messages: [...prev.messages, newUserMessage]
        }));
      }

      // Send to edge function
      const { data, error: functionError } = await supabase.functions.invoke('conversational-recommend', {
        body: { 
          message: userMessage,
          conversationHistory: conversation.messages
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Erro na conversa');
      }

      const response: StreamingResponse = data;

      // Add assistant message
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date()
      };

      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isComplete: response.isComplete
      }));

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [conversation.messages]);

  const resetConversation = useCallback(() => {
    setConversation({
      messages: [],
      isComplete: false,
      userProfile: {}
    });
    setError(null);
  }, []);

  return {
    conversation,
    sendMessage,
    resetConversation,
    loading,
    error
  };
};
