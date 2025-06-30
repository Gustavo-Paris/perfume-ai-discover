import { useState, useEffect } from 'react';
import { Sparkles, History, Zap, Star, AtomIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import ConversationChat from '@/components/curadoria/ConversationChat';
import RecommendationResults from '@/components/curadoria/RecommendationResults';
import SessionHistory from '@/components/curadoria/SessionHistory';
import AIBeam from '@/components/ui/AIBeam';
import { useConversationalRecommend } from '@/hooks/useConversationalRecommend';
import { useConversationalSessions, ConversationalSession } from '@/hooks/useConversationalSessions';
import { supabase } from '@/integrations/supabase/client';

const Curadoria = () => {
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { 
    conversation, 
    sendMessage, 
    resetConversation, 
    currentSessionId,
    loading, 
    error 
  } = useConversationalRecommend();

  const { getSession } = useConversationalSessions();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load session data when conversation changes
  useEffect(() => {
    const loadSessionRecommendations = async () => {
      if (currentSessionId && conversation.isComplete) {
        try {
          const session = await getSession(currentSessionId);
          if (session.recommended_perfumes) {
            setRecommendedIds(session.recommended_perfumes);
            if (session.session_status === 'completed') {
              setShowResults(true);
            }
          }
        } catch (err) {
          console.log('Error loading session recommendations:', err);
        }
      }
    };

    loadSessionRecommendations();
  }, [currentSessionId, conversation.isComplete, getSession]);

  const handleSendMessage = async (message: string) => {
    try {
      const isAnalysisMessage = message.toLowerCase().includes('deixe-me analisar') || 
                                message.toLowerCase().includes('analisar suas preferências') ||
                                message.toLowerCase().includes('encontrar os perfumes ideais');
      
      if (isAnalysisMessage) {
        setIsAnalyzing(true);
      }

      const response = await sendMessage(message);
      
      if (response.isComplete && response.recommendations) {
        setTimeout(() => {
          setRecommendedIds(response.recommendations);
          setShowResults(true);
          setIsAnalyzing(false);
        }, 2000);
      } else {
        setIsAnalyzing(false);
      }
    } catch (error) {
      setIsAnalyzing(false);
      toast({
        title: "Erro na conversa",
        description: "Houve um problema. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    resetConversation();
    setRecommendedIds([]);
    setShowResults(false);
    setIsAnalyzing(false);
  };

  const handleStartOver = () => {
    handleReset();
  };

  const handleContinueConversation = () => {
    setShowResults(false);
    setIsAnalyzing(false);
    const contextMessage = "O usuário viu as 3 recomendações mas gostaria de explorar outras opções. Continue a conversa perguntando o que não agradou nas sugestões anteriores para refinar ainda mais.";
    sendMessage(contextMessage);
  };

  const handleLoadSession = async (session: ConversationalSession) => {
    try {
      setShowHistory(false);
      
      if (session.recommended_perfumes && session.session_status === 'completed') {
        setRecommendedIds(session.recommended_perfumes);
        setShowResults(true);
      }
      
      toast({
        title: "Sessão carregada",
        description: "Sua conversa anterior foi restaurada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar sessão",
        description: "Não foi possível carregar a sessão. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-navy py-12 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-2xl relative z-10">
          <Card className="glass-gold border-red-500/50">
            <CardContent className="p-6 text-center">
              <motion.div 
                className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="h-8 w-8 text-red-400" />
              </motion.div>
              <p className="text-red-400 mb-4 text-lg font-display">Sistema Temporariamente Indisponível</p>
              <p className="text-white/70 mb-6">{error}</p>
              <Button 
                onClick={handleReset}
                className="btn-primary"
              >
                <AtomIcon className="mr-2 h-4 w-4" />
                Reconectar Sistema
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="min-h-screen bg-navy py-12 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <motion.div 
            className="mb-8 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-4xl font-bold text-gold">
              Histórico de Curadoria
            </h1>
            <Button 
              onClick={() => setShowHistory(false)}
              className="btn-secondary"
            >
              <Star className="mr-2 h-4 w-4" />
              Voltar ao Sistema
            </Button>
          </motion.div>
          
          <Card className="glass-gold rounded-3xl">
            <CardContent className="p-8">
              <SessionHistory 
                onLoadSession={handleLoadSession}
                currentSessionId={currentSessionId}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-navy py-12 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <RecommendationResults 
            recommendedIds={recommendedIds}
            onStartOver={handleStartOver}
            onContinueConversation={handleContinueConversation}
          />
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-navy py-12 relative overflow-hidden flex items-center justify-center">
        <div className="text-center relative z-10 max-w-2xl mx-auto px-4">
          <motion.div 
            className="w-32 h-32 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-8"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Sparkles className="h-16 w-16 text-gold" />
          </motion.div>
          <motion.h2 
            className="font-display text-4xl font-bold mb-6 text-gold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Análise Inteligente
          </motion.h2>
          <p className="text-xl text-white/80 max-w-xl mx-auto mb-8 leading-relaxed">
            Nossa inteligência artificial está processando suas preferências para descobrir as fragrâncias perfeitas
          </p>
          <div className="typing-dots justify-center mb-8">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
          <div className="glass-gold rounded-2xl p-6">
            <div className="flex items-center justify-center space-x-2 text-gold/70">
              <span className="text-sm">Processando dados sensoriais...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy py-12 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <motion.div 
          className="text-center mb-16 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-6xl md:text-7xl font-bold mb-6 text-gold">
            Curadoria Inteligente
          </h1>
          <p className="text-white/80 text-xl mb-2 max-w-2xl mx-auto leading-relaxed">
            Tecnologia avançada para descoberta personalizada de fragrâncias
          </p>
          <p className="text-white/60 text-lg max-w-xl mx-auto mb-8">
            Converse com nossa IA e descubra suas 3 fragrâncias ideais
          </p>
          
          <AIBeam />
          
          {isAuthenticated && (
            <motion.div 
              className="flex justify-center items-center space-x-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                onClick={() => setShowHistory(true)}
                className="btn-secondary"
              >
                <History className="h-4 w-4 mr-2" />
                <span>Histórico</span>
              </Button>
              
              {currentSessionId && (
                <div className="flex items-center space-x-2 glass-gold px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gold">Sistema Ativo</span>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-gold rounded-3xl h-[700px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <CardContent className="h-full p-0">
              <ConversationChat
                messages={conversation.messages}
                onSendMessage={handleSendMessage}
                onReset={handleReset}
                loading={loading}
                isComplete={conversation.isComplete}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Curadoria;
