import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { sanitizeSearchQuery } from '@/utils/securityEnhancements';

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
    const value = sanitizeSearchQuery(e.target.value);
    setQuery(value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      const sanitizedQuery = sanitizeSearchQuery(query.trim());
      navigate(`/catalogo?q=${encodeURIComponent(sanitizedQuery)}`);
      setShowSuggestions(false);
      onClose?.();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      onClose?.();
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      const sanitizedQuery = sanitizeSearchQuery(query.trim());
      navigate(`/catalogo?q=${encodeURIComponent(sanitizedQuery)}`);
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto animate-in slide-in-from-top-2">
          {hasContent ? (
            // Mostrar sugestões de busca
            <div className="p-3">
              {loading && (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                  Buscando...
                </div>
              )}
              
              {!loading && suggestions.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Sugestões
                  </div>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted flex items-center justify-between text-sm group"
                    >
                      <span className="truncate">{suggestion.text}</span>
                      {suggestion.type === 'product' && (
                        <span className="text-xs text-muted-foreground ml-2 opacity-60 group-hover:opacity-100">Produto</span>
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
            <div className="p-3">
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Recentes</span>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 3).map((search, index) => (
                      <button
                        key={`recent-${index}`}
                        onClick={() => handleQuickSearchClick(search)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm text-muted-foreground hover:text-foreground"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {popularSearches.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-2 text-xs font-medium text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>Populares</span>
                  </div>
                  <div className="space-y-1">
                    {popularSearches.slice(0, 3).map((search, index) => (
                      <button
                        key={`popular-${index}`}
                        onClick={() => handleQuickSearchClick(search)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm text-muted-foreground hover:text-foreground"
                      >
                        {search}
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