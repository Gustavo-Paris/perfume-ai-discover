import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Settings,
  Menu,
  X,
  Tag,
  MessageSquare,
  Percent,
  UserPlus,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Pedidos', url: '/admin/orders', icon: ShoppingBag },
  { title: 'Estoque', url: '/admin/stock', icon: Package },
  { title: 'Usuários', url: '/admin/users', icon: Users },
  { title: 'Reviews', url: '/admin/reviews', icon: MessageSquare },
  { title: 'Cupons', url: '/admin/coupons', icon: Tag },
  { title: 'Promoções', url: '/admin/promotions', icon: Percent },
  { title: 'Afiliados', url: '/admin/affiliates', icon: UserPlus },
  { title: 'Suporte', url: '/admin/support', icon: MessageCircle },
  { title: 'Perfumes', url: '/admin/perfumes', icon: Package },
  { title: 'Lotes', url: '/admin/lots', icon: Package },
  { title: 'Inventário', url: '/admin/inventory', icon: Package },
  { title: 'Configurações', url: '/admin/config', icon: Settings },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) =>
    cn(
      "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors",
      isActive(path) 
        ? "bg-primary text-primary-foreground font-medium" 
        : "hover:bg-accent hover:text-accent-foreground"
    );

  return (
    <>
      {/* Mobile backdrop */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <div className={cn(
        "fixed lg:static left-0 top-0 z-40 h-full lg:h-auto transition-all duration-300",
        "bg-background border-r shadow-lg lg:shadow-none",
        collapsed ? "w-14 -translate-x-full lg:translate-x-0" : "w-60 translate-x-0",
        "lg:w-60 overflow-y-auto"
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between px-3 border-b">
            {!collapsed && (
              <span className="text-lg font-semibold">Admin</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <nav className="flex-1 p-3">
            <div className="space-y-1">
              {adminNavItems.map((item) => (
                <NavLink 
                  key={item.title}
                  to={item.url} 
                  end={item.url === '/admin'}
                  className={getNavCls(item.url)}
                >
                  <item.icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}