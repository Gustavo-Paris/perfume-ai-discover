
import { useState } from 'react';
import { Plus, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Address } from '@/types';
import { AddressForm } from './AddressForm';

interface AddressStepProps {
  addresses: Address[];
  selectedAddress: Address | null;
  onAddressSelect: (address: Address) => void;
  onContinue: () => void;
  loading: boolean;
  onAddressesChange: () => void;
}

export const AddressStep: React.FC<AddressStepProps> = ({
  addresses,
  selectedAddress,
  onAddressSelect,
  onContinue,
  loading,
  onAddressesChange
}) => {
  const [showAddressForm, setShowAddressForm] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-playfair text-2xl font-bold mb-2">Endereço de Entrega</h2>
        <p className="text-muted-foreground">Selecione o endereço para entrega do seu pedido</p>
      </div>

      {/* Address List */}
      <div className="space-y-4">
        {addresses.map((address) => (
          <Card 
            key={address.id} 
            className={`cursor-pointer transition-all ${
              selectedAddress?.id === address.id 
                ? 'ring-2 ring-blue-500 border-blue-200' 
                : 'hover:border-gray-300'
            }`}
            onClick={() => onAddressSelect(address)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                  selectedAddress?.id === address.id 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300'
                }`}>
                  {selectedAddress?.id === address.id && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold">{address.name}</h3>
                    {address.is_default && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {address.street}, {address.number}
                    {address.complement && `, ${address.complement}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.district}, {address.city} - {address.state}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    CEP: {address.cep}
                  </p>
                </div>
                
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Address */}
        <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
              <CardContent className="p-6 text-center">
                <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium">Adicionar Novo Endereço</p>
                <p className="text-sm text-muted-foreground">
                  Cadastre um novo endereço de entrega
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Endereço</DialogTitle>
            </DialogHeader>
            <AddressForm 
              onSuccess={() => {
                setShowAddressForm(false);
                onAddressesChange();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-6">
        <Button
          onClick={onContinue}
          disabled={!selectedAddress || loading}
          className="gradient-gold text-white hover:opacity-90"
          size="lg"
        >
          {loading ? 'Processando...' : 'Continuar para Frete'}
        </Button>
      </div>
    </div>
  );
};
