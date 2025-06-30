
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import ConversationChat from '@/components/curadoria/ConversationChat';
import RecommendationResults from '@/components/curadoria/RecommendationResults';
import { useConversationalRecommend } from '@/hooks/useConversationalRecommend';

const Curadoria = () => {
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const { 
    conversation, 
    sendMessage, 
    resetConversation, 
    loading, 
    error 
  } = useConversationalRecommend();

  const handleSendMessage = async (message: string) => {
    try {
      const response = await sendMessage(message);
      
      if (response.isComplete && response.recommendations) {
        setRecommendedIds(response.recommendations);
        setShowResults(true);
      }
    } catch (error) {
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
  };

  const handleStartOver = () => {
    handleReset();
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

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gold-50 to-white py-12">
        <div className="container mx-auto px-4">
          <RecommendationResults 
            recommendedIds={recommendedIds}
            onStartOver={handleStartOver}
          />
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
            Converse comigo e descobriremos juntos suas fragrâncias ideais
          </p>
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
