
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageCircle, Sparkles, Brain, Database } from 'lucide-react';
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
    return lastMessage?.content?.substring(0, 120) + '...' || 'Nova sessão neural inicializada';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-950/50 text-green-300 border-green-800/50';
      case 'active': return 'bg-tech-950/50 text-tech-300 border-tech-800/50';
      case 'abandoned': return 'bg-gray-950/50 text-gray-400 border-gray-800/50';
      default: return 'bg-gray-950/50 text-gray-400 border-gray-800/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Processamento Completo';
      case 'active': return 'Sistema Ativo';
      case 'abandoned': return 'Sessão Interrompida';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-tech-800/50 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-tech-900/50 rounded-xl border border-tech-800/30"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="ai-glow w-16 h-16 rounded-full bg-gradient-to-r from-tech-500 to-gold-500 flex items-center justify-center mx-auto mb-6">
          <Database className="h-8 w-8 text-white" />
        </div>
        <h3 className="font-playfair text-xl font-semibold text-white mb-2">
          Banco de Dados Neural Vazio
        </h3>
        <p className="text-tech-400 mb-2">Nenhuma sessão de curadoria encontrada no sistema</p>
        <p className="text-sm text-tech-500">Inicie uma conversa para criar seu primeiro registro neural</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Brain className="h-6 w-6 text-gold-400" />
        <h3 className="font-playfair text-xl font-semibold text-white">
          Registros Neurais de Curadoria
        </h3>
        <div className="flex items-center space-x-2 text-tech-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm">{sessions.length} sessões armazenadas</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {sessions.map((session, index) => (
          <Card 
            key={session.id} 
            className={`tech-card hover:border-gold-500/50 cursor-pointer transition-all duration-500 hover:scale-[1.02] animate-fade-in ${
              currentSessionId === session.id ? 'ring-2 ring-gold-400/50 border-gold-500/50' : ''
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => onLoadSession(session)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-tech-600 to-gold-600 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <span className="text-white">
                        {formatDistanceToNow(new Date(session.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                      <div className="text-xs text-tech-400 mt-1">
                        ID: {session.id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </CardTitle>
                <Badge className={`${getStatusColor(session.session_status)} border`}>
                  {getStatusText(session.session_status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-tech-300 text-sm mb-4 leading-relaxed">
                {getSessionPreview(session)}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-tech-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{session.conversation_json?.length || 0} interações</span>
                  </div>
                  {session.recommended_perfumes && session.recommended_perfumes.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Sparkles className="h-3 w-3 text-gold-400" />
                      <span className="text-gold-400">{session.recommended_perfumes.length} recomendações</span>
                    </div>
                  )}
                </div>
                {currentSessionId === session.id && (
                  <div className="flex items-center space-x-1 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs">Ativo</span>
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
