
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DatabasePerfume } from '@/types';
import { usePerfumeRealTimeUpdates } from './usePerfumeRealTime';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

// Hook to check if user is admin
const useAdminCheck = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        setIsAdmin(!!data);
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  return { isAdmin, loading };
};

export const usePerfumes = () => {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  
  // Ativar atualizações em tempo real
  usePerfumeRealTimeUpdates();
  
  return useQuery({
    queryKey: ['perfumes', isAdmin],
    queryFn: async () => {
      let data, error;
      
      if (isAdmin) {
        // Admin users get full access including sensitive data
        ({ data, error } = await supabase
          .from('perfumes')
          .select('*, target_margin_percentage, avg_cost_per_ml')
          .order('created_at', { ascending: false }));
      } else {
        // Non-admin users get public data only (no sensitive business data)
        ({ data, error } = await supabase
          .from('perfumes')
          .select('id, name, brand, description, image_url, gender, family, top_notes, heart_notes, base_notes, category, price_2ml, price_5ml, price_10ml, price_full, created_at, available_sizes, product_type, source_size_ml')
          .order('created_at', { ascending: false }));
      }
      
      if (error) throw error;
      return data as (DatabasePerfume & { target_margin_percentage?: number; avg_cost_per_ml?: number })[];
    },
    enabled: !adminLoading, // Wait for admin check to complete
    staleTime: 5 * 60 * 1000, // Reduzido para 5 minutos por causa das mudanças de preço
    gcTime: 10 * 60 * 1000, // Reduzido para 10 minutos
    refetchOnWindowFocus: true, // Reativado para pegar mudanças de preço
  });
};

// Extended perfume type with cost fields
export interface PerfumeWithCosts extends DatabasePerfume {
  avg_cost_per_ml?: number;
  target_margin_percentage?: number;
  last_cost_calculation?: string;
}

export const usePerfumesWithCosts = () => {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  
  return useQuery({
    queryKey: ['perfumes-with-costs', isAdmin],
    queryFn: async () => {
      if (!isAdmin) {
        // Non-admin users don't get cost data - redirect to public data
        const { data, error } = await supabase
          .from('perfumes')
          .select('id, name, brand, description, image_url, gender, family, top_notes, heart_notes, base_notes, category, price_2ml, price_5ml, price_10ml, price_full, created_at, available_sizes, product_type, source_size_ml')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return (data as any[]) as PerfumeWithCosts[];
      }
      
      // Admin users get full cost data
      const { data, error } = await supabase
        .from('perfumes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PerfumeWithCosts[];
    },
    enabled: !adminLoading, // Wait for admin check to complete
    staleTime: 5 * 60 * 1000, // 5 minutes cache for cost data
    refetchOnWindowFocus: false,
  });
};

export const useCreatePerfume = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (perfume: Omit<DatabasePerfume, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('perfumes')
        .insert(perfume)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
    },
  });
};

export const useUpdatePerfume = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DatabasePerfume> & { id: string }) => {
      const { data, error } = await supabase
        .from('perfumes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
    },
  });
};

export const useDeletePerfume = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('perfumes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
    },
  });
};
