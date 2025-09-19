import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';

interface HeaderSearchBoxProps {
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClose?: () => void;
}

const HeaderSearchBox = ({ 
  placeholder = "Buscar perfumes, marcas ou notas...",
  className,
  size = 'md',
  onClose
}: HeaderSearchBoxProps) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    query,
    setQuery,
    suggestions,
    recentSearches,
    popularSearches,
    loading,
    showSuggestions,
    setShowSuggestions,
    selectSuggestion
  } = useAdvancedSearch();

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowSuggestions]);

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base', 
    lg: 'h-14 text-lg'
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
      onClose?.();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      onClose?.();
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
      onClose?.();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(true);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: any) => {
    setQuery(suggestion.text);
    navigate(`/catalogo?q=${encodeURIComponent(suggestion.text)}`);
    setShowSuggestions(false);
    onClose?.();
  };

  const handleQuickSearchClick = (searchTerm: string) => {
    setQuery(searchTerm);
    navigate(`/catalogo?q=${encodeURIComponent(searchTerm)}`);
    setShowSuggestions(false);
    onClose?.();
  };

  const hasContent = query.length > 0;
  const showDropdown = showSuggestions && (hasContent ? suggestions.length > 0 : (recentSearches.length > 0 || popularSearches.length > 0));

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className={cn(
            "pl-10 pr-16",
            sizeClasses[size],
            "ring-2 ring-primary/20"
          )}
        />

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
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSearch}
            className="h-6 w-6 p-0 hover:bg-muted"
            disabled={!query.trim()}
          >
            <Search className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Dropdown de sugestões */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {hasContent ? (
            // Mostrar sugestões de busca
            <div className="p-2">
              {loading && (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                  Buscando...
                </div>
              )}
              
              {!loading && suggestions.length > 0 && (
                <div className="space-y-1">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 rounded-sm hover:bg-muted flex items-center space-x-2 text-sm"
                    >
                      <Search className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span>{suggestion.text}</span>
                      {suggestion.type === 'product' && (
                        <span className="text-xs text-muted-foreground ml-auto">Produto</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!loading && suggestions.length === 0 && (
                <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                  Nenhuma sugestão encontrada
                </div>
              )}
            </div>
          ) : (
            // Mostrar buscas populares e recentes
            <div className="p-2">
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Buscas Recentes</span>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 3).map((search, index) => (
                      <button
                        key={`recent-${index}`}
                        onClick={() => handleQuickSearchClick(search)}
                        className="w-full text-left px-3 py-2 rounded-sm hover:bg-muted flex items-center space-x-2 text-sm"
                      >
                        <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {popularSearches.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>Buscas Populares</span>
                  </div>
                  <div className="space-y-1">
                    {popularSearches.slice(0, 3).map((search, index) => (
                      <button
                        key={`popular-${index}`}
                        onClick={() => handleQuickSearchClick(search)}
                        className="w-full text-left px-3 py-2 rounded-sm hover:bg-muted flex items-center space-x-2 text-sm"
                      >
                        <TrendingUp className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recentSearches.length === 0 && popularSearches.length === 0 && (
                <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                  Digite para ver sugestões
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderSearchBox;