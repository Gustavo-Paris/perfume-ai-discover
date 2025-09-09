import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Percent, TrendingUp, Calculator } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MarginConfig {
  category: string;
  currentMargin: number;
  suggestedMargin: number;
  perfumeCount: number;
  color: string;
}

const ProfitMarginConfig = () => {
  const [margins, setMargins] = useState<MarginConfig[]>([
    {
      category: 'Premium',
      currentMargin: 80,
      suggestedMargin: 80,
      perfumeCount: 10,
      color: 'bg-blue-500'
    },
    {
      category: 'Luxury', 
      currentMargin: 60,
      suggestedMargin: 60,
      perfumeCount: 8,
      color: 'bg-purple-500'
    },
    {
      category: 'Ultra Luxury',
      currentMargin: 40,
      suggestedMargin: 40,
      perfumeCount: 5,
      color: 'bg-amber-500'
    }
  ]);

  const [globalMargin, setGlobalMargin] = useState(50);

  const handleMarginUpdate = (category: string, newMargin: number) => {
    setMargins(prev => 
      prev.map(margin => 
        margin.category === category 
          ? { ...margin, currentMargin: newMargin }
          : margin
      )
    );
  };

  const applyMargins = async () => {
    try {
      // Aqui você faria a chamada para atualizar no banco
      toast({
        title: "Margens atualizadas!",
        description: "As margens de lucro foram aplicadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar margens.",
        variant: "destructive",
      });
    }
  };

  const calculatePrice = (cost: number, margin: number) => {
    return cost / (1 - margin / 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Configuração de Margens de Lucro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Margem Global */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Margem Padrão Global</Label>
            <div className="flex gap-3 items-center">
              <Input
                type="number"
                min="1"
                max="90"
                value={globalMargin}
                onChange={(e) => setGlobalMargin(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-gray-600">%</span>
              <Badge variant="secondary" className="ml-auto">
                Para novos perfumes sem categoria
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Margens por Categoria */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Margens por Categoria</Label>
            <div className="grid gap-4">
              {margins.map((margin) => (
                <Card key={margin.category} className="bg-gray-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded ${margin.color}`} />
                        <h4 className="font-semibold">{margin.category}</h4>
                        <Badge variant="outline" className="text-xs">
                          {margin.perfumeCount} perfumes
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Margem Atual */}
                      <div className="space-y-2">
                        <Label className="text-sm">Margem Atual</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            min="1"
                            max="90"
                            value={margin.currentMargin}
                            onChange={(e) => handleMarginUpdate(margin.category, Number(e.target.value))}
                            className="w-20"
                          />
                          <span className="text-sm">%</span>
                        </div>
                      </div>

                      {/* Margem Sugerida */}
                      <div className="space-y-2">
                        <Label className="text-sm text-green-600 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Sugerida
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-green-600">{margin.suggestedMargin}%</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarginUpdate(margin.category, margin.suggestedMargin)}
                            className="text-xs h-6"
                          >
                            Aplicar
                          </Button>
                        </div>
                      </div>

                      {/* Exemplo de Cálculo */}
                      <div className="space-y-2">
                        <Label className="text-sm text-blue-600 flex items-center gap-1">
                          <Calculator className="h-3 w-3" />
                          Exemplo (R$ 10 custo)
                        </Label>
                        <div className="text-sm">
                          <span className="font-semibold">
                            R$ {calculatePrice(10, margin.currentMargin).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Informações de Mercado */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Margens de Mercado</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Premium:</strong> 80% - Perfumes de uso diário e marcas consolidadas</p>
              <p><strong>Luxury:</strong> 60% - Perfumes de nicho e ocasiões especiais</p>
              <p><strong>Ultra Luxury:</strong> 40% - Perfumes exclusivos e edições limitadas</p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button onClick={applyMargins} className="flex-1">
              Aplicar Todas as Margens
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Restaurar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitMarginConfig;