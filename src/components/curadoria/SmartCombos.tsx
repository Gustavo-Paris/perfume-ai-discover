import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Sparkles, DollarSign, Package, Clock } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useComboRecommend, ComboRecommendation } from '@/hooks/useComboRecommend';
import { ConversationMessage } from '@/types/conversation';
import { toast } from '@/hooks/use-toast';
import { useBudgetDetection } from '@/hooks/useBudgetDetection';

interface SmartCombosProps {
  conversationHistory: ConversationMessage[];
  recommendedPerfumes: string[];
  onBackToResults: () => void;
}

const SmartCombos = ({ conversationHistory, recommendedPerfumes, onBackToResults }: SmartCombosProps) => {
  const [budget, setBudget] = useState<string>('300');
  const [showCombos, setShowCombos] = useState(false);
  const { addToCart } = useCart();
  const { generateCombos, loading, error, data } = useComboRecommend();
  const { detectBudgetFromConversation } = useBudgetDetection();

  // Remove auto-detection since budget is no longer asked in conversation
  // Budget will be input directly by user in this screen

  const handleGenerateCombos = async (budgetValue?: number) => {
    const finalBudget = budgetValue || parseFloat(budget);
    if (isNaN(finalBudget) || finalBudget <= 0) {
      toast({
        title: "Orçamento inválido",
        description: "Digite um valor válido para o orçamento",
        variant: "destructive"
      });
      return;
    }

    try {
      await generateCombos(conversationHistory, finalBudget, recommendedPerfumes);
      setShowCombos(true);
    } catch (error) {
      toast({
        title: "Erro ao gerar combos",
        description: "Não foi possível gerar os combos. Tente novamente.",
        variant: "destructive"
      });
    }
  };


  const handleAddComboToCart = async (combo: ComboRecommendation) => {
    try {
      for (const item of combo.items) {
        await addToCart({
          perfume_id: item.perfume_id,
          size_ml: item.size_ml,
          quantity: 1
        });
      }
      
      toast({
        title: "Combo adicionado!",
        description: `${combo.name} foi adicionado ao seu carrinho`,
      });
    } catch (error) {
      toast({
        title: "Erro ao adicionar combo",
        description: "Não foi possível adicionar o combo ao carrinho",
        variant: "destructive"
      });
    }
  };

  const getOccasionColor = (occasion: string) => {
    const colors: Record<string, string> = {
      'dia': 'bg-yellow-100 text-yellow-800',
      'noite': 'bg-purple-100 text-purple-800',
      'trabalho': 'bg-blue-100 text-blue-800',
      'lazer': 'bg-green-100 text-green-800',
      'versatil': 'bg-gray-100 text-gray-800',
      'romantico': 'bg-pink-100 text-pink-800',
      'formal': 'bg-indigo-100 text-indigo-800'
    };
    return colors[occasion] || 'bg-gray-100 text-gray-800';
  };

  if (showCombos && data) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-playfair text-3xl font-bold mb-4">
            Combos Inteligentes
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
            Baseado em suas preferências e orçamento de R$ {budget}
          </p>
          <p className="text-sm text-muted-foreground">
            Combos otimizados para aproveitar {data.budget_used > 0 ? `${((data.budget_used/parseFloat(budget))*100).toFixed(0)}% do seu orçamento` : 'seu orçamento completo'}
          </p>
        </div>

        {data.combos.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum combo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Não conseguimos criar combos dentro do orçamento informado. Tente aumentar o valor ou volte às recomendações individuais.
              </p>
              <Button onClick={onBackToResults} variant="outline">
                Voltar às Recomendações
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {data.combos.map((combo) => (
              <Card key={combo.id} className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
                  <CardTitle className="flex items-center justify-between">
                    <span className="font-playfair text-xl">{combo.name}</span>
                    <Badge variant="secondary" className="text-lg font-bold">
                      R$ {combo.total.toFixed(2)}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{combo.description}</p>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-4 mb-6">
                    {combo.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        {item.perfume.image_url && (
                          <img 
                            src={item.perfume.image_url} 
                            alt={item.perfume.name}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.perfume.brand}</h4>
                          <p className="text-xs text-muted-foreground">{item.perfume.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {item.size_ml}ml
                            </Badge>
                            <span className="text-xs font-semibold">
                              R$ {item.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {combo.occasions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Ocasiões ideais:</p>
                      <div className="flex flex-wrap gap-1">
                        {combo.occasions.map((occasion) => (
                          <Badge 
                            key={occasion} 
                            variant="secondary" 
                            className={`text-xs ${getOccasionColor(occasion)}`}
                          >
                            {occasion}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />
                  
                  <Button 
                    onClick={() => handleAddComboToCart(combo)}
                    className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Adicionar Combo ao Carrinho
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center space-y-4">
          <Button onClick={onBackToResults} variant="outline" size="lg">
            Ver Recomendações Individuais
          </Button>
          
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={() => setShowCombos(false)}
              variant="ghost"
            >
              Tentar Outro Orçamento
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="font-playfair text-3xl font-bold mb-4">
          Combos Inteligentes
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Vamos criar combos personalizados baseados no seu orçamento e nas preferências descobertas na conversa
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Qual seu orçamento?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Orçamento disponível (R$)
            </label>
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Ex: 300"
              min="50"
              step="10"
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Valor mínimo: R$ 50
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">💡 Como funciona:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Analisamos suas preferências da conversa</li>
              <li>• Criamos combos de 2-4 perfumes complementares</li>
              <li>• Variamos tamanhos para otimizar seu orçamento</li>
              <li>• Sugerimos para diferentes ocasiões</li>
            </ul>
          </div>

          <Button 
            onClick={() => handleGenerateCombos()}
            disabled={loading || !budget || parseFloat(budget) < 50}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando Combos...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Combos Inteligentes
              </>
            )}
          </Button>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={onBackToResults} variant="outline">
          Voltar às Recomendações
        </Button>
      </div>
    </div>
  );
};

export default SmartCombos;