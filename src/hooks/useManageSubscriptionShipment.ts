import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ShipmentStatus } from '@/types/subscription';

export const useManageSubscriptionShipment = () => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['subscription-shipments'] });
    queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-history'] });
  };

  const logSubscriptionEvent = async (
    subscriptionId: string,
    eventType: string,
    eventData: Record<string, any>
  ) => {
    try {
      await supabase.rpc('log_subscription_event', {
        p_subscription_id: subscriptionId,
        p_event_type: eventType,
        p_event_data: eventData
      });
    } catch (error) {
      console.error('Erro ao logar evento:', error);
    }
  };

  const updateShipmentStatus = async (
    id: string,
    status: ShipmentStatus
  ): Promise<boolean> => {
    try {
      setLoading(true);

      // Buscar dados do envio primeiro
      const { data: shipment } = await supabase
        .from('subscription_shipments')
        .select('subscription_id, status')
        .eq('id', id)
        .single();

      if (!shipment) {
        throw new Error('Envio não encontrado');
      }

      // Atualizar status
      const { error } = await supabase
        .from('subscription_shipments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Logar evento
      await logSubscriptionEvent(shipment.subscription_id, 'status_changed', {
        shipment_id: id,
        old_status: shipment.status,
        new_status: status
      });

      toast({
        title: 'Status atualizado',
        description: `Envio marcado como "${status}"`
      });

      invalidateQueries();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addTrackingCode = async (
    id: string,
    trackingCode: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const { data: shipment, error: fetchError } = await supabase
        .from('subscription_shipments')
        .select('subscription_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('subscription_shipments')
        .update({ 
          tracking_code: trackingCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await logSubscriptionEvent(shipment.subscription_id, 'tracking_added', {
        shipment_id: id,
        tracking_code: trackingCode
      });

      toast({
        title: 'Código de rastreio adicionado',
        description: `Código: ${trackingCode}`
      });

      invalidateQueries();
      return true;
    } catch (error: any) {
      console.error('Erro ao adicionar código de rastreio:', error);
      toast({
        title: 'Erro ao adicionar código',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const markAsShipped = async (
    id: string,
    trackingCode: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const { data: shipment, error: fetchError } = await supabase
        .from('subscription_shipments')
        .select('subscription_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const now = new Date().toISOString();

      const { error } = await supabase
        .from('subscription_shipments')
        .update({
          status: 'shipped',
          tracking_code: trackingCode,
          shipped_at: now,
          updated_at: now
        })
        .eq('id', id);

      if (error) throw error;

      await logSubscriptionEvent(shipment.subscription_id, 'shipped', {
        shipment_id: id,
        tracking_code: trackingCode,
        shipped_at: now
      });

      toast({
        title: 'Envio marcado como enviado',
        description: `Rastreio: ${trackingCode}`
      });

      invalidateQueries();
      return true;
    } catch (error: any) {
      console.error('Erro ao marcar como enviado:', error);
      toast({
        title: 'Erro ao marcar como enviado',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const markAsDelivered = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);

      const { data: shipment, error: fetchError } = await supabase
        .from('subscription_shipments')
        .select('subscription_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const now = new Date().toISOString();

      const { error } = await supabase
        .from('subscription_shipments')
        .update({
          status: 'delivered',
          delivered_at: now,
          updated_at: now
        })
        .eq('id', id);

      if (error) throw error;

      await logSubscriptionEvent(shipment.subscription_id, 'delivered', {
        shipment_id: id,
        delivered_at: now
      });

      toast({
        title: 'Envio marcado como entregue',
        description: 'Cliente notificado por e-mail'
      });

      invalidateQueries();
      return true;
    } catch (error: any) {
      console.error('Erro ao marcar como entregue:', error);
      toast({
        title: 'Erro ao marcar como entregue',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateShipmentStatus,
    addTrackingCode,
    markAsShipped,
    markAsDelivered,
    loading
  };
};
