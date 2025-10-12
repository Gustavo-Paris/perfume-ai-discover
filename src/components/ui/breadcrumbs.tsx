import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs Component
 * 
 * Provides navigation breadcrumbs for better UX and SEO.
 * Automatically includes Home as the first item.
 */
export const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
  const allItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    ...items
  ];

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn('flex items-center space-x-2 text-sm text-gray-600', className)}
    >
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        
        return (
          <div key={index} className="flex items-center space-x-2">
            {index === 0 ? (
              <Home className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
            
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className={cn(
                  isLast && 'text-gray-900 font-medium',
                  !item.href && 'cursor-default'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
};
