import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const StarRating = ({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = 'md',
  showValue = false 
}: StarRatingProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={cn(
              "transition-colors",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default"
            )}
            onClick={() => handleStarClick(star)}
            disabled={readonly}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                star <= rating 
                  ? "fill-amber-400 text-amber-400" 
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-muted-foreground ml-2">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;