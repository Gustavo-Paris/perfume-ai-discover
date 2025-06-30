
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConversationMessage } from '@/types/conversation';

export interface ConversationalSession {
  id: string;
  user_id?: string;
  conversation_json: ConversationMessage[];
  recommended_perfumes?: string[];
  session_status: 'active' | 'completed' | 'abandoned';
  user_profile_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Helper function to convert ConversationMessage to JSON-compatible format
const conversationToJson = (conversation: ConversationMessage[]) => {
  return conversation.map(msg => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp.toISOString()
  }));
};

// Helper function to convert JSON back to ConversationMessage format
const jsonToConversation = (json: any[]): ConversationMessage[] => {
  if (!Array.isArray(json)) return [];
  return json.map(msg => ({
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.timestamp)
  }));
};

export const useConversationalSessions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (conversation: ConversationMessage[] = []) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error: createError } = await supabase
        .from('conversational_sessions')
        .insert({
          user_id: user?.id,
          conversation_json: conversationToJson(conversation),
          session_status: 'active'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Convert back to proper format
      return {
        ...data,
        conversation_json: jsonToConversation(data.conversation_json as any[]),
        recommended_perfumes: data.recommended_perfumes as string[] || []
      } as ConversationalSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar sessão';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (
    sessionId: string, 
    updates: {
      conversation_json?: ConversationMessage[];
      recommended_perfumes?: string[];
      session_status?: 'active' | 'completed' | 'abandoned';
      user_profile_data?: Record<string, any>;
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const updateData: any = {};
      
      if (updates.conversation_json) {
        updateData.conversation_json = conversationToJson(updates.conversation_json);
      }
      if (updates.recommended_perfumes) {
        updateData.recommended_perfumes = updates.recommended_perfumes;
      }
      if (updates.session_status) {
        updateData.session_status = updates.session_status;
      }
      if (updates.user_profile_data) {
        updateData.user_profile_data = updates.user_profile_data;
      }

      const { data, error: updateError } = await supabase
        .from('conversational_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Convert back to proper format
      return {
        ...data,
        conversation_json: jsonToConversation(data.conversation_json as any[]),
        recommended_perfumes: data.recommended_perfumes as string[] || []
      } as ConversationalSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar sessão';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('conversational_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Convert back to proper format
      return {
        ...data,
        conversation_json: jsonToConversation(data.conversation_json as any[]),
        recommended_perfumes: data.recommended_perfumes as string[] || []
      } as ConversationalSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar sessão';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error: fetchError } = await supabase
        .from('conversational_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Convert back to proper format
      return (data || []).map(session => ({
        ...session,
        conversation_json: jsonToConversation(session.conversation_json as any[]),
        recommended_perfumes: session.recommended_perfumes as string[] || []
      })) as ConversationalSession[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar sessões';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecentSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error: fetchError } = await supabase
        .from('conversational_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('session_status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (!data) return null;

      // Convert back to proper format
      return {
        ...data,
        conversation_json: jsonToConversation(data.conversation_json as any[]),
        recommended_perfumes: data.recommended_perfumes as string[] || []
      } as ConversationalSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar sessão recente';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createSession,
    updateSession,
    getSession,
    getUserSessions,
    getRecentSession,
    loading,
    error
  };
};
