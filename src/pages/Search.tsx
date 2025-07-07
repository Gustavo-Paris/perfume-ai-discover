import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdvancedSearchBox from '@/components/search/AdvancedSearchBox';
import DynamicFilters from '@/components/search/DynamicFilters';
import PerfumeCard from '@/components/perfume/PerfumeCard';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { DatabasePerfume } from '@/types';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const {
    query,
    results,
    popularSearches,
    recentSearches,
    loading,
    filters,
    searchStats,
    handleSearch,
    performSearch,
    applyFilters,
    clearFilters
  } = useAdvancedSearch();

  const [showFilters, setShowFilters] = useState(false);

  // Executar busca inicial se há query na URL
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      handleSearch(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // Atualizar URL quando a query muda
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  // Converter resultados para formato compatível
  const displayResults = results.map((result: DatabasePerfume) => ({
    id: result.id,
    name: result.name,
    brand: result.brand,
    family: result.family,
    gender: result.gender,
    size_ml: [50, 100],
    price_full: Number(result.price_full),
    price_5ml: result.price_5ml ? Number(result.price_5ml) : 0,
    price_10ml: result.price_10ml ? Number(result.price_10ml) : 0,
    stock_full: 10,
    stock_5ml: 50,
    stock_10ml: 30,
    description: result.description || '',
    image_url: result.image_url || '',
    top_notes: result.top_notes,
    heart_notes: result.heart_notes,
    base_notes: result.base_notes,
    created_at: result.created_at
  }));

  const handleQuickSearch = (searchQuery: string) => {
    handleSearch(searchQuery);
    performSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div 
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4 text-gray-900">
            <SearchIcon className="inline-block mr-4 h-12 w-12 text-purple-600" />
            Busca <span className="text-brand-gradient">Avançada</span>
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
            Encontre o perfume perfeito com nossa busca inteligente
          </p>
        </motion.div>

        {/* Search Box */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AdvancedSearchBox
            placeholder="Buscar perfumes, marcas, notas olfativas..."
            onFiltersOpen={() => setShowFilters(true)}
            size="lg"
            className="max-w-4xl mx-auto"
          />
        </motion.div>

        {/* Quick Searches - Show when no query */}
        {!query && (
          <motion.div 
            className="mb-12 space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Popular Searches */}
            {popularSearches.length > 0 && (
              <Card className="glass rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h3 className="font-display font-semibold text-lg text-gray-900">
                      Buscas Populares
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((search, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-purple-100 hover:text-purple-800 transition-colors"
                        onClick={() => handleQuickSearch(search)}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Card className="glass rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h3 className="font-display font-semibold text-lg text-gray-900">
                      Buscas Recentes
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleQuickSearch(search)}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Results */}
        {query && (
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <motion.aside 
              className={`${showFilters ? 'block' : 'hidden'} md:block w-80 shrink-0`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <DynamicFilters
                filters={filters}
                onFiltersChange={applyFilters}
                onClearFilters={clearFilters}
                searchQuery={query}
                className="sticky top-24"
              />
            </motion.aside>

            {/* Results */}
            <motion.main 
              className="flex-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* Results Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900">
                    Resultados para "{query}"
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {searchStats.totalResults} produto{searchStats.totalResults !== 1 ? 's' : ''} encontrado{searchStats.totalResults !== 1 ? 's' : ''}
                    {searchStats.hasFilters && ' (com filtros aplicados)'}
                  </p>
                </div>
                
                {searchStats.hasFilters && (
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-red-100 hover:text-red-800"
                    onClick={clearFilters}
                  >
                    Limpar filtros
                  </Badge>
                )}
              </div>

              {/* Loading State */}
              {loading && (
                <Card className="glass rounded-2xl">
                  <CardContent className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600">Buscando perfumes...</p>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {!loading && searchStats.totalResults === 0 && (
                <Card className="glass rounded-2xl">
                  <CardContent className="text-center py-12">
                    <SearchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-display font-semibold text-xl mb-2 text-gray-900">
                      Nenhum resultado encontrado
                    </h3>
                    <p className="text-gray-600 mb-6 text-lg">
                      Tente buscar por outros termos ou ajustar os filtros
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Sugestões:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="outline" className="cursor-pointer" onClick={() => handleQuickSearch('masculino')}>
                          masculino
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer" onClick={() => handleQuickSearch('floral')}>
                          floral
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer" onClick={() => handleQuickSearch('amadeirado')}>
                          amadeirado
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Results Grid */}
              {!loading && displayResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayResults.map((perfume, index) => (
                    <motion.div
                      key={perfume.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                    >
                      <PerfumeCard perfume={perfume} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Search Statistics */}
              {!loading && displayResults.length > 0 && searchStats.avgPrice > 0 && (
                <motion.div 
                  className="mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <Card className="glass rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{searchStats.totalResults}</div>
                          <div>Produtos</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">
                            R$ {searchStats.avgPrice.toFixed(0)}
                          </div>
                          <div>Preço médio</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.main>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;