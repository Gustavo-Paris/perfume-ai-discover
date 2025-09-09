import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'brand' | 'category' | 'note' | 'popular';
  relatedId?: string;
  score?: number;
}

export interface SearchResult {
  id: string;
  name: string;
  brand: string;
  image_url?: string;
  price_5ml?: number;
  price_10ml?: number;
  price_full: number;
  family: string;
  gender: string;
  description?: string;
  category?: string;
}

export interface SearchFilters {
  brands: string[];
  families: string[];
  genders: string[];
  priceRange: [number, number];
  categories: string[];
}

export const useAdvancedSearch = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    brands: [],
    families: [],
    genders: [],
    priceRange: [0, 1000],
    categories: []
  });

  const debouncedQuery = useDebounce(query, 300);

  // Buscar sugestões quando o usuário digita
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  // Carregar dados iniciais
  useEffect(() => {
    loadRecentSearches();
    loadPopularSearches();
  }, [user]);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    try {
      setLoading(true);
      
      // Buscar sugestões de produtos
      const { data: productSuggestions } = await supabase
        .from('perfumes')
        .select('id, name, brand')
        .or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
        .limit(5);

      // Buscar sugestões populares
      const { data: popularSuggestions } = await supabase
        .from('popular_searches')
        .select('query')
        .ilike('query', `%${searchQuery}%`)
        .order('search_count', { ascending: false })
        .limit(3);

      // Buscar sugestões personalizadas do usuário
      let personalSuggestions: any[] = [];
      if (user) {
        const { data } = await supabase
          .from('search_suggestions')
          .select('*')
          .eq('user_id', user.id)
          .ilike('suggestion_text', `%${searchQuery}%`)
          .order('score', { ascending: false })
          .limit(3);
        
        personalSuggestions = data || [];
      }

      // Combinar todas as sugestões
      const allSuggestions: SearchSuggestion[] = [
        ...(productSuggestions || []).map(p => ({
          id: p.id,
          text: `${p.brand} - ${p.name}`,
          type: 'product' as const,
          relatedId: p.id,
          score: 1.0
        })),
        ...(popularSuggestions || []).map(p => ({
          id: `popular-${p.query}`,
          text: p.query,
          type: 'popular' as const,
          score: 0.9
        })),
        ...personalSuggestions.map(s => ({
          id: s.id,
          text: s.suggestion_text,
          type: s.suggestion_type as any,
          relatedId: s.related_id,
          score: s.score
        }))
      ];

      setSuggestions(allSuggestions.slice(0, 8));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const performSearch = useCallback(async (searchQuery: string, appliedFilters?: Partial<SearchFilters>) => {
    
    if (!searchQuery.trim()) {
      
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      
      // Log da busca
      await logSearchQuery(searchQuery);

      // Buscar dados usando a função RPC
      const { data: allPerfumes } = await supabase.rpc('get_perfumes_with_stock');
      
      if (!allPerfumes) {
        setResults([]);
        return;
      }

      // Filtrar dados localmente
      let filteredResults = allPerfumes;

      // Aplicar busca por texto
      if (searchQuery.includes(' - ')) {
        const [brand, name] = searchQuery.split(' - ').map(s => s.trim().toLowerCase());
        // Busca específica: marca E nome devem corresponder
        filteredResults = filteredResults.filter(item =>
          item.brand?.toLowerCase().includes(brand) && 
          item.name?.toLowerCase().includes(name)
        );
      } else {
        // Busca geral: buscar em qualquer campo
        const searchTerm = searchQuery.toLowerCase();
        filteredResults = filteredResults.filter(item =>
          item.name?.toLowerCase().includes(searchTerm) ||
          item.brand?.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm)
        );
      }

      // Aplicar filtros
      const currentFilters = { ...filters, ...appliedFilters };
      
      if (currentFilters.brands.length > 0) {
        filteredResults = filteredResults.filter(item => 
          currentFilters.brands.includes(item.brand)
        );
      }
      
      if (currentFilters.families.length > 0) {
        filteredResults = filteredResults.filter(item => 
          currentFilters.families.includes(item.family)
        );
      }
      
      if (currentFilters.genders.length > 0) {
        filteredResults = filteredResults.filter(item => 
          currentFilters.genders.includes(item.gender)
        );
      }

      if (currentFilters.priceRange[0] > 0 || currentFilters.priceRange[1] < 1000) {
        filteredResults = filteredResults.filter(item =>
          item.price_full >= currentFilters.priceRange[0] &&
          item.price_full <= currentFilters.priceRange[1]
        );
      }

      // Ordenar e limitar resultados
      const sortedResults = filteredResults
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 20);

      setResults(sortedResults);
      
      // Atualizar histórico de buscas
      updateRecentSearches(searchQuery);
      
      // Fechar sugestões
      setShowSuggestions(false);

    } catch (error) {
      console.error('Error performing search:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const logSearchQuery = async (searchQuery: string) => {
    try {
      await supabase.functions.invoke('search-analytics', {
        body: {
          query: searchQuery,
          user_id: user?.id,
          results_count: results.length,
          filters: filters
        }
      });
    } catch (error) {
      console.error('Error logging search:', error);
    }
  };

  const loadRecentSearches = async () => {
    if (!user) {
      // Carregar do localStorage para usuários não logados
      const saved = localStorage.getItem('recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
      return;
    }

    try {
      const { data } = await supabase
        .from('search_queries')
        .select('query')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        const recent = [...new Set(data.map(d => d.query))];
        setRecentSearches(recent);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const loadPopularSearches = async () => {
    try {
      const { data } = await supabase
        .from('popular_searches')
        .select('query')
        .order('search_count', { ascending: false })
        .limit(5);

      if (data) {
        setPopularSearches(data.map(d => d.query));
      }
    } catch (error) {
      console.error('Error loading popular searches:', error);
    }
  };

  const updateRecentSearches = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(q => q !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    
    if (!user) {
      localStorage.setItem('recent_searches', JSON.stringify(updated));
    }
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    if (user) {
      await supabase
        .from('search_queries')
        .delete()
        .eq('user_id', user.id);
    } else {
      localStorage.removeItem('recent_searches');
    }
  };

  const applyFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    if (query) {
      performSearch(query, updatedFilters);
    }
  }, [filters, query, performSearch]);

  const clearFilters = useCallback(() => {
    const clearedFilters: SearchFilters = {
      brands: [],
      families: [],
      genders: [],
      priceRange: [0, 1000],
      categories: []
    };
    setFilters(clearedFilters);
    
    if (query) {
      performSearch(query, clearedFilters);
    }
  }, [query, performSearch]);

  // Estatísticas úteis
  const searchStats = useMemo(() => ({
    totalResults: results.length,
    hasFilters: filters.brands.length > 0 || filters.families.length > 0 || 
                filters.genders.length > 0 || filters.categories.length > 0 ||
                filters.priceRange[0] > 0 || filters.priceRange[1] < 1000,
    avgPrice: results.length > 0 ? 
      results.reduce((sum, r) => sum + r.price_full, 0) / results.length : 0
  }), [results, filters]);

  return {
    // Estados
    query,
    results,
    suggestions,
    recentSearches,
    popularSearches,
    loading,
    showSuggestions,
    filters,
    searchStats,
    
    // Ações
    setQuery,
    setShowSuggestions,
    performSearch,
    applyFilters,
    clearFilters,
    clearRecentSearches,
    
    // Helpers
    handleSearch: (searchQuery: string) => {
      setQuery(searchQuery);
      if (searchQuery.length >= 2) {
        setShowSuggestions(true);
      }
    },
    
    selectSuggestion: (suggestion: SearchSuggestion) => {
      setQuery(suggestion.text);
      performSearch(suggestion.text);
    }
  };
};

// Hook personalizado para busca com debounce
export const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};