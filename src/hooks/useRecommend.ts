
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RecommendationAnswers, RecommendationResult } from '@/types/recommendation';

export const useRecommend = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecommendationResult | null>(null);

  const recommend = async (answers: RecommendationAnswers) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const { data: result, error: functionError } = await supabase.functions.invoke('recommend', {
        body: { answers }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Erro ao buscar recomendações');
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

  return { recommend, loading, error, data };
};
