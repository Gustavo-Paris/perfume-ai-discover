import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Package, Calendar, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShipmentStatusProps {
  orderId: string;
}

interface Shipment {
  id: string;
  tracking_code?: string;
  service_name?: string;
  status: string;
  estimated_delivery_days?: number;
  created_at: string;
}

export const ShipmentStatus = ({ orderId }: ShipmentStatusProps) => {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShipment();
  }, [orderId]);

  const loadShipment = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading shipment:', error);
        return;
      }

      setShipment(data);
    } catch (error) {
      console.error('Error loading shipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'label_printed': return 'bg-blue-500 hover:bg-blue-600';
      case 'shipped': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'delivered': return 'bg-green-500 hover:bg-green-600';
      case 'cancelled': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Preparando';
      case 'label_printed': return 'Etiqueta Criada';
      case 'shipped': return 'Em Transporte';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Truck className="h-4 w-4 animate-pulse" />
        <span>Verificando envio...</span>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Package className="h-4 w-4" />
        <span>Aguardando processamento</span>
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Status do Envio</span>
            </div>
            
            <Badge className={`text-white ${getStatusColor(shipment.status)}`}>
              {getStatusText(shipment.status)}
            </Badge>
            
            {shipment.service_name && (
              <p className="text-xs text-gray-600">
                <strong>Serviço:</strong> {shipment.service_name}
              </p>
            )}
            
            {shipment.estimated_delivery_days && (
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>Prazo: {shipment.estimated_delivery_days} dias úteis</span>
              </div>
            )}
          </div>
          
          {shipment.tracking_code && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const trackingUrl = `https://melhorrastreio.com.br/rastreio/${shipment.tracking_code}`;
                window.open(trackingUrl, '_blank');
              }}
              className="flex items-center space-x-1"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="text-xs">Rastrear</span>
            </Button>
          )}
        </div>
        
        {shipment.tracking_code && (
          <div className="mt-3 p-2 bg-gray-50 rounded">
            <p className="text-xs font-medium text-gray-700">Código de Rastreamento:</p>
            <p className="text-sm font-mono text-gray-900">{shipment.tracking_code}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};