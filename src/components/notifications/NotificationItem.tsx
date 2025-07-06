import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Package, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/types/notification';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  compact?: boolean;
}

const NotificationItem = ({ notification, onClick, compact = false }: NotificationItemProps) => {
  const getIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    
    switch (type) {
      case 'order_update':
        return <Package className={cn(iconClass, "text-blue-600")} />;
      case 'review_approved':
        return <Star className={cn(iconClass, "text-yellow-600")} />;
      case 'stock_alert':
        return <AlertTriangle className={cn(iconClass, "text-orange-600")} />;
      case 'system':
        return <Bell className={cn(iconClass, "text-gray-600")} />;
      default:
        return <Bell className={cn(iconClass, "text-gray-600")} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'order_update':
        return 'Pedido';
      case 'review_approved':
        return 'Avaliação';
      case 'stock_alert':
        return 'Estoque';
      case 'system':
        return 'Sistema';
      default:
        return type;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'order_update':
        return 'default';
      case 'review_approved':
        return 'secondary';
      case 'stock_alert':
        return 'destructive';
      case 'system':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all cursor-pointer hover:shadow-md",
        !notification.read && "border-l-4 border-l-primary bg-primary/5",
        notification.read && "opacity-75",
        compact && "border-0 shadow-none hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={getBadgeVariant(notification.type)} className="text-xs">
                {getTypeLabel(notification.type)}
              </Badge>
              {!notification.read && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
            
            <p className={cn(
              "text-sm leading-relaxed",
              compact ? "line-clamp-2" : "line-clamp-3"
            )}>
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR
                })}
              </p>
              
              {notification.read && (
                <CheckCircle className="h-3 w-3 text-green-600" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationItem;