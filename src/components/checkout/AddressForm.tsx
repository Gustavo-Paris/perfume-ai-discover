
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema)
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
    if (!user) return;

    setLoading(true);
    try {
      // If this is set as default, remove default from other addresses
      if (data.isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          name: data.name,
          cep: data.cep.replace(/\D/g, ''),
          street: data.street,
          number: data.number,
          complement: data.complement || null,
          district: data.district,
          city: data.city,
          state: data.state,
          country: 'Brasil',
          is_default: data.isDefault
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Endereço salvo com sucesso.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving address:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o endereço.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              const formatted = value.replace(/(\d{5})(\d)/, '$1-$2');
              setValue('cep', formatted);
              
              if (value.length === 8) {
                searchCep(value);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => searchCep(cep)}
            disabled={cepLoading}
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
        />
      </div>

      <div>
        <Label htmlFor="district">Bairro</Label>
        <Input
          id="district"
          {...register('district')}
          placeholder="Nome do bairro"
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
          />
          {errors.state && (
            <p className="text-sm text-red-600 mt-1">{errors.state.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isDefault"
          {...register('isDefault')}
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
