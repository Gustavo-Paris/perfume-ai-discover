import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Sparkles, Star, AtomIcon } from 'lucide-react';
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
      case 'completed': return 'bg-ai-complete/20 text-ai-complete border-ai-complete/30';
      case 'active': return 'bg-ai-active/20 text-ai-active border-ai-active/30';
      case 'abandoned': return 'bg-luxury-400/20 text-luxury-500 border-luxury-400/30';
      default: return 'bg-luxury-400/20 text-luxury-500 border-luxury-400/30';
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
          <div className="h-6 bg-luxury-300/50 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-luxury-100/50 rounded-2xl border border-luxury-200/30"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="cyber-glow w-16 h-16 rounded-full bg-gradient-gold-elegant flex items-center justify-center mx-auto mb-6">
          <AtomIcon className="h-8 w-8 text-white" />
        </div>
        <h3 className="font-cormorant text-2xl font-semibold text-luxury-700 mb-2">
          Nenhuma Sessão Encontrada
        </h3>
        <p className="text-luxury-500 mb-2 font-montserrat">Nenhuma sessão de curadoria encontrada no sistema</p>
        <p className="text-sm text-luxury-400 font-montserrat">Inicie uma conversa para criar seu primeiro registro</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Star className="h-6 w-6 text-gold-500" />
        <h3 className="font-cormorant text-2xl font-semibold text-luxury-700">
          Histórico de Curadorias
        </h3>
        <div className="cyber-status text-ai-active font-montserrat">
          <span className="text-sm">{sessions.length} sessões armazenadas</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {sessions.map((session, index) => (
          <Card 
            key={session.id} 
            className={`luxury-card tech-overlay hover:border-gold-400/50 cursor-pointer transition-all duration-700 hover:scale-[1.02] animate-fade-in ${
              currentSessionId === session.id ? 'ring-2 ring-gold-400/50 border-gold-400/50' : ''
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => onLoadSession(session)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-luxury-700">
                  <div className="flex items-center space-x-3">
                    <div className="cyber-glow w-8 h-8 rounded-full bg-gradient-to-r from-gold-500 to-luxury-600 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <span className="text-luxury-700 font-montserrat">
                        {formatDistanceToNow(new Date(session.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                      <div className="text-xs text-luxury-500 mt-1 font-montserrat">
                        ID: {session.id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </CardTitle>
                <Badge className={`${getStatusColor(session.session_status)} border font-montserrat`}>
                  {getStatusText(session.session_status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-luxury-600 text-sm mb-4 leading-relaxed font-montserrat">
                {getSessionPreview(session)}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-luxury-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-montserrat">{session.conversation_json?.length || 0} interações</span>
                  </div>
                  {session.recommended_perfumes && session.recommended_perfumes.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-gold-500" />
                      <span className="text-gold-600 font-montserrat">{session.recommended_perfumes.length} recomendações</span>
                    </div>
                  )}
                </div>
                {currentSessionId === session.id && (
                  <div className="cyber-status text-ai-active font-montserrat">
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
