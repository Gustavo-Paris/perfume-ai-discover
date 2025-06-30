
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
          conversation_json: conversation,
          session_status: 'active'
        })
        .select()
        .single();

      if (createError) throw createError;
      return data;
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
      const { data, error: updateError } = await supabase
        .from('conversational_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) throw updateError;
      return data;
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
      return data as ConversationalSession;
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
      return data as ConversationalSession[];
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
      return data as ConversationalSession | null;
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
