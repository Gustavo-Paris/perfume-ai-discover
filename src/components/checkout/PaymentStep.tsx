import { useState } from 'react';
import { CreditCard, QrCode, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';

interface PaymentStepProps {
  onBack: () => void;
  onSuccess: (paymentData: any) => void;
  orderDraftId: string;
  totalAmount: number;
  loading: boolean;
}

export const PaymentStep = ({ onBack, onSuccess, orderDraftId, totalAmount, loading }: PaymentStepProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [processing, setProcessing] = useState(false);
  const { items } = useCart();

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      // Monta itens para o checkout
      const checkoutItems = items.map(item => ({
        perfume_id: item.perfume.id,
        name: item.perfume.name,
        brand: item.perfume.brand,
        size_ml: item.size,
        quantity: item.quantity,
        unit_price:
          item.size === 5
            ? item.perfume.price_5ml || 45
            : item.size === 10
            ? item.perfume.price_10ml || 85
            : item.perfume.price_full || 320,
      }));

      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          items: checkoutItems,
          order_draft_id: orderDraftId,
          payment_method: paymentMethod, // 'pix' | 'card'
          success_url: `${window.location.origin}/payment-success`,
          cancel_url: `${window.location.origin}/payment-cancel`,
        },
      });

      if (error) throw error;

      if (data?.success && data?.checkout_url) {
        const url = data.checkout_url as string;
        const newTab = window.open(url, '_blank', 'noopener,noreferrer');
        if (!newTab) {
          // Fallback para navegação no topo se o popup for bloqueado
          try {
            if (window.top) {
              window.top.location.href = url;
            } else {
              window.location.href = url;
            }
          } catch {
            window.location.href = url;
          }
        }
        toast({ title: 'Redirecionando...', description: 'Abrindo o checkout seguro da Stripe em nova aba.' });
      } else {
        throw new Error(data?.error || 'Não foi possível iniciar o checkout.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast({
        title: 'Erro no Checkout',
        description: err instanceof Error ? err.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-playfair flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-2 p-1" disabled={processing}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção de forma de pagamento */}
        <div>
          <Label className="text-base font-medium mb-4 block">Forma de Pagamento</Label>
          <RadioGroup value={paymentMethod} onValueChange={(v: 'pix' | 'card') => setPaymentMethod(v)} className="space-y-3">
            {/* PIX */}
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="pix" id="pix" />
              <QrCode className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <Label htmlFor="pix" className="font-medium cursor-pointer">
                  PIX
                </Label>
                <p className="text-sm text-muted-foreground">Pagamento instantâneo via PIX</p>
              </div>
            </div>

            {/* Cartão */}
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="card" id="card" />
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <Label htmlFor="card" className="font-medium cursor-pointer">
                  Cartão de Crédito
                </Label>
                <p className="text-sm text-muted-foreground">Pague com seu cartão em ambiente seguro</p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Resumo */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total a Pagar:</span>
            <span>R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        {/* Ação */}
        <Button onClick={handleCheckout} disabled={processing || loading} className="w-full" size="lg">
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
            </>
          ) : paymentMethod === 'pix' ? (
            <>
              <QrCode className="mr-2 h-4 w-4" /> Gerar PIX
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" /> Pagar com Cartão
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
