-- Criar tabelas para sistema de chat de suporte
CREATE TABLE public.support_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT
);

CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'system')),
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  attachments JSONB,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_support_conversations_user_id ON public.support_conversations(user_id);
CREATE INDEX idx_support_conversations_status ON public.support_conversations(status);
CREATE INDEX idx_support_conversations_assigned_to ON public.support_conversations(assigned_to);
CREATE INDEX idx_support_messages_conversation_id ON public.support_messages(conversation_id);
CREATE INDEX idx_support_messages_created_at ON public.support_messages(created_at);

-- RLS Policies
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias conversas
CREATE POLICY "Users can view their own conversations" 
ON public.support_conversations 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  session_id = current_setting('app.session_id', true)
);

-- Usuários podem criar conversas
CREATE POLICY "Users can create conversations" 
ON public.support_conversations 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  (auth.uid() IS NULL AND session_id IS NOT NULL)
);

-- Usuários podem atualizar suas conversas (rating/feedback)
CREATE POLICY "Users can update their conversations" 
ON public.support_conversations 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  session_id = current_setting('app.session_id', true)
);

-- Admins podem ver todas as conversas
CREATE POLICY "Admins can manage all conversations" 
ON public.support_conversations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para mensagens
CREATE POLICY "Users can view messages from their conversations" 
ON public.support_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.support_conversations sc 
    WHERE sc.id = conversation_id 
    AND (sc.user_id = auth.uid() OR sc.session_id = current_setting('app.session_id', true))
  )
);

CREATE POLICY "Users can send messages to their conversations" 
ON public.support_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_conversations sc 
    WHERE sc.id = conversation_id 
    AND (sc.user_id = auth.uid() OR sc.session_id = current_setting('app.session_id', true))
  )
);

-- Admins podem ver e enviar todas as mensagens
CREATE POLICY "Admins can manage all messages" 
ON public.support_messages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_support_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_conversations_updated_at
BEFORE UPDATE ON public.support_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_support_conversations_updated_at();

-- Função para notificar novos chats aos admins
CREATE OR REPLACE FUNCTION public.notify_new_support_chat()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar notificação para admins
  INSERT INTO public.notifications (type, message, user_id, metadata)
  SELECT 
    'new_support_chat',
    'Nova conversa de suporte criada',
    ur.user_id,
    jsonb_build_object(
      'conversation_id', NEW.id,
      'subject', NEW.subject,
      'priority', NEW.priority
    )
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_new_support_chat
AFTER INSERT ON public.support_conversations
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_support_chat();