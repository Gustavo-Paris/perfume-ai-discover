export interface SupportConversation {
  id: string;
  user_id?: string;
  session_id?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  subject?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  assigned_to?: string;
  rating?: number;
  feedback?: string;
}

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_id?: string;
  sender_type: 'user' | 'agent' | 'system';
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  attachments?: any;
  read_at?: string;
  created_at: string;
}

export interface SupportChatState {
  isOpen: boolean;
  conversation?: SupportConversation;
  messages: SupportMessage[];
  isLoading: boolean;
  isTyping: boolean;
}