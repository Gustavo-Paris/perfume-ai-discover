import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Perfume } from '@/types';

export interface ImageSearchResult {
  perfume: Perfume;
  confidence: number;
  matchedFeatures?: string[];
}

export const useImageSearch = () => {
  const [results, setResults] = useState<ImageSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const searchByImage = async (imageFile: File) => {
    setIsLoading(true);
    setProgress(0);
    setResults([]);

    try {
      // Simular progresso
      setProgress(25);
      
      // Converter imagem para base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });

      setProgress(50);

      // Por enquanto, vamos fazer uma busca mock baseada em características simuladas
      // Em uma implementação real, isso seria enviado para um serviço de AI
      const mockFeatures = await analyzeImageMock(base64);
      
      setProgress(75);

      // Buscar perfumes similares baseado nas características
      const { data: perfumes, error } = await supabase
        .from('perfumes')
        .select('*')
        .limit(10);

      if (error) throw error;

      setProgress(90);

      // Simular scoring de similaridade
      const searchResults: ImageSearchResult[] = (perfumes || [])
        .map(perfume => ({
          perfume: {
            ...perfume,
            gender: perfume.gender as 'masculino' | 'feminino' | 'unissex',
            product_type: (perfume.product_type || 'decant') as 'decant' | 'miniature' | 'both',
            available_sizes: Array.isArray(perfume.available_sizes) ? perfume.available_sizes as number[] : [5, 10]
          },
          confidence: Math.random() * 0.6 + 0.4, // 0.4 - 1.0
          matchedFeatures: mockFeatures.filter(() => Math.random() > 0.5)
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 6);

      setProgress(100);
      setResults(searchResults);

      toast({
        title: "Busca concluída! 📸",
        description: `Encontramos ${searchResults.length} perfumes similares`,
      });

    } catch (error) {
      console.error('Error in image search:', error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível analisar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const analyzeImageMock = async (base64Image: string): Promise<string[]> => {
    // Simular análise de imagem - em produção isso seria um serviço real de AI
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const possibleFeatures = [
      'forma do frasco',
      'cor do líquido',
      'design da tampa',
      'formato retangular',
      'formato circular',
      'transparente',
      'colorido',
      'minimalista',
      'elegante',
      'moderno'
    ];

    return possibleFeatures.filter(() => Math.random() > 0.6);
  };

  const clearResults = () => {
    setResults([]);
    setProgress(0);
  };

  return {
    searchByImage,
    results,
    isLoading,
    progress,
    clearResults,
  };
};