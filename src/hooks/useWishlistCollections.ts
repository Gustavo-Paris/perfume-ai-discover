import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface WishlistCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  items_count?: number;
}

export interface CreateCollectionData {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCollectionData extends CreateCollectionData {
  id: string;
}

// Get user's collections
export const useWishlistCollections = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wishlist-collections', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('wishlist_collections')
        .select(`
          *,
          wishlist!collection_id(count)
        `)
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(collection => ({
        ...collection,
        items_count: collection.wishlist?.[0]?.count || 0
      })) as WishlistCollection[];
    },
    enabled: !!user,
    staleTime: 0, // Always refetch from server
    gcTime: 0, // Don't cache
  });
};

// Create collection
export const useCreateCollection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCollectionData) => {
      if (!user) throw new Error('User must be logged in');

      const { data: result, error } = await supabase
        .from('wishlist_collections')
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description,
          color: data.color || '#ef4444',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-collections'] });
      toast({
        title: "Lista criada com sucesso! 🎉",
        description: "Sua nova lista de favoritos foi criada",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar lista",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });
};

// Update collection
export const useUpdateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCollectionData) => {
      const { id, ...updateData } = data;
      
      const { data: result, error } = await supabase
        .from('wishlist_collections')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-collections'] });
      toast({
        title: "Lista atualizada",
        description: "Suas alterações foram salvas",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar lista",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });
};

// Delete collection
export const useDeleteCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionId: string) => {
      // First, move items from this collection to default collection
      const { data: defaultCollection } = await supabase
        .from('wishlist_collections')
        .select('id')
        .eq('is_default', true)
        .single();

      if (defaultCollection) {
        await supabase
          .from('wishlist')
          .update({ collection_id: defaultCollection.id })
          .eq('collection_id', collectionId);
      }

      // Then delete the collection
      const { error } = await supabase
        .from('wishlist_collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;
      return collectionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-collections'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast({
        title: "Lista removida",
        description: "Os itens foram movidos para a lista padrão",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover lista",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });
};

// Move item to collection
export const useMoveToCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ perfumeId, collectionId }: { perfumeId: string; collectionId: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('wishlist')
        .update({ collection_id: collectionId })
        .eq('perfume_id', perfumeId)
        .eq('user_id', user.user.id);

      if (error) throw error;
      return { perfumeId, collectionId };
    },
    onSuccess: async () => {
      // Forçar refetch de todas as queries relacionadas
      await queryClient.refetchQueries({ queryKey: ['wishlist'] });
      await queryClient.refetchQueries({ queryKey: ['wishlist-collections'] });
      await queryClient.refetchQueries({ queryKey: ['collection-items'] });
      
      toast({
        title: "Item movido",
        description: "Perfume movido para a nova lista",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao mover item",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });
};

// Get items from specific collection
export const useCollectionItems = (collectionId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['collection-items', collectionId, user?.id],
    queryFn: async () => {
      if (!user || !collectionId) return [];

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
            gender,
            top_notes,
            heart_notes,
            base_notes
          )
        `)
        .eq('user_id', user.id)
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        perfume: item.perfumes
      }));
    },
    enabled: !!user && !!collectionId,
  });
};