
import { useState, useEffect } from 'react';
import { Sparkles, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import ConversationChat from '@/components/curadoria/ConversationChat';
import RecommendationResults from '@/components/curadoria/RecommendationResults';
import SessionHistory from '@/components/curadoria/SessionHistory';
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
      <div className="min-h-screen bg-gradient-to-br from-gold-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">Ops! Algo deu errado:</p>
              <p className="text-red-800 font-medium mb-4">{error}</p>
              <button 
                onClick={handleReset}
                className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Tentar Novamente
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gold-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-playfair text-3xl font-bold">
              Histórico de Curadorias
            </h1>
            <Button 
              onClick={() => setShowHistory(false)}
              variant="outline"
            >
              Voltar
            </Button>
          </div>
          
          <Card className="perfume-card">
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
      <div className="min-h-screen bg-gradient-to-br from-gold-50 to-white py-12">
        <div className="container mx-auto px-4">
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
      <div className="min-h-screen bg-gradient-to-br from-gold-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full gradient-gold flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Sparkles className="h-10 w-10 text-white animate-spin" />
            </div>
            <h2 className="font-playfair text-3xl font-bold mb-4">
              Analisando suas preferências...
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Estou processando nossa conversa e encontrando os perfumes perfeitos para você
            </p>
            <div className="mt-8 flex justify-center space-x-2">
              <div className="w-3 h-3 bg-gold-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-playfair text-3xl md:text-4xl font-bold mb-4">
            Curadoria Inteligente
          </h1>
          <p className="text-muted-foreground text-lg">
            Converse comigo e descobriremos juntos suas 3 fragrâncias ideais
          </p>
          
          {isAuthenticated && (
            <div className="mt-4 flex justify-center space-x-4">
              <Button 
                onClick={() => setShowHistory(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <History className="h-4 w-4" />
                <span>Ver Histórico</span>
              </Button>
              
              {currentSessionId && (
                <div className="text-sm text-green-600 flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Sessão ativa salva</span>
                </div>
              )}
            </div>
          )}
        </div>

        <Card className="perfume-card h-[700px]">
          <CardHeader>
            <CardTitle className="font-playfair text-xl text-center">
              Sua Consultoria Personalizada
            </CardTitle>
          </CardHeader>
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
      </div>
    </div>
  );
};

export default Curadoria;
