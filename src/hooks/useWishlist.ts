import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface WishlistItem {
  id: string;
  user_id: string;
  perfume_id: string;
  created_at: string;
  perfume: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
    price_full: number;
    price_5ml: number | null;
    price_10ml: number | null;
    family: string;
    gender: string;
  };
}

// Get user's wishlist
export const useWishlist = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          user_id,
          perfume_id,
          created_at,
          collection_id,
          perfumes:perfume_id (
            id,
            name,
            brand,
            image_url,
            price_full,
            price_5ml,
            price_10ml,
            family,
            gender
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        perfume: item.perfumes
      })) as WishlistItem[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Check if a perfume is in wishlist
export const useIsInWishlist = (perfumeId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wishlist-check', user?.id, perfumeId],
    queryFn: async () => {
      if (!user || !perfumeId) return false;

      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('perfume_id', perfumeId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user && !!perfumeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Add item to wishlist
export const useAddToWishlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (perfumeId: string) => {
      if (!user) throw new Error('User must be logged in');

      const { data, error } = await supabase
        .from('wishlist')
        .insert({
          user_id: user.id,
          perfume_id: perfumeId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, perfumeId) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-check'] });
      
      toast({
        title: "Adicionado aos favoritos! ❤️",
        description: "Perfume salvo na sua lista de desejos",
      });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({
          title: "Já está nos favoritos",
          description: "Este perfume já está na sua lista de desejos",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro ao adicionar aos favoritos",
          description: error.message || "Tente novamente",
          variant: "destructive",
        });
      }
    },
  });
};

// Remove item from wishlist
export const useRemoveFromWishlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (perfumeId: string) => {
      if (!user) throw new Error('User must be logged in');

      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('perfume_id', perfumeId);

      if (error) throw error;
      return perfumeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-check'] });
      
      toast({
        title: "Removido dos favoritos",
        description: "Perfume removido da sua lista de desejos",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover dos favoritos",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });
};

// Toggle wishlist status
export const useToggleWishlist = () => {
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  return {
    toggle: (perfumeId: string, isInWishlist: boolean) => {
      if (isInWishlist) {
        removeFromWishlist.mutate(perfumeId);
      } else {
        addToWishlist.mutate(perfumeId);
      }
    },
    isLoading: addToWishlist.isPending || removeFromWishlist.isPending,
  };
};

// Get wishlist stats for admin
export const useWishlistStats = () => {
  return useQuery({
    queryKey: ['wishlist-stats'],
    queryFn: async () => {
      // Get total wishlist items
      const { count: totalWishlistItems } = await supabase
        .from('wishlist')
        .select('*', { count: 'exact', head: true });

      // Get most wished perfumes - simplified version
      const { data: wishlistData } = await supabase
        .from('wishlist')
        .select(`
          perfume_id,
          perfumes:perfume_id (
            name,
            brand
          )
        `);

      // Count occurrences manually
      const perfumeCounts = new Map();
      wishlistData?.forEach(item => {
        const count = perfumeCounts.get(item.perfume_id) || 0;
        perfumeCounts.set(item.perfume_id, count + 1);
      });

      const mostWished = Array.from(perfumeCounts.entries())
        .map(([perfumeId, count]) => {
          const perfumeData = wishlistData?.find(item => item.perfume_id === perfumeId);
          return {
            perfume_id: perfumeId,
            count,
            perfumes: perfumeData?.perfumes
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalWishlistItems: totalWishlistItems || 0,
        mostWished
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};