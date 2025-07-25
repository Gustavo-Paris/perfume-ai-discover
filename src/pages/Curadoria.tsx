import { useState, useEffect } from 'react';
import { Sparkles, History, Zap, AtomIcon, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import ConversationChat from '@/components/curadoria/ConversationChat';
import RecommendationResults from '@/components/curadoria/RecommendationResults';
import SmartCombos from '@/components/curadoria/SmartCombos';
import SessionHistory from '@/components/curadoria/SessionHistory';
import LoadingTransition from '@/components/curadoria/LoadingTransition';
import AIBeam from '@/components/ui/AIBeam';
import ConsentBanner from '@/components/privacy/ConsentBanner';
import { useConversationalRecommend } from '@/hooks/useConversationalRecommend';
import { useConversationalSessions, ConversationalSession } from '@/hooks/useConversationalSessions';
import { usePrivacyConsent } from '@/hooks/usePrivacyConsent';
import { useRouteLogger } from '@/hooks/useAccessLog';
import { supabase } from '@/integrations/supabase/client';

const Curadoria = () => {
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showCombos, setShowCombos] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Privacy and logging hooks
  const { hasConsent } = usePrivacyConsent('PRIVACY_CHAT');
  useRouteLogger('/curadoria');

  const { 
    conversation, 
    sendMessage, 
    resetConversation, 
    updateConversation,
    currentSessionId,
    loading, 
    error,
    showLoadingTransition,
    setShowLoadingTransition
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
          
        }
      }
    };

    loadSessionRecommendations();
  }, [currentSessionId, conversation.isComplete, getSession]);

  const handleSendMessage = async (message: string) => {
    try {
      const response = await sendMessage(message);
      
      if (response.isComplete && response.recommendations) {
        setRecommendedIds(response.recommendations);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Don't show toast for errors that are already handled in the error state
      // The error will be displayed in the UI through the error state
    }
  };

  const handleReset = () => {
    resetConversation();
    setRecommendedIds([]);
    setShowResults(false);
    setShowCombos(false);
    setIsAnalyzing(false);
    setShowLoadingTransition(false);
  };

  const handleStartOver = () => {
    handleReset();
  };

  const handleContinueConversation = () => {
    setShowResults(false);
    setShowCombos(false);
    setIsAnalyzing(false);
    setShowLoadingTransition(false);
    const contextMessage = "O usuário viu as recomendações mas gostaria de explorar outras opções. Continue a conversa perguntando o que não agradou nas sugestões anteriores para refinar ainda mais.";
    sendMessage(contextMessage);
  };

  const handleShowCombos = () => {
    setShowResults(false);
    setShowCombos(true);
  };

  const handleBackToResults = () => {
    setShowCombos(false);
    setShowResults(true);
  };

  const handleLoadSession = async (session: ConversationalSession) => {
    try {
      setShowHistory(false);
      
      // Restaurar o estado da conversa completamente
      updateConversation({
        messages: session.conversation_json || [],
        isComplete: session.session_status === 'completed',
        userProfile: session.user_profile_data || {}
      });
      
      // Se tem recomendações e está completa, mostrar resultados
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

  const handleRetry = () => {
    handleReset();
    toast({
      title: "Sistema reiniciado",
      description: "Você pode começar uma nova conversa agora.",
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white py-12 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-2xl relative z-10">
          <Card className="glass border-red-500/50">
            <CardContent className="p-8 text-center">
              <motion.div 
                className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="h-10 w-10 text-red-500" />
              </motion.div>
              
              <h2 className="font-display text-2xl font-bold text-red-600 mb-4">
                Oops! Algo deu errado
              </h2>
              
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                {error}
              </p>
              
              <div className="space-y-4">
                <Button 
                  onClick={handleRetry}
                  className="btn-primary w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
                
                <p className="text-sm text-gray-500">
                  Se o problema persistir, nossa equipe foi notificada e está trabalhando na solução.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading transition when analysis is in progress
  if (showLoadingTransition) {
    return (
      <div className="min-h-screen bg-white py-12 relative overflow-hidden flex items-center justify-center">
        <div className="container mx-auto px-4 relative z-10">
          <LoadingTransition 
            onComplete={() => {
              setShowLoadingTransition(false);
              setShowResults(true);
            }}
          />
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="min-h-screen bg-white py-12 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <motion.div 
            className="mb-8 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-4xl font-bold text-gray-900">
              Histórico de Curadoria
            </h1>
            <Button 
              onClick={() => setShowHistory(false)}
              className="btn-secondary"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Voltar ao Sistema
            </Button>
          </motion.div>
          
          <Card className="glass rounded-3xl">
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

  if (showCombos) {
    return (
      <div className="min-h-screen bg-white py-12 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <SmartCombos 
            conversationHistory={conversation.messages}
            recommendedPerfumes={recommendedIds}
            onBackToResults={handleBackToResults}
          />
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-white py-12 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <RecommendationResults 
            recommendedIds={recommendedIds}
            onStartOver={handleStartOver}
            onContinueConversation={handleContinueConversation}
            onShowCombos={handleShowCombos}
          />
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-white py-12 relative overflow-hidden flex items-center justify-center">
        <div className="text-center relative z-10 max-w-2xl mx-auto px-4">
          <motion.div 
            className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-8"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Sparkles className="h-16 w-16 text-white" />
          </motion.div>
          <motion.h2 
            className="font-display text-4xl font-bold mb-6 text-brand-gradient"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Análise Inteligente
          </motion.h2>
          <p className="text-xl text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
            Nossa inteligência artificial está processando suas preferências para descobrir as fragrâncias perfeitas
          </p>
          <div className="typing-dots justify-center mb-8">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <span className="text-sm">Processando dados sensoriais...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <motion.div 
          className="text-center mb-16 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Sparkles className="w-8 h-8 text-brand-gradient" />
            <h1 className="font-display text-6xl md:text-7xl font-bold text-gray-900">
              Curadoria Inteligente
            </h1>
          </div>
          <p className="text-gray-600 text-xl mb-2 max-w-2xl mx-auto leading-relaxed">
            Tecnologia avançada para descoberta personalizada de fragrâncias
          </p>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
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
                <div className="flex items-center space-x-2 glass px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-700">Sistema Ativo</span>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="max-w-full md:max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass rounded-3xl h-[75vh] md:h-[600px] overflow-hidden shadow-xl">
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
      
      {/* Consent Banner - only show if user hasn't given consent */}
      {!hasConsent && <ConsentBanner />}
    </div>
  );
};

export default Curadoria;
