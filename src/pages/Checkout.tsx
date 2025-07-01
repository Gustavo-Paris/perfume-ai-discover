
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, CreditCard, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Address, OrderDraft, ShippingQuote } from '@/types';
import { AddressStep } from '@/components/checkout/AddressStep';
import { ShippingStep } from '@/components/checkout/ShippingStep';
import { PaymentStep } from '@/components/checkout/PaymentStep';
import { PixPayment } from '@/components/checkout/PixPayment';
import { toast } from '@/hooks/use-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotal } = useCart();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null);
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingQuote | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (items.length === 0) {
      navigate('/carrinho');
      return;
    }

    loadAddresses();
  }, [user, items, navigate]);

  const loadAddresses = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Error loading addresses:', error);
      return;
    }

    setAddresses(data || []);
    if (data && data.length > 0) {
      const defaultAddress = data.find(addr => addr.is_default) || data[0];
      setSelectedAddress(defaultAddress);
    }
  };

  const createOrderDraft = async (addressId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('order_drafts')
      .insert({
        user_id: user.id,
        address_id: addressId,
        status: 'draft' as const
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order draft:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o pedido.",
        variant: "destructive",
      });
      return;
    }

    setOrderDraft(data as OrderDraft);
    return data as OrderDraft;
  };

  const getShippingQuotes = async (orderDraftId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('shipping-quote', {
        body: { orderDraftId }
      });

      if (error) throw error;

      setShippingQuotes(data.quotes || []);
    } catch (error) {
      console.error('Error getting shipping quotes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível calcular o frete.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = async (address: Address) => {
    setSelectedAddress(address);
  };

  const handleContinueToShipping = async () => {
    if (!selectedAddress) return;

    setLoading(true);
    try {
      const draft = await createOrderDraft(selectedAddress.id);
      if (draft) {
        await getShippingQuotes(draft.id);
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Error continuing to shipping:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShippingSelect = async (shipping: ShippingQuote) => {
    if (!orderDraft) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('order_drafts')
        .update({
          shipping_service: shipping.service,
          shipping_cost: shipping.price,
          status: 'quote_ready' as const
        })
        .eq('id', orderDraft.id);

      if (error) throw error;

      setSelectedShipping(shipping);
      setCurrentStep(3); // Go to payment step
      
      toast({
        title: "Sucesso!",
        description: "Frete selecionado. Agora escolha a forma de pagamento.",
      });

    } catch (error) {
      console.error('Error selecting shipping:', error);
      toast({
        title: "Erro",
        description: "Não foi possível selecionar o frete.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (data: any) => {
    setPaymentData(data);
    
    if (data.payment_method === 'pix') {
      // Show PIX QR code if it's a PIX payment
      setCurrentStep(4); // PIX display step
    } else {
      // Redirect to success page for credit card
      const params = new URLSearchParams({
        transaction_id: data.transaction_id,
        payment_method: data.payment_method,
        total: getTotalWithShipping().toFixed(2)
      });
      navigate(`/payment-success?${params.toString()}`);
    }
  };

  const handlePixSuccess = () => {
    const params = new URLSearchParams({
      transaction_id: paymentData.transaction_id,
      payment_method: paymentData.payment_method,
      total: getTotalWithShipping().toFixed(2)
    });
    navigate(`/payment-success?${params.toString()}`);
  };

  const getTotalWithShipping = () => {
    return getTotal() + (selectedShipping?.price || 0);
  };

  const steps = [
    { step: 1, title: 'Endereço', icon: MapPin },
    { step: 2, title: 'Frete', icon: Truck },
    { step: 3, title: 'Pagamento', icon: CreditCard },
  ];

  const progressValue = (currentStep / 3) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/carrinho')}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Carrinho
            </Button>
            <h1 className="font-playfair text-2xl font-bold">Checkout</h1>
            <div className="w-24"></div>
          </div>
          
          {/* Progress */}
          <div className="mt-6">
            <Progress value={progressValue} className="h-2 mb-4" />
            <div className="flex justify-between">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep >= step.step;
                const isCurrent = currentStep === step.step;
                
                return (
                  <div
                    key={step.step}
                    className={`flex items-center space-x-2 ${
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-gray-200'
                      } ${isCurrent ? 'ring-2 ring-blue-300' : ''}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <AddressStep
                addresses={addresses}
                selectedAddress={selectedAddress}
                onAddressSelect={handleAddressSelect}
                onContinue={handleContinueToShipping}
                loading={loading}
                onAddressesChange={loadAddresses}
              />
            )}
            
            {currentStep === 2 && (
              <ShippingStep
                quotes={shippingQuotes}
                selectedShipping={selectedShipping}
                onShippingSelect={handleShippingSelect}
                loading={loading}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 3 && orderDraft && (
              <PaymentStep
                onBack={() => setCurrentStep(2)}
                onSuccess={handlePaymentSuccess}
                orderDraftId={orderDraft.id}
                totalAmount={getTotalWithShipping()}
                loading={loading}
              />
            )}

            {currentStep === 4 && paymentData?.payment_method === 'pix' && (
              <PixPayment
                qrCode={paymentData.qr_code}
                qrCodeUrl={paymentData.qr_code_url}
                expiresAt={paymentData.expires_at}
                onSuccess={handlePixSuccess}
              />
            )}
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="font-playfair">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.perfume.id}-${item.size}`} className="flex justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.perfume.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.perfume.brand} • {item.size}ml • Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-sm">
                      R$ {((item.size === 5 ? item.perfume.price_5ml : 
                           item.size === 10 ? item.perfume.price_10ml : 
                           item.perfume.price_full) * item.quantity).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                ))}
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {getTotal().toFixed(2).replace('.', ',')}</span>
                  </div>
                  
                  {selectedShipping && (
                    <div className="flex justify-between">
                      <span>Frete ({selectedShipping.service})</span>
                      <span>R$ {selectedShipping.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>
                      R$ {getTotalWithShipping().toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
