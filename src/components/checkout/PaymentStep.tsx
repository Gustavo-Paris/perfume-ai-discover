import { useState } from 'react';
import { CreditCard, QrCode, ArrowLeft, Loader2, Globe, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'stripe_card'>('pix');
  const [processing, setProcessing] = useState(false);
  const { items } = useCart();
  const [cardData, setCardData] = useState({
    number: '',
    holder_name: '',
    exp_month: '',
    exp_year: '',
    cvv: ''
  });
  const [installments, setInstallments] = useState(1);

  const handleCardInputChange = (field: string, value: string) => {
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleStripeCheckout = async () => {
    setProcessing(true);
    try {
      // Prepare items for Stripe checkout
      const checkoutItems = items.map(item => ({
        perfume_id: item.perfume.id,
        name: item.perfume.name,
        brand: item.perfume.brand,
        size_ml: item.size,
        quantity: item.quantity,
        unit_price: item.size === 5 ? item.perfume.price_5ml || 45 : 
                   item.size === 10 ? item.perfume.price_10ml || 85 : 
                   item.perfume.price_full || 320
      }));

      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          items: checkoutItems,
          order_draft_id: orderDraftId
        }
      });

      if (error) throw error;

      if (data.success) {
        // Open Stripe checkout in new tab (recommended)
        window.open(data.checkout_url, '_blank');
        
        toast({
          title: "Redirecionando...",
          description: "Abrindo checkout do Stripe em nova aba.",
        });
      } else {
        throw new Error(data.error || 'Erro ao criar checkout Stripe');
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      toast({
        title: "Erro no Checkout",
        description: error instanceof Error ? error.message : "Não foi possível abrir o checkout. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (paymentMethod === 'stripe_card') {
      return handleStripeCheckout();
    }

    if (paymentMethod === 'credit_card') {
      if (!cardData.number || !cardData.holder_name || !cardData.exp_month || !cardData.exp_year || !cardData.cvv) {
        toast({
          title: "Erro",
          description: "Por favor, preencha todos os dados do cartão.",
          variant: "destructive",
        });
        return;
      }
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          orderDraftId,
          paymentMethod,
          cardData: paymentMethod === 'credit_card' ? cardData : undefined,
          installments: paymentMethod === 'credit_card' ? installments : undefined
        }
      });

      if (error) throw error;

      if (data.success) {
        // Add orderDraftId to the payment data for order confirmation
        const paymentDataWithDraft = {
          ...data,
          orderDraftId
        };
        onSuccess(paymentDataWithDraft);
      } else {
        throw new Error(data.error || 'Erro no processamento do pagamento');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Erro no Pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const installmentOptions = [1, 2, 3, 4, 5, 6, 10, 12].map(num => ({
    value: num,
    label: num === 1 ? 'À vista' : `${num}x de R$ ${(totalAmount / num).toFixed(2).replace('.', ',')}`
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-playfair flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-2 p-1"
            disabled={processing}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Method Selection */}
        <div>
          <Label className="text-base font-medium mb-4 block">Forma de Pagamento</Label>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value: 'pix' | 'credit_card' | 'stripe_card') => setPaymentMethod(value)}
            className="space-y-3"
          >
            {/* PIX Option */}
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="pix" id="pix" />
              <QrCode className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <Label htmlFor="pix" className="font-medium cursor-pointer flex items-center">
                  PIX <MapPin className="ml-2 h-4 w-4 text-green-600" />
                </Label>
                <p className="text-sm text-muted-foreground">Modo Bank • Pagamento instantâneo</p>
              </div>
            </div>

            {/* Modo Bank Credit Card */}
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="credit_card" id="credit_card" />
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <Label htmlFor="credit_card" className="font-medium cursor-pointer flex items-center">
                  Cartão Nacional <MapPin className="ml-2 h-4 w-4 text-blue-600" />
                </Label>
                <p className="text-sm text-muted-foreground">Modo Bank • Parcelamento disponível</p>
              </div>
            </div>

            {/* Stripe Credit Card */}
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="stripe_card" id="stripe_card" />
              <CreditCard className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <Label htmlFor="stripe_card" className="font-medium cursor-pointer flex items-center">
                  Cartão Internacional <Globe className="ml-2 h-4 w-4 text-purple-600" />
                </Label>
                <p className="text-sm text-muted-foreground">Stripe • Cartão internacional e PIX</p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Credit Card Form */}
        {paymentMethod === 'credit_card' && (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="card_number">Número do Cartão</Label>
                <Input
                  id="card_number"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.number}
                  onChange={(e) => handleCardInputChange('number', formatCardNumber(e.target.value))}
                  maxLength={19}
                />
              </div>
              <div>
                <Label htmlFor="holder_name">Nome do Titular</Label>
                <Input
                  id="holder_name"
                  placeholder="Nome como está no cartão"
                  value={cardData.holder_name}
                  onChange={(e) => handleCardInputChange('holder_name', e.target.value.toUpperCase())}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="exp_month">Mês</Label>
                  <Input
                    id="exp_month"
                    placeholder="MM"
                    value={cardData.exp_month}
                    onChange={(e) => handleCardInputChange('exp_month', e.target.value.replace(/\D/g, '').slice(0, 2))}
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="exp_year">Ano</Label>
                  <Input
                    id="exp_year"
                    placeholder="AAAA"
                    value={cardData.exp_year}
                    onChange={(e) => handleCardInputChange('exp_year', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardData.cvv}
                    onChange={(e) => handleCardInputChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="installments">Parcelas</Label>
                <select
                  id="installments"
                  className="w-full p-3 border rounded-md bg-white"
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value))}
                >
                  {installmentOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Total Summary */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total a Pagar:</span>
            <span>R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
          </div>
          {paymentMethod === 'credit_card' && installments > 1 && (
            <p className="text-sm text-muted-foreground mt-1">
              {installments}x de R$ {(totalAmount / installments).toFixed(2).replace('.', ',')}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={processing || loading}
          className="w-full"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : paymentMethod === 'pix' ? (
            <>
              <QrCode className="mr-2 h-4 w-4" />
              Gerar PIX
            </>
          ) : paymentMethod === 'stripe_card' ? (
            <>
              <Globe className="mr-2 h-4 w-4" />
              Pagar com Stripe (Cartão/PIX)
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar com Cartão
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
