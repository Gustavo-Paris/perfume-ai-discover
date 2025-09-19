import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const [query, setQuery] = useState('');

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base', 
    lg: 'h-14 text-lg'
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      // Navigate to catalog with search query
      navigate(`/catalogo?q=${encodeURIComponent(query.trim())}`);
      onClose?.();
    } else if (e.key === 'Escape') {
      onClose?.();
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(query.trim())}`);
      onClose?.();
    }
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
    </div>
  );
};

export default HeaderSearchBox;