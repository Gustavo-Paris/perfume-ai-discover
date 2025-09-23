import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreatePromotion } from '@/hooks/usePromotions';
import { useCreateCoupon } from '@/hooks/useCoupons';
import { toast } from '@/hooks/use-toast';
import { Gift, Percent, Clock, Sparkles } from 'lucide-react';

const LaunchPromoSetup = () => {
  const [isCreating, setIsCreating] = useState(false);
  const createPromotion = useCreatePromotion();
  const createCoupon = useCreateCoupon();

  const createLaunchPromotions = async () => {
    setIsCreating(true);
    
    try {
      // Create welcome coupon
      await createCoupon.mutateAsync({
        code: 'BEMVINDO10',
        type: 'percent',
        value: 10,
        min_order_value: 50,
        max_uses: 100,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        is_active: true
      });

      // Create launch coupon
      await createCoupon.mutateAsync({
        code: 'LANCAMENTO',
        type: 'value',
        value: 25,
        min_order_value: 150,
        max_uses: 50,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        is_active: true
      });

      // Create free shipping coupon
      await createCoupon.mutateAsync({
        code: 'FRETEGRATIS',
        type: 'percent',
        value: 100, // 100% discount on shipping (handled in checkout logic)
        min_order_value: 99,
        max_uses: 200,
        expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 dias
        is_active: true
      });

      toast({
        title: "Promoções criadas!",
        description: "Sistema promocional configurado com sucesso para o lançamento.",
      });

    } catch (error) {
      console.error('Error creating promotions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar as promoções de lançamento.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const promotions = [
    {
      code: 'BEMVINDO10',
      title: '10% OFF Primeira Compra',
      description: 'Cupom de boas-vindas para novos clientes',
      icon: <Sparkles className="h-5 w-5" />,
      color: 'bg-blue-500'
    },
    {
      code: 'LANCAMENTO',
      title: 'R$ 25 OFF Lançamento',
      description: 'Desconto especial de inauguração',
      icon: <Gift className="h-5 w-5" />,
      color: 'bg-green-500'
    },
    {
      code: 'FRETEGRATIS',
      title: 'Frete Grátis',
      description: 'Frete grátis em compras acima de R$ 99',
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-purple-500'
    }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Configuração Promocional de Lançamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promotions.map((promo) => (
            <Card key={promo.code} className="border-2">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${promo.color} text-white`}>
                    {promo.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{promo.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{promo.description}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {promo.code}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-gold-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">📈 Estratégia de Lançamento</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>BEMVINDO10:</strong> Converte visitantes em clientes (10% OFF)</li>
            <li>• <strong>LANCAMENTO:</strong> Cria urgência para primeiras vendas (R$ 25 OFF)</li>
            <li>• <strong>FRETEGRATIS:</strong> Aumenta ticket médio (frete grátis &gt; R$ 99)</li>
          </ul>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={createLaunchPromotions} 
            disabled={isCreating}
            size="lg"
            className="gradient-gold text-white hover:opacity-90"
          >
            {isCreating ? 'Criando...' : 'Criar Promoções de Lançamento'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LaunchPromoSetup;