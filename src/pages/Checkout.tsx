import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, CreditCard, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCart } from '@/contexts/CartContextOptimized';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Address, OrderDraft, ShippingQuote } from '@/types';
import { AddressStep } from '@/components/checkout/AddressStep';
import { ShippingStep } from '@/components/checkout/ShippingStep';
import { PaymentStep } from '@/components/checkout/PaymentStep';
import { PointsRedemption } from '@/components/checkout/PointsRedemption';
import { useValidateStockBeforeCheckout } from '@/hooks/useValidateStockBeforeCheckout';
import { toast } from '@/hooks/use-toast';
import { trackBeginCheckout } from '@/utils/analytics';

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
  const [subtotal, setSubtotal] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);

  // Calculate subtotal
  useEffect(() => {
    const calculateSubtotal = async () => {
      if (items.length > 0) {
        const total = await getTotal();
        setSubtotal(total);
      }
    };
    
    calculateSubtotal();
  }, [items, getTotal]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (items.length === 0) {
      navigate('/carrinho');
      return;
    }

    // Track begin_checkout event when user starts checkout
    const checkoutItems = items.map(item => ({
      item_id: item.perfume.id,
      item_name: item.perfume.name,
      item_brand: item.perfume.brand,
      item_variant: `${item.size}ml`,
      price: item.size === 5 ? item.perfume.price_5ml || 0 : 
             item.size === 10 ? item.perfume.price_10ml || 0 : 
             item.perfume.price_full,
      quantity: item.quantity
    }));
    
    trackBeginCheckout(checkoutItems);

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

      // Handle the response structure correctly
      const quotes = data?.quotes || [];
      
      
      setShippingQuotes(quotes);
      
      if (quotes.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhuma opção de frete disponível para este endereço.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error getting shipping quotes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível calcular o frete. Tente novamente.",
        variant: "destructive",
      });
      setShippingQuotes([]);
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
      // Validate stock availability BEFORE creating order draft
      const { validateStock } = useValidateStockBeforeCheckout();
      
      const cartItemsForValidation = items.map(item => ({
        perfume_id: item.perfume.id,
        size_ml: item.size,
        quantity: item.quantity,
      }));

      const stockResult = await validateStock(cartItemsForValidation);

      if (!stockResult.available) {
        setLoading(false);
        return; // Stop here, toast was already shown by the hook
      }

      // Create order draft only if stock is available
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

  const handleShippingSelect = (shipping: ShippingQuote) => {
    setSelectedShipping(shipping);
    // Don't automatically proceed to payment anymore
  };

  const handleContinueToPayment = async () => {
    if (!orderDraft || !selectedShipping) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('order_drafts')
        .update({
          shipping_service: selectedShipping.service,
          shipping_cost: selectedShipping.price,
          status: 'quote_ready' as const
        })
        .eq('id', orderDraft.id);

      if (error) throw error;

      setCurrentStep(3); // Go to payment step
      
      toast({
        title: "Sucesso!",
        description: "Frete confirmado. Agora escolha a forma de pagamento.",
      });

    } catch (error) {
      console.error('Error confirming shipping:', error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o frete.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const getTotalWithShipping = () => {
    return subtotal + (selectedShipping?.price || 0) - pointsDiscount;
  };

  const handlePointsChange = (points: number, discount: number) => {
    setPointsUsed(points);
    setPointsDiscount(discount);
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
                onContinue={handleContinueToPayment}
                loading={loading}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 3 && orderDraft && (
              <PaymentStep
                onBack={() => setCurrentStep(2)}
                onSuccess={() => {}}
                orderDraftId={orderDraft.id}
                totalAmount={getTotalWithShipping()}
                loading={loading}
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
                {items.map((item) => {
                  // Calculate item price using dynamic prices first, then fallback to hardcoded
                  const perfumeWithDynamic = item.perfume as any;
                  let itemPrice = 0;
                  
                  // Use dynamic prices if available
                  if (perfumeWithDynamic.dynamicPrices && perfumeWithDynamic.dynamicPrices[item.size]) {
                    itemPrice = perfumeWithDynamic.dynamicPrices[item.size];
                  } else {
                    // Fallback to hardcoded prices
                    if (item.size === 2) itemPrice = item.perfume.price_2ml || 0;
                    else if (item.size === 5) itemPrice = item.perfume.price_5ml || 0;
                    else if (item.size === 10) itemPrice = item.perfume.price_10ml || 0;
                    else itemPrice = item.perfume.price_full || 0;
                  }
                  
                  return (
                    <div key={`${item.perfume.id}-${item.size}`} className="flex justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.perfume.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.perfume.brand} • {item.size}ml • Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-sm">
                        R$ {(itemPrice * item.quantity).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  );
                })}
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  
                  {selectedShipping && (
                    <div className="flex justify-between">
                      <span>Frete ({selectedShipping.service})</span>
                      <span>R$ {selectedShipping.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto pontos ({pointsUsed.toLocaleString('pt-BR')} pts)</span>
                      <span>-R$ {pointsDiscount.toFixed(2).replace('.', ',')}</span>
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
            
            {/* Points Redemption */}
            {currentStep >= 2 && (
              <div className="mt-4">
                <PointsRedemption
                  subtotal={subtotal}
                  onPointsChange={handlePointsChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
