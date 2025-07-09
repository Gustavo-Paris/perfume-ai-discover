
import { useCallback } from 'react';
import { ConversationMessage, StreamingResponse } from '@/types/conversation';
import { useConversation } from './useConversation';
import { useConversationState } from './useConversationState';

export const useConversationalRecommend = () => {
  const { sendMessage: sendMessageToAPI, loading: apiLoading, error, setError } = useConversation();
  const { 
    conversation, 
    currentSessionId, 
    updateConversation, 
    resetConversation, 
    saveConversationToSession,
    loading: stateLoading 
  } = useConversationState();

  const sendMessage = useCallback(async (userMessage: string) => {
    setError(null);

    try {
      const isSystemMessage = userMessage.includes('viu as 3 recomendações') || 
                              userMessage.includes('Continue a conversa');
      
      let updatedMessages = conversation.messages;
      
      if (!isSystemMessage) {
        const newUserMessage: ConversationMessage = {
          role: 'user',
          content: userMessage,
          timestamp: new Date()
        };

        updatedMessages = [...conversation.messages, newUserMessage];
        updateConversation({ messages: updatedMessages });
      }

      const response: StreamingResponse = await sendMessageToAPI(userMessage, updatedMessages);

      if (!response.isComplete) {
        const assistantMessage: ConversationMessage = {
          role: 'assistant',
          content: response.content,
          timestamp: new Date()
        };

        const finalMessages = [...updatedMessages, assistantMessage];

        updateConversation({
          messages: finalMessages,
          isComplete: response.isComplete
        });

        await saveConversationToSession(
          finalMessages, 
          response.recommendations, 
          response.isComplete
        );
      } else {
        // Se é completo, apenas atualiza o estado sem adicionar mensagem
        updateConversation({
          messages: updatedMessages,
          isComplete: response.isComplete
        });

        await saveConversationToSession(
          updatedMessages, 
          response.recommendations, 
          response.isComplete
        );
      }

      return response;
    } catch (err) {
      throw err;
    }
  }, [conversation.messages, sendMessageToAPI, updateConversation, saveConversationToSession, setError]);

  const getCurrentRecommendations = useCallback(() => {
    return currentSessionId;
  }, [currentSessionId]);

  return {
    conversation,
    sendMessage,
    resetConversation,
    getCurrentRecommendations,
    currentSessionId,
    loading: apiLoading || stateLoading,
    error
  };
};
