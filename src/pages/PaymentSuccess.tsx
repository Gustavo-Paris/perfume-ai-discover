
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContextOptimized';
import { supabase } from '@/integrations/supabase/client';
import { trackPurchase } from '@/utils/analytics';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [orderData, setOrderData] = useState<any>(null);
  const [status, setStatus] = useState<'verifying' | 'pending' | 'success' | 'error'>('verifying');
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const transactionId = searchParams.get('transaction_id');
  const paymentMethod = searchParams.get('payment_method');
  const orderDraftId = searchParams.get('order_draft_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Ensure required params are present (do not force auth here)
    const paymentTxnId = sessionId || transactionId;
    if (!orderDraftId || !paymentTxnId) {
      setErrorMessage('Dados de pagamento ausentes.');
      setStatus('error');
      setLoading(false);
      return;
    }

    confirmOrder();
  }, [transactionId, paymentMethod, orderDraftId, sessionId]);

  const confirmOrder = async (silent = false) => {
    const paymentTxnId = sessionId || transactionId;
    const hasValid = orderDraftId && paymentTxnId;

    if (!hasValid) {
      setErrorMessage('Dados de pagamento ausentes.');
      setStatus('error');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('confirm-order', {
        body: {
          orderDraftId,
          paymentData: {
            transaction_id: paymentTxnId,
            payment_method: paymentMethod === 'pix' ? 'pix' : 'credit_card',
          }
        }
      });

      if (error) throw error;

      if (data?.success && data.order) {
        const paid = (data.order.payment_status || data.order.status) === 'paid';
        setOrderData(data.order);

        if (paid) {
          // Track purchase only when really paid
          trackPurchase({
            transaction_id: paymentTxnId || undefined,
            value: data.order.total_amount,
            items: []
          });
          try {
            await clearCart();
          } catch (e) {
            console.warn('Falha ao limpar carrinho:', e);
          }
          setStatus('success');
        } else {
          setStatus('pending');
        }
      } else {
        throw new Error(data?.error || 'Erro ao confirmar pedido');
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      if (sessionId) {
        // Provavelmente ainda processando no Stripe
        setStatus('pending');
      } else {
        setStatus('error');
        setErrorMessage('Não foi possível confirmar o pagamento.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'pending') return;
    const id = setInterval(() => {
      setAttempts((a) => a + 1);
      confirmOrder(true);
    }, 5000);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (status === 'pending' && attempts >= 24) {
      setStatus('error');
      setErrorMessage('Tempo esgotado para confirmação do pagamento.');
    }
  }, [attempts, status]);

  const handleManualRefresh = () => {
    confirmOrder(true);
  };

  useEffect(() => {
    if (status === 'error' && errorMessage === 'Dados de pagamento ausentes.') {
      const t = setTimeout(() => navigate('/checkout'), 3000);
      return () => clearTimeout(t);
    }
  }, [status, errorMessage, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-blue-600 animate-pulse mb-4" />
              <p className="text-gray-600">Confirmando seu pedido...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <Package className="h-8 w-8 text-yellow-600 animate-pulse" />
            </div>
            <CardTitle className="font-playfair text-2xl text-yellow-800">
              Aguardando confirmação do pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-sm text-muted-foreground">
              Estamos verificando seu pagamento. Isso pode levar alguns instantes.
              {(paymentMethod === 'pix') ? ' No PIX, a confirmação pode levar alguns minutos.' : ''}
            </p>
            {orderData && (
              <div className="p-4 bg-gray-50 rounded-lg text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Pedido:</span>
                    <span className="font-medium">#{orderData.order_number || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">
                      R$ {Number(orderData.total_amount || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button onClick={handleManualRefresh} className="w-full">
                Atualizar agora
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Voltar à loja
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Package className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="font-playfair text-2xl text-red-800">
              Não foi possível confirmar o pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-sm text-muted-foreground">
              {errorMessage || 'Tente novamente em instantes ou retorne ao checkout.'}
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/checkout')} className="w-full">
                Tentar novamente
              </Button>
              <Button variant="outline" onClick={() => navigate('/carrinho')} className="w-full">
                Voltar ao carrinho
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="font-playfair text-2xl text-green-800">
            Pedido Confirmado!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Seu pedido foi processado com sucesso e já está sendo preparado.
            </p>
            {orderData && (
              <div className="p-4 bg-gray-50 rounded-lg text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Pedido:</span>
                    <span className="font-medium">#{orderData.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pagamento:</span>
                    <span className="font-medium">
                      {(orderData?.payment_method || paymentMethod) === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">
                      R$ {Number(orderData.total_amount || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <Package className="h-5 w-5" />
              <span className="text-sm font-medium">Preparando seu pedido</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Você receberá um email com os detalhes do pedido e o código de rastreamento em breve.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/pedidos')} 
              className="w-full"
            >
              Ver Meus Pedidos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Continuar Comprando
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

};

export default PaymentSuccess;
