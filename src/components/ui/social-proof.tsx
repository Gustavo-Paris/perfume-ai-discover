import { Eye, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SocialProofProps {
  variant: 'purchases' | 'views' | 'users' | 'trending';
  count?: number;
  className?: string;
  animated?: boolean;
}

/**
 * SocialProof Component
 * 
 * Displays real-time social proof indicators to build trust and urgency.
 */
export const SocialProof = ({
  variant,
  count,
  className,
  animated = true
}: SocialProofProps) => {
  const [displayCount, setDisplayCount] = useState(count || 0);

  useEffect(() => {
    if (!count || !animated) return;

    // Animate count up
    const increment = Math.ceil(count / 20);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= count) {
        setDisplayCount(count);
        clearInterval(timer);
      } else {
        setDisplayCount(current);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [count, animated]);

  const configs = {
    purchases: {
      icon: ShoppingCart,
      label: 'compraram hoje',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    views: {
      icon: Eye,
      label: 'pessoas visualizando',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    users: {
      icon: Users,
      label: 'clientes satisfeitos',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    trending: {
      icon: TrendingUp,
      label: 'em alta',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  };

  const config = configs[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium',
        config.color,
        config.bgColor,
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span>
        {displayCount > 0 && (
          <span className="font-bold mr-1">{displayCount}</span>
        )}
        {config.label}
      </span>
    </div>
  );
};
