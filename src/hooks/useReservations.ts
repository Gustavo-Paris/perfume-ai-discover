import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Reservation, StockAvailability } from '@/types/reservation';
import { toast } from '@/hooks/use-toast';

export const useReservations = () => {
  return useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Reservation[];
    },
  });
};

export const useStockAvailability = (perfumeId: string, sizeML: 5 | 10) => {
  return useQuery({
    queryKey: ['stock-availability', perfumeId, sizeML],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_available_stock', {
          perfume_uuid: perfumeId,
          size_ml_param: sizeML
        });

      if (error) throw error;
      
      return {
        perfume_id: perfumeId,
        size_ml: sizeML,
        available: data || 0,
        total: 0, // Will be calculated separately if needed
        reserved: 0
      } as StockAvailability;
    },
    enabled: !!perfumeId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      perfumeId,
      sizeML,
      qty,
      expiresMinutes = 20
    }: {
      perfumeId: string;
      sizeML: 5 | 10;
      qty: number;
      expiresMinutes?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .rpc('upsert_reservation', {
          perfume_uuid: perfumeId,
          size_ml_param: sizeML,
          qty_param: qty,
          user_uuid: user?.id || null,
          expires_minutes: expiresMinutes
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['stock-availability'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na reserva",
        description: error.message || "Não foi possível reservar o estoque",
        variant: "destructive",
      });
    },
  });
};

export const useValidateReservations = () => {
  return useMutation({
    mutationFn: async (cartItems: { perfume_id: string; size_ml: 5 | 10; quantity: number }[]) => {
      const validationPromises = cartItems.map(async (item) => {
        const { data, error } = await supabase
          .rpc('get_available_stock', {
            perfume_uuid: item.perfume_id,
            size_ml_param: item.size_ml
          });

        if (error) throw error;
        
        return {
          perfume_id: item.perfume_id,
          size_ml: item.size_ml,
          requested: item.quantity,
          available: data || 0,
          valid: (data || 0) >= item.quantity
        };
      });

      const results = await Promise.all(validationPromises);
      const invalid = results.filter(r => !r.valid);
      
      if (invalid.length > 0) {
        throw new Error(`Estoque insuficiente para alguns itens: ${invalid.map(i => `${i.requested} unidades solicitadas, ${i.available} disponíveis`).join('; ')}`);
      }

      return results;
    },
    onError: (error: any) => {
      toast({
        title: "Validação de estoque falhou",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useAdminReservations = () => {
  return useQuery({
    queryKey: ['admin-reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get related data for each reservation
      const reservationsWithData: Reservation[] = [];
      if (data) {
        for (const reservation of data) {
          // Get perfume data
          const { data: perfume } = await supabase
            .from('perfumes')
            .select('name, brand')
            .eq('id', reservation.perfume_id)
            .single();

          // Get user data
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', reservation.user_id)
            .single();

          reservationsWithData.push({
            ...reservation,
            perfume: perfume ? {
              name: perfume.name,
              brand: perfume.brand
            } : undefined,
            user: profile ? {
              name: profile.name,
              email: profile.email
            } : undefined
          } as Reservation);
        }
      }

      return reservationsWithData;
    },
  });
};