import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDownloadLabel } from '@/hooks/useDownloadLabel';
import { useScheduleCollection } from '@/hooks/useScheduleCollection';
import { CollectionScheduler } from './CollectionScheduler';
import { Download, Calendar, Package, Truck } from 'lucide-react';

interface Shipment {
  id: string;
  order_id: string;
  tracking_code: string;
  service_name: string;
  status: string;
  pdf_url?: string;
  created_at: string;
  estimated_delivery_days: number;
  melhor_envio_shipment_id: string;
  orders: {
    order_number: string;
    user_id: string;
  };
}

export const ShipmentManager = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const { toast } = useToast();
  const { downloadLabel, loading: downloadLoading } = useDownloadLabel();

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          orders (
            order_number,
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (error) {
      console.error('Error loading shipments:', error);
      toast({
        title: "Erro ao Carregar Envios",
        description: "Não foi possível carregar a lista de envios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLabel = async (shipmentId: string) => {
    try {
      await downloadLabel(shipmentId);
    } catch (error) {
      console.error('Error downloading label:', error);
    }
  };

  const handleSelectShipment = (shipmentId: string) => {
    setSelectedShipments(prev => 
      prev.includes(shipmentId) 
        ? prev.filter(id => id !== shipmentId)
        : [...prev, shipmentId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'label_printed': return 'bg-blue-500';
      case 'shipped': return 'bg-yellow-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'label_printed': return 'Etiqueta Impressa';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return <div className="p-6">Carregando envios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Envios</h2>
        <div className="flex gap-2">
          {selectedShipments.length > 0 && (
            <Button
              onClick={() => setShowScheduler(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Agendar Coleta ({selectedShipments.length})
            </Button>
          )}
          <Button onClick={loadShipments} variant="outline">
            Atualizar
          </Button>
        </div>
      </div>

      {showScheduler && (
        <Card>
          <CardHeader>
            <CardTitle>Agendar Coleta</CardTitle>
          </CardHeader>
          <CardContent>
            <CollectionScheduler
              selectedShipments={selectedShipments}
              onScheduled={() => {
                setShowScheduler(false);
                setSelectedShipments([]);
                loadShipments();
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {shipments.map((shipment) => (
          <Card key={shipment.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedShipments.includes(shipment.id)}
                    onChange={() => handleSelectShipment(shipment.id)}
                    className="rounded"
                  />
                  <div>
                    <h3 className="font-semibold">
                      Pedido: {shipment.orders.order_number}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Código: {shipment.tracking_code}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Serviço: {shipment.service_name} | 
                      Previsão: {shipment.estimated_delivery_days} dias
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(shipment.status)}>
                    {getStatusText(shipment.status)}
                  </Badge>
                  
                  <div className="flex gap-2">
                    {shipment.pdf_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadLabel(shipment.id)}
                        disabled={downloadLoading}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Etiqueta
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Package className="w-4 h-4" />
                      Rastrear
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {shipments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum envio encontrado</h3>
            <p className="text-muted-foreground">
              Os envios aparecerão aqui após os pedidos serem processados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};