
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConversationMessage, ConversationState, StreamingResponse } from '@/types/conversation';
import { useConversationalSessions } from './useConversationalSessions';

export const useConversationalRecommend = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationState>({
    messages: [],
    isComplete: false,
    userProfile: {}
  });

  const { 
    createSession, 
    updateSession, 
    getRecentSession, 
    loading: sessionLoading 
  } = useConversationalSessions();

  // Load recent session on mount
  useEffect(() => {
    const loadRecentSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const recentSession = await getRecentSession();
        if (recentSession) {
          setCurrentSessionId(recentSession.id);
          setConversation({
            messages: recentSession.conversation_json || [],
            isComplete: recentSession.session_status === 'completed',
            userProfile: recentSession.user_profile_data || {}
          });
        }
      } catch (err) {
        console.log('No recent session found or error loading:', err);
      }
    };

    loadRecentSession();
  }, [getRecentSession]);

  const saveConversationToSession = useCallback(async (
    messages: ConversationMessage[], 
    recommendations?: string[], 
    isComplete?: boolean
  ) => {
    try {
      if (!currentSessionId) {
        // Create new session
        const newSession = await createSession(messages);
        setCurrentSessionId(newSession.id);
        
        if (recommendations) {
          await updateSession(newSession.id, {
            conversation_json: messages,
            recommended_perfumes: recommendations,
            session_status: isComplete ? 'completed' : 'active'
          });
        }
      } else {
        // Update existing session
        await updateSession(currentSessionId, {
          conversation_json: messages,
          recommended_perfumes: recommendations,
          session_status: isComplete ? 'completed' : 'active'
        });
      }
    } catch (err) {
      console.error('Error saving session:', err);
    }
  }, [currentSessionId, createSession, updateSession]);

  const sendMessage = useCallback(async (userMessage: string) => {
    setLoading(true);
    setError(null);

    try {
      // Only add user message to conversation if it's not a system context message
      const isSystemMessage = userMessage.includes('viu as 3 recomendações') || 
                              userMessage.includes('Continue a conversa');
      
      let newUserMessage: ConversationMessage | null = null;
      let updatedMessages = conversation.messages;
      
      if (!isSystemMessage) {
        newUserMessage = {
          role: 'user',
          content: userMessage,
          timestamp: new Date()
        };

        updatedMessages = [...conversation.messages, newUserMessage];
        setConversation(prev => ({
          ...prev,
          messages: updatedMessages
        }));
      }

      // Send to edge function
      const { data, error: functionError } = await supabase.functions.invoke('conversational-recommend', {
        body: { 
          message: userMessage,
          conversationHistory: updatedMessages
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

      const finalMessages = [...updatedMessages, assistantMessage];

      setConversation(prev => ({
        ...prev,
        messages: finalMessages,
        isComplete: response.isComplete
      }));

      // Save to session
      await saveConversationToSession(
        finalMessages, 
        response.recommendations, 
        response.isComplete
      );

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [conversation.messages, saveConversationToSession]);

  const resetConversation = useCallback(async () => {
    // Mark current session as abandoned if exists
    if (currentSessionId) {
      try {
        await updateSession(currentSessionId, {
          session_status: 'abandoned'
        });
      } catch (err) {
        console.error('Error updating session status:', err);
      }
    }

    // Reset state
    setConversation({
      messages: [],
      isComplete: false,
      userProfile: {}
    });
    setCurrentSessionId(null);
    setError(null);
  }, [currentSessionId, updateSession]);

  const getCurrentRecommendations = useCallback(() => {
    return currentSessionId;
  }, [currentSessionId]);

  return {
    conversation,
    sendMessage,
    resetConversation,
    getCurrentRecommendations,
    currentSessionId,
    loading: loading || sessionLoading,
    error
  };
};
