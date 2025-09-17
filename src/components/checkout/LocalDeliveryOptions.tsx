import { MapPin, Clock, Check, Store, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ShippingQuote } from '@/types';

interface LocalDeliveryOptionsProps {
  quotes: ShippingQuote[];
  selectedShipping: ShippingQuote | null;
  onShippingSelect: (shipping: ShippingQuote) => void;
}

export const LocalDeliveryOptions: React.FC<LocalDeliveryOptionsProps> = ({
  quotes,
  selectedShipping,
  onShippingSelect
}) => {
  const formatPrice = (price: number) => 
    price === 0 ? 'Grátis' : `R$ ${price.toFixed(2).replace('.', ',')}`;

  const getIcon = (serviceId: string) => {
    return serviceId === 'pickup' ? Store : Truck;
  };

  const getDeliveryText = (quote: ShippingQuote) => {
    if (quote.service_id === 'pickup') {
      return 'Disponível imediatamente';
    }
    return quote.deadline === 0 ? 'Mesmo dia' : 
           quote.deadline === 1 ? '1 dia útil' : 
           `${quote.deadline} dias úteis`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Entrega Local - Chapecó</h3>
        </div>
        <p className="text-sm text-blue-700">
          Detectamos que seu endereço é em Chapecó! Oferecemos opções especiais de entrega para nossa cidade.
        </p>
      </div>

      {quotes.map((quote, index) => {
        const Icon = getIcon(quote.service_id as string);
        const isSelected = selectedShipping?.service_id === quote.service_id;
        
        return (
          <Card
            key={index}
            className={`cursor-pointer transition-all ${
              isSelected
                ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50'
                : 'hover:border-gray-300'
            }`}
            onClick={() => onShippingSelect(quote)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold">{quote.service}</h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Local
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{getDeliveryText(quote)}</span>
                      </div>
                    </div>
                    
                    {quote.pickup_address && (
                      <div className="text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {quote.pickup_address}
                      </div>
                    )}
                    
                    {quote.pickup_instructions && (
                      <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded mt-2">
                        {quote.pickup_instructions}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-lg text-green-600">
                    {formatPrice(quote.price)}
                  </p>
                  {quote.service_id === 'pickup' && (
                    <p className="text-xs text-muted-foreground">Sem custo</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};