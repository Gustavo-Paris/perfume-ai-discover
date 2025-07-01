
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [orderData, setOrderData] = useState<any>(null);

  const transactionId = searchParams.get('transaction_id');
  const paymentMethod = searchParams.get('payment_method');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Clear cart after successful payment
    clearCart();

    // You might want to fetch order details here based on transaction_id
    setOrderData({
      id: transactionId,
      total: searchParams.get('total') || '0',
      payment_method: paymentMethod,
      status: 'paid'
    });
  }, [user, navigate, transactionId, paymentMethod, clearCart, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="font-playfair text-2xl text-green-800">
            Pagamento Confirmado!
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
                    <span className="font-medium">#{orderData.id?.slice(-8) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pagamento:</span>
                    <span className="font-medium">
                      {paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">R$ {orderData.total}</span>
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
