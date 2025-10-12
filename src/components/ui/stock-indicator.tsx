import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockIndicatorProps {
  stock: number;
  threshold?: {
    low: number;
    medium: number;
  };
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
}

/**
 * StockIndicator Component
 * 
 * Visual indicator for product stock levels with color-coded warnings.
 */
export const StockIndicator = ({
  stock,
  threshold = { low: 5, medium: 20 },
  size = 'md',
  showIcon = true,
  showText = true,
  className
}: StockIndicatorProps) => {
  const getStockStatus = () => {
    if (stock === 0) {
      return {
        label: 'Esgotado',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: XCircle
      };
    }
    
    if (stock <= threshold.low) {
      return {
        label: `Últimas ${stock} unidades!`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: AlertCircle
      };
    }
    
    if (stock <= threshold.medium) {
      return {
        label: `${stock} unidades disponíveis`,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: AlertCircle
      };
    }
    
    return {
      label: 'Em estoque',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle
    };
  };

  const status = getStockStatus();
  const Icon = status.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }[size];

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }[size];

  if (!showText && !showIcon) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-medium',
        status.color,
        status.bgColor,
        status.borderColor,
        sizeClasses,
        className
      )}
    >
      {showIcon && <Icon className={iconSizes} />}
      {showText && <span>{status.label}</span>}
    </div>
  );
};
