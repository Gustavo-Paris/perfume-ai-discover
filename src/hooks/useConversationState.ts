import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConversationMessage, ConversationState } from '@/types/conversation';
import { useConversationalSessions } from './useConversationalSessions';

export const useConversationState = () => {
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
        // Silent fail for missing sessions
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
        await updateSession(currentSessionId, {
          conversation_json: messages,
          recommended_perfumes: recommendations,
          session_status: isComplete ? 'completed' : 'active'
        });
      }
    } catch (err) {
      // Silent fail for session save errors
    }
  }, [currentSessionId, createSession, updateSession]);

  const updateConversation = useCallback((updatedConversation: Partial<ConversationState>) => {
    setConversation(prev => ({ ...prev, ...updatedConversation }));
  }, []);

  const resetConversation = useCallback(async () => {
    if (currentSessionId) {
      try {
        await updateSession(currentSessionId, {
          session_status: 'abandoned'
        });
      } catch (err) {
        // Silent fail
      }
    }

    setConversation({
      messages: [],
      isComplete: false,
      userProfile: {}
    });
    setCurrentSessionId(null);
  }, [currentSessionId, updateSession]);

  return {
    conversation,
    currentSessionId,
    updateConversation,
    resetConversation,
    saveConversationToSession,
    loading: sessionLoading
  };
};