import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, Filter } from 'lucide-react';
import { useNotifications, useNotificationStats, useMarkAllNotificationsAsRead } from '@/hooks/useNotifications';
import NotificationItem from '@/components/notifications/NotificationItem';
import { Notification } from '@/types/notification';

const Notificacoes = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'order_update' | 'review_approved' | 'stock_alert' | 'system'>('all');
  
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: stats } = useNotificationStats();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const filteredNotifications = notifications.filter((notification: Notification) => {
    // Filter by read status
    if (filter === 'read' && !notification.read) return false;
    if (filter === 'unread' && notification.read) return false;
    
    // Filter by type
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    
    return true;
  });

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notificações
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe todas as atualizações importantes
          </p>
        </div>
        
        {stats && stats.unread > 0 && (
          <Button onClick={handleMarkAllAsRead} disabled={markAllAsReadMutation.isPending}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Não lidas</p>
                  <p className="text-2xl font-bold text-primary">{stats.unread}</p>
                </div>
                <Badge variant="default" className="h-8 w-8 rounded-full flex items-center justify-center p-0">
                  {stats.unread}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pedidos</p>
                  <p className="text-2xl font-bold">{stats.byType.order_update || 0}</p>
                </div>
                <Badge variant="default">Pedidos</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avaliações</p>
                  <p className="text-2xl font-bold">{stats.byType.review_approved || 0}</p>
                </div>
                <Badge variant="secondary">Avaliações</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                Todas ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-primary">
                Não lidas ({stats?.unread || 0})
              </TabsTrigger>
              <TabsTrigger value="read">
                Lidas ({(stats?.total || 0) - (stats?.unread || 0)})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Tipo:</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('all')}
              >
                Todas
              </Button>
              <Button
                variant={typeFilter === 'order_update' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('order_update')}
              >
                Pedidos ({stats?.byType.order_update || 0})
              </Button>
              <Button
                variant={typeFilter === 'review_approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('review_approved')}
              >
                Avaliações ({stats?.byType.review_approved || 0})
              </Button>
              <Button
                variant={typeFilter === 'stock_alert' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('stock_alert')}
              >
                Estoque ({stats?.byType.stock_alert || 0})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma notificação encontrada</h3>
              <p className="text-muted-foreground">
                {filter === 'unread' 
                  ? 'Você não tem notificações não lidas.' 
                  : 'Não há notificações para exibir com os filtros selecionados.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Notificacoes;