import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface NavigationBreadcrumbsProps {
  items: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const NavigationBreadcrumbs = ({ items, actions }: NavigationBreadcrumbsProps) => {
  return (
    <div className="flex items-center justify-between py-4 px-6 border-b bg-white">
      <nav className="flex items-center space-x-2 text-sm">
        <Link 
          to="/admin/config" 
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
        </Link>
        
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {item.href && !item.current ? (
              <Link 
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={item.current ? "font-medium text-foreground" : "text-muted-foreground"}>
                {item.label}
              </span>
            )}
          </div>
        ))}
      </nav>
      
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
};