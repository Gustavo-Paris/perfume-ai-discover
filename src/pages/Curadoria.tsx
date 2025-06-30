
import { useState, useEffect } from 'react';
import { Sparkles, History, Zap, Brain, Cpu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import ConversationChat from '@/components/curadoria/ConversationChat';
import RecommendationResults from '@/components/curadoria/RecommendationResults';
import SessionHistory from '@/components/curadoria/SessionHistory';
import FloatingParticles from '@/components/ui/floating-particles';
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
      // Check if message contains analysis phrase
      const isAnalysisMessage = message.toLowerCase().includes('deixe-me analisar') || 
                                message.toLowerCase().includes('analisar suas preferências') ||
                                message.toLowerCase().includes('encontrar os perfumes ideais');
      
      if (isAnalysisMessage) {
        setIsAnalyzing(true);
      }

      const response = await sendMessage(message);
      
      if (response.isComplete && response.recommendations) {
        // Show analyzing state for a moment before showing results
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
    // Keep the conversation history and recommendations for context
    // Add a system message to help the AI understand the context
    const contextMessage = "O usuário viu as 3 recomendações mas gostaria de explorar outras opções. Continue a conversa perguntando o que não agradou nas sugestões anteriores para refinar ainda mais.";
    sendMessage(contextMessage);
  };

  const handleLoadSession = async (session: ConversationalSession) => {
    try {
      // This will be handled by the useConversationalRecommend hook
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
      <div className="min-h-screen bg-gradient-to-br from-tech-950 via-tech-900 to-tech-950 neural-bg py-12 relative overflow-hidden">
        <FloatingParticles count={15} />
        <div className="container mx-auto px-4 max-w-2xl relative z-10">
          <Card className="tech-card border-red-500/50 bg-red-950/20">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <p className="text-red-400 mb-4 text-lg">Sistema Temporariamente Indisponível</p>
              <p className="text-red-300 font-medium mb-6">{error}</p>
              <Button 
                onClick={handleReset}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border-0"
              >
                <Cpu className="mr-2 h-4 w-4" />
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
      <div className="min-h-screen bg-gradient-to-br from-tech-950 via-tech-900 to-tech-950 neural-bg py-12 relative overflow-hidden">
        <FloatingParticles count={25} />
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="font-playfair text-4xl font-bold text-white">
              <span className="gradient-text">Histórico Neural</span>
            </h1>
            <Button 
              onClick={() => setShowHistory(false)}
              variant="outline"
              className="glass-dark text-white border-tech-700 hover:border-gold-500/50 hover:bg-tech-800/50"
            >
              <Brain className="mr-2 h-4 w-4" />
              Voltar ao Sistema
            </Button>
          </div>
          
          <Card className="tech-card">
            <CardContent className="p-6">
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
      <div className="min-h-screen bg-gradient-to-br from-tech-950 via-tech-900 to-tech-950 neural-bg py-12 relative overflow-hidden">
        <FloatingParticles count={30} />
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
      <div className="min-h-screen bg-gradient-to-br from-tech-950 via-tech-900 to-tech-950 neural-bg py-12 relative overflow-hidden flex items-center justify-center">
        <FloatingParticles count={40} />
        <div className="text-center relative z-10 max-w-2xl mx-auto px-4">
          <div className="ai-glow w-32 h-32 rounded-full bg-gradient-to-r from-tech-500 to-gold-500 flex items-center justify-center mx-auto mb-8 animate-glow-pulse">
            <Brain className="h-16 w-16 text-white animate-pulse" />
          </div>
          <h2 className="font-playfair text-4xl font-bold mb-6 text-white">
            <span className="gradient-text typing-effect">Processamento Neural Ativo</span>
          </h2>
          <p className="text-xl text-tech-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Nossa IA está analisando suas preferências através de algoritmos avançados para descobrir as fragrâncias perfeitas
          </p>
          <div className="flex justify-center items-center space-x-3 mb-8">
            <div className="w-3 h-3 bg-tech-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-tech-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <div className="bg-tech-900/50 backdrop-blur-sm rounded-lg p-4 border border-tech-800/50">
            <div className="flex items-center justify-center space-x-2 text-tech-400">
              <Cpu className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processando dados sensoriais...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tech-950 via-tech-900 to-tech-950 neural-bg py-12 relative overflow-hidden">
      <FloatingParticles count={25} />
      
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <div className="ai-glow w-20 h-20 rounded-full bg-gradient-ai flex items-center justify-center mx-auto mb-8 animate-gradient-x">
            <Sparkles className="h-10 w-10 text-white animate-pulse" />
          </div>
          <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Curadoria Neural</span>
          </h1>
          <p className="text-tech-300 text-xl mb-2 max-w-2xl mx-auto leading-relaxed">
            Sistema de Inteligência Artificial avançado para descoberta de fragrâncias
          </p>
          <p className="text-tech-400 text-lg max-w-xl mx-auto">
            Converse com nossa IA e descubra suas 3 fragrâncias ideais através de análise comportamental
          </p>
          
          {isAuthenticated && (
            <div className="mt-8 flex justify-center items-center space-x-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Button 
                onClick={() => setShowHistory(true)}
                variant="outline"
                className="glass-dark text-white border-tech-700/50 hover:border-gold-500/50 hover:bg-tech-800/50 transition-all duration-300"
              >
                <History className="h-4 w-4 mr-2" />
                <span>Histórico Neural</span>
              </Button>
              
              {currentSessionId && (
                <div className="flex items-center space-x-2 text-green-400 bg-green-950/20 px-4 py-2 rounded-full border border-green-800/50">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Sessão Ativa</span>
                </div>
              )}
            </div>
          )}
        </div>

        <Card className="tech-card h-[750px] overflow-hidden animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <CardHeader className="border-b border-tech-800/50 bg-gradient-to-r from-tech-950/80 to-tech-900/80">
            <CardTitle className="font-playfair text-2xl text-center text-white flex items-center justify-center space-x-3">
              <Brain className="h-6 w-6 text-gold-400 animate-pulse" />
              <span>Interface de Curadoria Inteligente</span>
              <Cpu className="h-6 w-6 text-tech-400 animate-neural-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full p-0 bg-gradient-to-b from-tech-950/40 to-tech-900/60">
            <ConversationChat
              messages={conversation.messages}
              onSendMessage={handleSendMessage}
              onReset={handleReset}
              loading={loading}
              isComplete={conversation.isComplete}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Curadoria;
