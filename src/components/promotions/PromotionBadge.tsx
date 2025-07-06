import { Badge } from '@/components/ui/badge';
import { Timer, Percent, DollarSign } from 'lucide-react';
import { formatDiscount } from '@/hooks/usePromotions';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PromotionBadgeProps {
  promotion: {
    id: string;
    title: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    ends_at: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showTimer?: boolean;
}

const PromotionBadge = ({ promotion, size = 'md', showTimer = false }: PromotionBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const isExpiring = new Date(promotion.ends_at).getTime() - Date.now() < 24 * 60 * 60 * 1000; // Menos de 24h

  return (
    <div className="flex flex-col gap-1">
      <Badge 
        variant="destructive" 
        className={`
          ${sizeClasses[size]}
          bg-gradient-to-r from-red-500 to-red-600 
          text-white font-bold
          animate-pulse
          flex items-center gap-1
        `}
      >
        {promotion.discount_type === 'percent' ? (
          <Percent className={iconSize[size]} />
        ) : (
          <DollarSign className={iconSize[size]} />
        )}
        {formatDiscount(promotion.discount_type, promotion.discount_value)}
      </Badge>
      
      {showTimer && (
        <Badge 
          variant={isExpiring ? "destructive" : "secondary"}
          className={`${sizeClasses.sm} flex items-center gap-1 whitespace-nowrap`}
        >
          <Timer className="h-3 w-3" />
          {isExpiring ? 
            `Termina em ${formatDistanceToNow(new Date(promotion.ends_at), { locale: ptBR })}` :
            `Até ${format(new Date(promotion.ends_at), 'dd/MM', { locale: ptBR })}`
          }
        </Badge>
      )}
    </div>
  );
};

export default PromotionBadge;