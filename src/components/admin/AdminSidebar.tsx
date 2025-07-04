import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Pedidos', url: '/admin/orders', icon: ShoppingBag },
  { title: 'Estoque', url: '/admin/stock', icon: Package },
  { title: 'Usuários', url: '/admin/users', icon: Users },
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
    <div className={cn(
      "fixed left-0 top-0 z-40 h-screen transition-transform bg-background border-r",
      collapsed ? "w-14" : "w-60",
      "lg:translate-x-0"
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
            className="h-8 w-8"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
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
  );
}