
import { ArrowLeft, Truck, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShippingQuote } from '@/types';

interface ShippingStepProps {
  quotes: ShippingQuote[];
  selectedShipping: ShippingQuote | null;
  onShippingSelect: (shipping: ShippingQuote) => void;
  loading: boolean;
  onBack: () => void;
}

export const ShippingStep: React.FC<ShippingStepProps> = ({
  quotes,
  selectedShipping,
  onShippingSelect,
  loading,
  onBack
}) => {
  const formatPrice = (price: number) => 
    `R$ ${price.toFixed(2).replace('.', ',')}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="font-playfair text-2xl font-bold">Opções de Frete</h2>
          <p className="text-muted-foreground">Escolha a forma de entrega do seu pedido</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Calculando frete...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all ${
                selectedShipping?.service === quote.service
                  ? 'ring-2 ring-blue-500 border-blue-200'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => onShippingSelect(quote)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedShipping?.service === quote.service
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedShipping?.service === quote.service && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <h3 className="font-semibold">{quote.service}</h3>
                      <span className="text-sm text-muted-foreground">
                        ({quote.company})
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {quote.deadline === 1 
                            ? '1 dia útil' 
                            : `${quote.deadline} dias úteis`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {formatPrice(quote.price)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {quotes.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma opção de frete disponível para este endereço.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
