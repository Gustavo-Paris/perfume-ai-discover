
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const addressSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cep: z.string().min(8, 'CEP deve ter 8 dígitos').max(9),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  district: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório').max(2),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  onSuccess: () => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      isDefault: false
    }
  });

  const cep = watch('cep');

  const searchCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setValue('street', data.logradouro || '');
        setValue('district', data.bairro || '');
        setValue('city', data.localidade || '');
        setValue('state', data.uf || '');
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching CEP:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar o CEP.",
        variant: "destructive",
      });
    } finally {
      setCepLoading(false);
    }
  };

  const onSubmit = async (data: AddressFormData) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    console.log('Submitting address data:', data);
    setLoading(true);
    
    try {
      // If this is set as default, remove default from other addresses
      if (data.isDefault) {
        const { error: updateError } = await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('Error updating existing addresses:', updateError);
        }
      }

      const addressData = {
        user_id: user.id,
        name: data.name,
        cep: data.cep.replace(/\D/g, ''),
        street: data.street,
        number: data.number,
        complement: data.complement || null,
        district: data.district,
        city: data.city,
        state: data.state.toUpperCase(),
        country: 'Brasil',
        is_default: data.isDefault
      };

      console.log('Inserting address:', addressData);

      const { data: insertedAddress, error } = await supabase
        .from('addresses')
        .insert(addressData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Address saved successfully:', insertedAddress);

      toast({
        title: "Sucesso!",
        description: "Endereço salvo com sucesso.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving address:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o endereço. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.replace(/(\d{5})(\d)/, '$1-$2');
    setValue('cep', formatted);
    
    if (value.length === 8) {
      searchCep(value);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do Endereço</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Ex: Casa, Trabalho"
          disabled={loading}
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="cep">CEP</Label>
        <div className="flex space-x-2">
          <Input
            id="cep"
            {...register('cep')}
            placeholder="00000-000"
            maxLength={9}
            onChange={handleCepChange}
            disabled={loading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => searchCep(cep)}
            disabled={cepLoading || loading}
            className="shrink-0"
          >
            {cepLoading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
        {errors.cep && (
          <p className="text-sm text-red-600 mt-1">{errors.cep.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="street">Rua</Label>
          <Input
            id="street"
            {...register('street')}
            placeholder="Nome da rua"
            disabled={loading}
          />
          {errors.street && (
            <p className="text-sm text-red-600 mt-1">{errors.street.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            {...register('number')}
            placeholder="123"
            disabled={loading}
          />
          {errors.number && (
            <p className="text-sm text-red-600 mt-1">{errors.number.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="complement">Complemento (opcional)</Label>
        <Input
          id="complement"
          {...register('complement')}
          placeholder="Apto, bloco, casa, etc."
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="district">Bairro</Label>
        <Input
          id="district"
          {...register('district')}
          placeholder="Nome do bairro"
          disabled={loading}
        />
        {errors.district && (
          <p className="text-sm text-red-600 mt-1">{errors.district.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            {...register('city')}
            placeholder="Nome da cidade"
            disabled={loading}
          />
          {errors.city && (
            <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            {...register('state')}
            placeholder="SP"
            maxLength={2}
            style={{ textTransform: 'uppercase' }}
            disabled={loading}
          />
          {errors.state && (
            <p className="text-sm text-red-600 mt-1">{errors.state.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isDefault"
          checked={isDefault}
          onCheckedChange={(checked) => {
            const value = checked === true;
            setIsDefault(value);
            setValue('isDefault', value);
          }}
          disabled={loading}
        />
        <Label htmlFor="isDefault" className="text-sm">
          Definir como endereço padrão
        </Label>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="gradient-gold text-white hover:opacity-90"
        >
          {loading ? 'Salvando...' : 'Salvar Endereço'}
        </Button>
      </div>
    </form>
  );
};
