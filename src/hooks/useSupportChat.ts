import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { generateUUID } from '@/lib/uuid';
import type { SupportConversation, SupportMessage } from '@/types/support';

export const useSupportChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Carregar conversa existente
  const loadConversation = useCallback(async () => {
    if (!user && !conversation) return;

    try {
      setIsLoading(true);
      
      // Buscar conversa ativa
      const { data: conversations, error: convError } = await supabase
        .from('support_conversations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1);

      if (convError) throw convError;

      if (conversations && conversations.length > 0) {
        setConversation(conversations[0] as SupportConversation);
        
        // Carregar mensagens
        const { data: msgs, error: msgError } = await supabase
          .from('support_messages')
          .select('*')
          .eq('conversation_id', conversations[0].id)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;
        
        setMessages((msgs || []) as SupportMessage[]);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Criar nova conversa
  const startConversation = useCallback(async (subject?: string, category?: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('support_conversations')
        .insert({
          user_id: user?.id,
          session_id: user ? undefined : generateUUID(),
          subject: subject || 'Conversa de Suporte',
          category,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      setConversation(data as SupportConversation);

      // Mensagem de boas-vindas
      const welcomeMessage = {
        conversation_id: data.id,
        sender_type: 'system' as const,
        message: 'Olá! Como posso ajudá-lo hoje? Nossa equipe responderá o mais breve possível.',
        message_type: 'text' as const
      };

      const { data: msgData, error: msgError } = await supabase
        .from('support_messages')
        .insert(welcomeMessage)
        .select()
        .single();

      if (msgError) throw msgError;

      setMessages([msgData as SupportMessage]);
      setIsOpen(true);

      toast({
        title: "Chat iniciado!",
        description: "Nossa equipe responderá em breve.",
      });

    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o chat. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Enviar mensagem
  const sendMessage = useCallback(async (message: string) => {
    if (!conversation || !message.trim()) return;

    try {
      const newMessage = {
        conversation_id: conversation.id,
        sender_id: user?.id,
        sender_type: 'user' as const,
        message: message.trim(),
        message_type: 'text' as const
      };

      const { data, error } = await supabase
        .from('support_messages')
        .insert(newMessage)
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data as SupportMessage]);

      // Atualizar status da conversa
      await supabase
        .from('support_conversations')
        .update({ status: 'in_progress' })
        .eq('id', conversation.id);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [conversation, user]);

  // Fechar conversa
  const closeConversation = useCallback(async (rating?: number, feedback?: string) => {
    if (!conversation) return;

    try {
      await supabase
        .from('support_conversations')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          rating,
          feedback
        })
        .eq('id', conversation.id);

      setConversation(null);
      setMessages([]);
      setIsOpen(false);

      toast({
        title: "Chat encerrado",
        description: "Obrigado pelo seu feedback!",
      });

    } catch (error) {
      console.error('Error closing conversation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível encerrar o chat.",
        variant: "destructive",
      });
    }
  }, [conversation]);

  // Carregar conversa ao montar se usuário estiver logado
  useEffect(() => {
    if (user) {
      loadConversation();
    }
  }, [user, loadConversation]);

  // Subscription para novas mensagens
  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`support:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as SupportMessage;
          
          // Só adicionar se não for mensagem do próprio usuário
          if (newMessage.sender_id !== user?.id) {
            setMessages(prev => [...prev, newMessage]);
            
            // Mostrar notificação se chat estiver fechado
            if (!isOpen) {
              toast({
                title: "Nova mensagem no chat",
                description: "Você recebeu uma resposta da nossa equipe.",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation, user, isOpen]);

  return {
    isOpen,
    setIsOpen,
    conversation,
    messages,
    isLoading,
    isTyping,
    startConversation,
    sendMessage,
    closeConversation,
    loadConversation
  };
};