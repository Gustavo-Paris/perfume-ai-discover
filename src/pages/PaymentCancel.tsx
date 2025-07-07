
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const provider = searchParams.get('provider');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="font-playfair text-2xl text-red-800">
            Pagamento Cancelado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Seu pagamento {provider === 'stripe' ? 'no Stripe ' : ''}foi cancelado ou não foi processado com sucesso.
            </p>
            <p className="text-sm text-muted-foreground">
              Não se preocupe, nenhuma cobrança será realizada e seus itens continuam no carrinho.
            </p>
            {provider === 'stripe' && (
              <p className="text-sm text-blue-600">
                💡 Dica: Você pode tentar outras opções de pagamento como PIX ou cartão nacional.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/checkout')} 
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/carrinho')}
              className="w-full"
            >
              Voltar ao Carrinho
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Continuar Navegando
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;
