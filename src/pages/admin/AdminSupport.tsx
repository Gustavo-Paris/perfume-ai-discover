import { useState, useEffect } from 'react';
import { MessageCircle, Clock, CheckCircle, AlertTriangle, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { SupportConversation, SupportMessage } from '@/types/support';
import { cn } from '@/lib/utils';

export default function AdminSupport() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  // Carregar conversas
  const loadConversations = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('support_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setConversations((data || []) as SupportConversation[]);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar mensagens da conversa selecionada
  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as SupportMessage[]);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Enviar mensagem como agente
  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user?.id,
          sender_type: 'agent',
          message: newMessage.trim(),
          message_type: 'text'
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data as SupportMessage]);
      setNewMessage('');

      // Atualizar status da conversa
      await supabase
        .from('support_conversations')
        .update({ status: 'in_progress' })
        .eq('id', selectedConversation.id);

      toast({
        title: "Mensagem enviada!",
        description: "Sua resposta foi enviada para o cliente.",
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    }
  };

  // Atualizar status da conversa
  const updateConversationStatus = async (status: string) => {
    if (!selectedConversation) return;

    try {
      await supabase
        .from('support_conversations')
        .update({ 
          status,
          assigned_to: user?.id,
          closed_at: status === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', selectedConversation.id);

      setSelectedConversation(prev => prev ? { ...prev, status: status as any } : null);
      loadConversations();

      toast({
        title: "Status atualizado!",
        description: `Conversa marcada como ${status}.`,
      });

    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadConversations();
  }, [filter]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Subscription para novas conversas e mensagens
  useEffect(() => {
    const conversationsChannel = supabase
      .channel('admin-support-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_conversations'
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    let messagesChannel: any;
    
    if (selectedConversation) {
      messagesChannel = supabase
        .channel(`admin-support-messages-${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          (payload) => {
            const newMessage = payload.new as SupportMessage;
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(conversationsChannel);
      if (messagesChannel) {
        supabase.removeChannel(messagesChannel);
      }
    };
  }, [selectedConversation]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suporte ao Cliente</h1>
        <p className="text-muted-foreground">
          Gerencie conversas de suporte e responda aos clientes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Lista de Conversas */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversas
              </CardTitle>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="open">Abertas</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="resolved">Resolvidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={cn(
                    "p-3 cursor-pointer hover:bg-muted transition-colors border-b",
                    selectedConversation?.id === conversation.id && "bg-muted"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn("w-2 h-2 rounded-full", getStatusColor(conversation.status))} />
                        <div className={cn("w-2 h-2 rounded-full", getPriorityColor(conversation.priority))} />
                        <span className="font-medium text-sm truncate">
                          {conversation.subject || 'Conversa de Suporte'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {conversation.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversation.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedConversation.subject || 'Conversa de Suporte'}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{selectedConversation.status}</Badge>
                      <Badge variant="outline">{selectedConversation.priority}</Badge>
                      {selectedConversation.category && (
                        <Badge variant="outline">{selectedConversation.category}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={selectedConversation.status}
                      onValueChange={updateConversationStatus}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberta</SelectItem>
                        <SelectItem value="in_progress">Em andamento</SelectItem>
                        <SelectItem value="resolved">Resolvida</SelectItem>
                        <SelectItem value="closed">Fechada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.sender_type === 'agent' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] p-3 rounded-lg",
                          message.sender_type === 'agent'
                            ? 'bg-primary text-primary-foreground'
                            : message.sender_type === 'system'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <div className="text-sm">{message.message}</div>
                        <div className="text-xs opacity-70 mt-1 flex items-center gap-1">
                          {message.sender_type === 'user' && <User className="h-3 w-3" />}
                          {new Date(message.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                {selectedConversation.status !== 'closed' && (
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua resposta..."
                        className="flex-1 resize-none"
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={!newMessage.trim()}
                        className="self-end"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa para começar</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}