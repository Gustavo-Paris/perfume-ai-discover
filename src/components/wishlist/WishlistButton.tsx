import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useIsInWishlist, useToggleWishlist } from '@/hooks/useWishlist';
import { toast } from '@/hooks/use-toast';

interface WishlistButtonProps {
  perfumeId: string;
  variant?: 'default' | 'icon' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function WishlistButton({ 
  perfumeId, 
  variant = 'default',
  size = 'md',
  className 
}: WishlistButtonProps) {
  const { user } = useAuth();
  const { data: isInWishlist = false, isLoading: checkingWishlist } = useIsInWishlist(perfumeId);
  const { toggle, isLoading } = useToggleWishlist();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para salvar perfumes nos favoritos",
        variant: "default",
      });
      return;
    }

    toggle(perfumeId, isInWishlist);
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-12 w-12'
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={isLoading || checkingWishlist}
        className={cn(
          sizeClasses[size],
          "rounded-full hover:bg-background/80 backdrop-blur-sm",
          "transition-all duration-200",
          isInWishlist && "text-red-500 hover:text-red-600",
          className
        )}
        aria-label={isInWishlist ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Heart 
          className={cn(
            iconSizeClasses[size],
            "transition-all duration-200",
            isInWishlist && "fill-current"
          )} 
        />
      </Button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading || checkingWishlist}
        className={cn(
          "p-2 rounded-full hover:bg-background/10 transition-colors duration-200",
          isInWishlist && "text-red-500",
          className
        )}
        aria-label={isInWishlist ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Heart 
          className={cn(
            iconSizeClasses[size],
            "transition-all duration-200",
            isInWishlist && "fill-current"
          )} 
        />
      </button>
    );
  }

  return (
    <Button
      variant={isInWishlist ? "default" : "outline"}
      onClick={handleClick}
      disabled={isLoading || checkingWishlist}
      className={cn(
        "transition-all duration-200",
        isInWishlist && "bg-red-500 hover:bg-red-600 text-white border-red-500",
        className
      )}
    >
      <Heart 
        className={cn(
          "mr-2 h-4 w-4 transition-all duration-200",
          isInWishlist && "fill-current"
        )} 
      />
      {isInWishlist ? 'Favoritado' : 'Favoritar'}
    </Button>
  );
}