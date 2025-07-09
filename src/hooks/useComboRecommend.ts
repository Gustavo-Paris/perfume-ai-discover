import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConversationMessage } from '@/types/conversation';

export interface ComboItem {
  perfume_id: string;
  size_ml: number;
  price: number;
  perfume: {
    id: string;
    name: string;
    brand: string;
    image_url?: string;
  };
}

export interface ComboRecommendation {
  id: string;
  name: string;
  description: string;
  items: ComboItem[];
  total: number;
  occasions: string[];
}

export interface ComboRecommendationResult {
  combos: ComboRecommendation[];
  budget_used: number;
}

export const useComboRecommend = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ComboRecommendationResult | null>(null);

  const generateCombos = async (
    conversationHistory: ConversationMessage[],
    budget: number,
    recommendedPerfumes: string[]
  ) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const { data: result, error: functionError } = await supabase.functions.invoke('combo-recommend', {
        body: { 
          conversationHistory,
          budget,
          recommendedPerfumes
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Erro ao gerar combos inteligentes');
      }

      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generateCombos, loading, error, data };
};