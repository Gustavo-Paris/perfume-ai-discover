import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Material {
  id: string;
  name: string;
  type: 'input' | 'asset';
  category: string;
  unit: string;
  cost_per_unit: number;
  current_stock: number;
  min_stock_alert: number;
  supplier?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialLot {
  id: string;
  material_id: string;
  quantity: number;
  cost_per_unit: number;
  total_cost: number;
  supplier?: string;
  purchase_date: string;
  expiry_date?: string;
  lot_code?: string;
  notes?: string;
  created_at: string;
  materials?: {
    name: string;
    unit: string;
  };
}

export interface PackagingRule {
  id: string;
  container_material_id: string;
  max_items: number;
  item_size_ml?: number;
  priority: number;
  is_active: boolean;
  created_at: string;
  materials?: {
    name: string;
    cost_per_unit: number;
  };
}

export interface ProductRecipe {
  id: string;
  perfume_id: string;
  size_ml: number;
  material_id: string;
  quantity_needed: number;
  created_at: string;
  materials?: {
    name: string;
    unit: string;
    cost_per_unit: number;
  };
}

export const useMaterials = () => {
  return useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Material[];
    },
  });
};

export const useMaterialLots = () => {
  return useQuery({
    queryKey: ['material-lots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_lots')
        .select(`
          *,
          materials(name, unit)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MaterialLot[];
    },
  });
};

export const usePackagingRules = () => {
  return useQuery({
    queryKey: ['packaging-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packaging_rules')
        .select(`
          *,
          materials(name, cost_per_unit)
        `)
        .order('priority');
      
      if (error) throw error;
      return data as PackagingRule[];
    },
  });
};

export const useProductRecipes = (perfumeId?: string) => {
  return useQuery({
    queryKey: ['product-recipes', perfumeId],
    queryFn: async () => {
      let query = supabase
        .from('product_recipes')
        .select(`
          *,
          materials(name, unit, cost_per_unit)
        `);
      
      if (perfumeId) {
        query = query.eq('perfume_id', perfumeId);
      }
      
      const { data, error } = await query.order('size_ml');
      
      if (error) throw error;
      return data as ProductRecipe[];
    },
  });
};

export const useCreateMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (material: Omit<Material, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('materials')
        .insert(material)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
};

export const useCreateMaterialLot = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lot: Omit<MaterialLot, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('material_lots')
        .insert(lot)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-lots'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
};

export const useCreatePackagingRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (rule: Omit<PackagingRule, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('packaging_rules')
        .insert(rule)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-rules'] });
    },
  });
};

export const useCreateProductRecipe = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (recipe: Omit<ProductRecipe, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('product_recipes')
        .insert(recipe)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-recipes'] });
    },
  });
};

export const useCalculateProductCost = () => {
  return useMutation({
    mutationFn: async ({ perfumeId, sizeML }: { perfumeId: string; sizeML: number }) => {
      const { data, error } = await supabase.rpc('calculate_product_total_cost', {
        perfume_uuid: perfumeId,
        size_ml_param: sizeML
      });
      
      if (error) throw error;
      return data?.[0] || null;
    },
  });
};

export const useCalculatePackagingCosts = () => {
  return useMutation({
    mutationFn: async (cartItems: any[]) => {
      const { data, error } = await supabase.rpc('calculate_packaging_costs', {
        cart_items: cartItems
      });
      
      if (error) throw error;
      return data?.[0] || null;
    },
  });
};