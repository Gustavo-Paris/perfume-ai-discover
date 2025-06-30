
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageCircle, Sparkles } from 'lucide-react';
import { useConversationalSessions, ConversationalSession } from '@/hooks/useConversationalSessions';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SessionHistoryProps {
  onLoadSession: (session: ConversationalSession) => void;
  currentSessionId?: string | null;
}

const SessionHistory = ({ onLoadSession, currentSessionId }: SessionHistoryProps) => {
  const [sessions, setSessions] = useState<ConversationalSession[]>([]);
  const { getUserSessions, loading } = useConversationalSessions();

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const userSessions = await getUserSessions();
        setSessions(userSessions || []);
      } catch (err) {
        console.error('Error loading sessions:', err);
      }
    };

    loadSessions();
  }, [getUserSessions]);

  const getSessionPreview = (session: ConversationalSession) => {
    const messages = session.conversation_json || [];
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.content?.substring(0, 100) + '...' || 'Nova conversa';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'abandoned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'active': return 'Ativa';
      case 'abandoned': return 'Abandonada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Nenhuma sessão de curadoria encontrada</p>
        <p className="text-sm text-gray-400">Inicie uma conversa para criar sua primeira sessão</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-playfair text-lg font-semibold text-gray-800">
        Suas Sessões de Curadoria
      </h3>
      
      <div className="space-y-3">
        {sessions.map((session) => (
          <Card 
            key={session.id} 
            className={`hover:shadow-md transition-shadow cursor-pointer ${
              currentSessionId === session.id ? 'ring-2 ring-gold-400' : ''
            }`}
            onClick={() => onLoadSession(session)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(session.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  </div>
                </CardTitle>
                <Badge className={getStatusColor(session.session_status)}>
                  {getStatusText(session.session_status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                {getSessionPreview(session)}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{session.conversation_json?.length || 0} mensagens</span>
                </div>
                {session.recommended_perfumes && session.recommended_perfumes.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Sparkles className="h-3 w-3" />
                    <span>{session.recommended_perfumes.length} recomendações</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SessionHistory;
