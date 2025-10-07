import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubscriptionShipment } from '@/types/subscription';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ShipmentHistoryProps {
  subscriptionId: string;
}

export function ShipmentHistory({ subscriptionId }: ShipmentHistoryProps) {
  const { data: shipments, isLoading } = useQuery({
    queryKey: ['subscription-shipments', subscriptionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_shipments')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('month_year', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as SubscriptionShipment[];
    }
  });

  // Buscar nomes dos perfumes
  const { data: perfumesMap } = useQuery({
    queryKey: ['perfumes-names', shipments?.flatMap(s => s.perfume_ids)],
    queryFn: async () => {
      if (!shipments || shipments.length === 0) return {};

      const allPerfumeIds = [...new Set(shipments.flatMap(s => s.perfume_ids))];
      
      const { data, error } = await supabase
        .from('perfumes')
        .select('id, name, brand')
        .in('id', allPerfumeIds);

      if (error) throw error;

      return Object.fromEntries(
        data.map(p => [p.id, `${p.brand} - ${p.name}`])
      );
    },
    enabled: !!shipments && shipments.length > 0
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered':
        return {
          icon: CheckCircle,
          label: 'Entregue',
          variant: 'default' as const,
          color: 'text-green-600'
        };
      case 'shipped':
        return {
          icon: Truck,
          label: 'Enviado',
          variant: 'secondary' as const,
          color: 'text-blue-600'
        };
      case 'processing':
        return {
          icon: Package,
          label: 'Processando',
          variant: 'secondary' as const,
          color: 'text-yellow-600'
        };
      case 'pending':
        return {
          icon: Clock,
          label: 'Pendente',
          variant: 'outline' as const,
          color: 'text-gray-600'
        };
      case 'failed':
        return {
          icon: XCircle,
          label: 'Falhou',
          variant: 'destructive' as const,
          color: 'text-red-600'
        };
      default:
        return {
          icon: Clock,
          label: status,
          variant: 'outline' as const,
          color: 'text-gray-600'
        };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Envios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!shipments || shipments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Envios</CardTitle>
          <CardDescription>Você ainda não recebeu nenhum envio</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Envios</CardTitle>
        <CardDescription>Últimos envios da sua assinatura</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {shipments.map((shipment) => {
            const statusConfig = getStatusConfig(shipment.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={shipment.id}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <StatusIcon className={`h-5 w-5 mt-0.5 ${statusConfig.color}`} />
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {format(new Date(shipment.month_year), 'MMMM yyyy', { locale: ptBR })}
                    </p>
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {shipment.perfume_ids.length} perfume(s) selecionado(s):
                    </p>
                    <ul className="text-sm space-y-0.5">
                      {shipment.perfume_ids.map((perfumeId) => (
                        <li key={perfumeId}>
                          • {perfumesMap?.[perfumeId] || 'Carregando...'}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {shipment.tracking_code && (
                    <p className="text-sm text-muted-foreground">
                      Rastreio: <span className="font-mono">{shipment.tracking_code}</span>
                    </p>
                  )}

                  {shipment.delivered_at && (
                    <p className="text-sm text-muted-foreground">
                      Entregue em {format(new Date(shipment.delivered_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
