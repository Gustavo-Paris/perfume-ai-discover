import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MaterialConfiguration {
  id: string;
  bottle_materials: Array<{
    size_ml: number;
    material_id: string;
    material_name: string;
  }>;
  default_label_id?: string;
  default_label_name?: string;
  auto_detect_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialDetectionInfo {
  size_ml?: number;
  detected_type: string;
  affects_pricing: boolean;
}

// Hook para buscar configurações
export const useMaterialConfigurations = () => {
  return useQuery({
    queryKey: ['material-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_configurations')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data as MaterialConfiguration | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para salvar/atualizar configurações
export const useSaveMaterialConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<MaterialConfiguration>) => {
      // Primeiro, verificar se já existe uma configuração
      const { data: existing } = await supabase
        .from('material_configurations')
        .select('id')
        .maybeSingle();

      if (existing) {
        // Atualizar existente
        const { data, error } = await supabase
          .from('material_configurations')
          .update(config)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar nova
        const { data, error } = await supabase
          .from('material_configurations')
          .insert(config)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success('Configuração salva com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['material-configurations'] });
    },
    onError: (error) => {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    },
  });
};

// Hook para detectar informações do material
export const useDetectMaterialInfo = () => {
  return useMutation({
    mutationFn: async (materialName: string): Promise<MaterialDetectionInfo> => {
      const { data, error } = await supabase.rpc('detect_material_info', {
        material_name: materialName
      });

      if (error) throw error;
      return data as unknown as MaterialDetectionInfo;
    },
  });
};

// Hook para recalcular preços de perfume
export const useRecalculatePerfumePrices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ perfumeId, marginPercentage }: { perfumeId: string; marginPercentage: number }) => {
      const { error } = await supabase.rpc('update_perfume_margin', {
        perfume_uuid: perfumeId,
        new_margin_percentage: marginPercentage
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Preços recalculados automaticamente!');
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
      queryClient.invalidateQueries({ queryKey: ['perfumes-with-costs'] });
    },
    onError: (error) => {
      console.error('Erro ao recalcular preços:', error);
      toast.error('Erro ao recalcular preços');
    },
  });
};