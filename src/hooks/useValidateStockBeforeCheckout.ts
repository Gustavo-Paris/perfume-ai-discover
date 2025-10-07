import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StockValidationResult {
  available: boolean;
  message?: string;
  insufficient_items?: Array<{
    perfume_id: string;
    perfume_name: string;
    size_ml: number;
    quantity_requested: number;
    available_ml?: number;
    available_units?: number;
    material_name?: string;
    material_available?: number;
    material_needed?: number;
    issue: 'insufficient_perfume_stock' | 'insufficient_material_stock';
  }>;
}

export const useValidateStockBeforeCheckout = () => {
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateStock = async (cartItems: Array<{
    perfume_id: string;
    size_ml: number;
    quantity: number;
  }>): Promise<StockValidationResult> => {
    setIsValidating(true);

    try {
      const { data, error } = await supabase.rpc('validate_cart_stock_availability', {
        cart_items_param: cartItems
      });

      if (error) {
        console.error('Error validating stock:', error);
        toast({
          title: 'Erro ao validar estoque',
          description: 'Não foi possível verificar disponibilidade. Tente novamente.',
          variant: 'destructive',
        });
        return { available: false };
      }

      // Type guard to ensure data is a valid object
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { available: false };
      }

      const result = data as Record<string, any>;

      if (!result.available && result.insufficient_items?.length > 0) {
        // Mostrar mensagem detalhada ao usuário
        const itemsDescription = result.insufficient_items
          .map((item: any) => {
            if (item.issue === 'insufficient_perfume_stock') {
              return `${item.perfume_name} (${item.size_ml}ml): apenas ${item.available_units} unidades disponíveis`;
            } else {
              return `${item.perfume_name} (${item.size_ml}ml): falta material "${item.material_name}"`;
            }
          })
          .join(', ');

        toast({
          title: 'Estoque insuficiente',
          description: itemsDescription,
          variant: 'destructive',
        });
      }

      return result as StockValidationResult;
    } catch (error) {
      console.error('Unexpected error during stock validation:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Não foi possível validar o estoque.',
        variant: 'destructive',
      });
      return { available: false };
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateStock,
    isValidating,
  };
};
