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
  MessageCircle,
  TrendingUp,
  Heart,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  Megaphone,
  Calculator,
  Boxes,
  Warehouse,
  Truck,
  Upload,
  Zap,
  FileText,
  Calendar,
  Building,
  BarChart3,
  Receipt,
  Bot,
  Shield,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface AdminNavItem {
  title: string;
  url: string;
  icon: any;
}

interface AdminNavGroup {
  title: string;
  icon: any;
  items: AdminNavItem[];
  defaultOpen?: boolean;
}

const adminNavData: (AdminNavItem | AdminNavGroup)[] = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  {
    title: 'Produtos',
    icon: Package,
    defaultOpen: true,
    items: [
      { title: 'Cadastrar Produto', url: '/admin/produto-cadastro', icon: Package },
      { title: 'Gerenciar Perfumes', url: '/admin/perfumes', icon: Package },
      { title: 'Lotes de Estoque', url: '/admin/lots', icon: Boxes },
      { title: 'Materiais', url: '/admin/materials-simplified', icon: Boxes },
    ]
  },
  {
    title: 'Estoque',
    icon: Warehouse,
    defaultOpen: false,
    items: [
      { title: 'Visão Geral', url: '/admin/stock', icon: Package },
      { title: 'Movimentações', url: '/admin/inventory', icon: TrendingUp },
    ]
  },
  {
    title: 'Vendas',
    icon: ShoppingBag,
    defaultOpen: false,
    items: [
      { title: '🤖 Pedidos Inteligentes', url: '/admin/orders', icon: Bot },
      { title: 'Assinaturas', url: '/admin/subscriptions', icon: Calendar },
      { title: 'Promoções', url: '/admin/promotions', icon: Percent },
      { title: 'Cupons', url: '/admin/coupons', icon: Tag },
    ]
  },
  {
    title: 'Fiscal & NF-e',
    icon: FileText,
    defaultOpen: false,
    items: [
      { title: 'Dashboard NFe', url: '/admin/nfe-dashboard', icon: BarChart3 },
      { title: 'Notas Fiscais', url: '/admin/fiscal-notes', icon: FileText },
    ]
  },
  {
    title: '🤖 Automação',
    icon: Zap,
    defaultOpen: false,
    items: [
      { title: 'Dashboard de Automação', url: '/admin/automation-dashboard', icon: BarChart3 },
      { title: 'Processamento Manual', url: '/admin/order-management', icon: Bot },
      { title: 'Configuração', url: '/admin/automation', icon: Settings },
    ]
  },
  {
    title: 'Logística',
    icon: Truck,
    defaultOpen: false,
    items: [
      { title: 'Envios & Coletas', url: '/admin/shipments', icon: Package },
      { title: 'Entrega Local', url: '/admin/local-delivery', icon: Truck },
    ]
  },
  {
    title: 'Clientes',
    icon: Users,
    defaultOpen: false,
    items: [
      { title: 'Usuários', url: '/admin/users', icon: Users },
      { title: 'Reviews', url: '/admin/reviews', icon: MessageSquare },
      { title: 'Afiliados', url: '/admin/affiliates', icon: UserPlus },
      { title: 'Suporte', url: '/admin/support', icon: MessageCircle },
    ]
  },
  {
    title: 'Sistema',
    icon: Settings,
    defaultOpen: false,
    items: [
      { title: '🚀 Configuração de Lançamento', url: '/admin/launch-setup', icon: Megaphone },
      { title: 'Dados da Empresa', url: '/admin/company', icon: Building },
      { title: 'Gerador de Sitemap', url: '/admin/sitemap', icon: FileText },
      { title: 'Upload de Imagens', url: '/admin/perfume-images', icon: Upload },
      { title: 'Importar CSV', url: '/admin/csv-import', icon: Upload },
      { title: 'Configurações', url: '/admin/config', icon: Settings },
      { title: 'Monitoramento', url: '/admin/monitoring', icon: TrendingUp },
      { title: 'Logs de Segurança', url: '/admin/security-logs', icon: Shield },
      { title: 'Alertas de Segurança', url: '/admin/security-alerts', icon: Bell },
    ]
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(adminNavData
      .filter((item): item is AdminNavGroup => 'items' in item && item.defaultOpen)
      .map(group => group.title)
    )
  );

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(path);
  };

  const isGroupActive = (group: AdminNavGroup) => {
    return group.items.some(item => isActive(item.url));
  };

  const toggleGroup = (groupTitle: string) => {
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(groupTitle)) {
      newOpenGroups.delete(groupTitle);
    } else {
      newOpenGroups.add(groupTitle);
    }
    setOpenGroups(newOpenGroups);
  };

  const getNavCls = (path: string) =>
    cn(
      "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors",
      isActive(path) 
        ? "bg-primary text-primary-foreground font-medium" 
        : "hover:bg-accent hover:text-accent-foreground"
    );

  const getGroupCls = (group: AdminNavGroup) =>
    cn(
      "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors font-medium",
      isGroupActive(group)
        ? "bg-accent text-accent-foreground" 
        : "hover:bg-accent/50 hover:text-accent-foreground"
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
              {adminNavData.map((item) => {
                // Single navigation item
                if ('url' in item) {
                  return (
                    <NavLink 
                      key={item.title}
                      to={item.url} 
                      end={item.url === '/admin'}
                      className={getNavCls(item.url)}
                    >
                      <item.icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  );
                }
                
                // Group with collapsible items
                const group = item as AdminNavGroup;
                const isGroupOpen = openGroups.has(group.title);
                
                return (
                  <Collapsible 
                    key={group.title}
                    open={isGroupOpen}
                    onOpenChange={() => toggleGroup(group.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={getGroupCls(group)}
                      >
                        <group.icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{group.title}</span>
                            {isGroupOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    
                    {!collapsed && (
                      <CollapsibleContent className="space-y-1">
                        <div className="ml-4 space-y-1 border-l border-border pl-4">
                          {group.items.map((subItem) => (
                            <NavLink
                              key={subItem.title}
                              to={subItem.url}
                              className={cn(
                                "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors",
                                isActive(subItem.url)
                                  ? "bg-primary text-primary-foreground font-medium"
                                  : "hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              <subItem.icon className="h-4 w-4 mr-3" />
                              <span>{subItem.title}</span>
                            </NavLink>
                          ))}
                        </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}