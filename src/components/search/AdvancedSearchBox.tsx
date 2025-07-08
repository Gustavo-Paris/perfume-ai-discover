import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Mic, X, Filter, Clock, TrendingUp, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAdvancedSearch, SearchSuggestion } from '@/hooks/useAdvancedSearch';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { ImageSearch } from '@/components/search/ImageSearch';
import { cn } from '@/lib/utils';

interface AdvancedSearchBoxProps {
  placeholder?: string;
  onResultsChange?: (results: any[]) => void;
  onFiltersOpen?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showImageSearch?: boolean;
}

const AdvancedSearchBox = ({ 
  placeholder = "Buscar perfumes, marcas ou notas...",
  onResultsChange,
  onFiltersOpen,
  className,
  size = 'md',
  showImageSearch = true
}: AdvancedSearchBoxProps) => {
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  
  const {
    query,
    results,
    suggestions,
    recentSearches,
    popularSearches,
    loading,
    showSuggestions,
    searchStats,
    handleSearch,
    selectSuggestion,
    performSearch,
    setShowSuggestions,
    clearRecentSearches
  } = useAdvancedSearch();

  const {
    isRecording,
    isSupported,
    startRecording,
    stopRecording
  } = useVoiceSearch();

  // Notificar mudanças nos resultados
  useEffect(() => {
    
    onResultsChange?.(results);
  }, [results, onResultsChange]);

  // Auto-search com debounce
  useEffect(() => {
    if (query.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        performSearch(query);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (query.trim().length === 0) {
      // Limpar resultados quando campo estiver vazio
      performSearch('');
    }
  }, [query, performSearch]);

  // Fechar sugestões quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleSearch(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      performSearch(query);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    
    
    // Usar o texto completo da sugestão - a busca inteligente vai lidar com ele
    const searchTerm = suggestion.text;
    
    
    handleSearch(searchTerm);
    performSearch(searchTerm);
    setShowSuggestions(false);
  };

  const handleVoiceSearch = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        handleSearch(result);
        performSearch(result);
      }
    } else {
      startRecording();
    }
  };

  const clearSearch = () => {
    handleSearch('');
    inputRef.current?.focus();
  };

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base', 
    lg: 'h-14 text-lg'
  };

  const shouldShowSuggestions = showSuggestions && isFocused && (
    suggestions.length > 0 || 
    recentSearches.length > 0 || 
    popularSearches.length > 0
  );

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            if (query.length >= 2 || recentSearches.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className={cn(
            "pl-10 pr-20",
            sizeClasses[size],
            isFocused && "ring-2 ring-primary/20"
          )}
        />

        {/* Botões de ação */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          {showImageSearch && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsImageSearchOpen(true)}
              className="h-6 w-6 p-0 hover:bg-muted"
              title="Buscar por imagem"
            >
              <Camera className="h-3 w-3" />
            </Button>
          )}
          
          {isSupported && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleVoiceSearch}
              className={cn(
                "h-6 w-6 p-0",
                isRecording ? "text-red-500 animate-pulse" : "hover:bg-muted"
              )}
            >
              <Mic className="h-3 w-3" />
            </Button>
          )}
          
          {onFiltersOpen && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onFiltersOpen}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <Filter className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
        </div>
      )}

      {/* Dropdown de sugestões */}
      {shouldShowSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-hidden shadow-lg animate-in slide-in-from-top-2">
          <div className="max-h-96 overflow-y-auto">
            {/* Sugestões baseadas na busca atual */}
            {suggestions.length > 0 && (
              <div className="p-3">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Sugestões
                </div>
                <div className="space-y-1">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-2 py-2 rounded-md hover:bg-muted text-sm flex items-center justify-between group"
                    >
                      <span className="truncate">{suggestion.text}</span>
                      <Badge variant="secondary" className="text-xs ml-2 opacity-60 group-hover:opacity-100">
                        {suggestion.type === 'product' ? 'Produto' :
                         suggestion.type === 'brand' ? 'Marca' :
                         suggestion.type === 'popular' ? 'Popular' :
                         suggestion.type}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Separador */}
            {suggestions.length > 0 && (recentSearches.length > 0 || popularSearches.length > 0) && (
              <Separator />
            )}

            {/* Buscas recentes */}
            {recentSearches.length > 0 && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Recentes
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="h-6 text-xs px-2"
                  >
                    Limpar
                  </Button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleSearch(search);
                        performSearch(search);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted text-sm text-muted-foreground hover:text-foreground"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Separador */}
            {recentSearches.length > 0 && popularSearches.length > 0 && (
              <Separator />
            )}

            {/* Buscas populares */}
            {popularSearches.length > 0 && (
              <div className="p-3">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Populares
                </div>
                <div className="space-y-1">
                  {popularSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleSearch(search);
                        performSearch(search);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted text-sm text-muted-foreground hover:text-foreground"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Stats de resultados */}
      {query && !showSuggestions && searchStats.totalResults > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1">
          <p className="text-xs text-muted-foreground">
            {searchStats.totalResults} resultado{searchStats.totalResults !== 1 ? 's' : ''} encontrado{searchStats.totalResults !== 1 ? 's' : ''}
            {searchStats.hasFilters && ' (com filtros aplicados)'}
          </p>
        </div>
      )}
      
      {/* Modal de busca por imagem */}
      <ImageSearch 
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
      />
    </div>
  );
};

export default AdvancedSearchBox;