import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Package, Truck, CheckCircle, Clock, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { useManageSubscriptionShipment } from '@/hooks/useManageSubscriptionShipment';
import { ShipmentStatus } from '@/types/subscription';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingShipmentCardProps {
  shipment: {
    id: string;
    month_year: string;
    status: ShipmentStatus;
    tracking_code: string | null;
    created_at: string;
    subscription: {
      user_id: string;
      plan: {
        name: string;
        decants_per_month: number;
        size_ml: number;
      };
    };
    perfumes: Array<{
      id: string;
      name: string;
      brand: string;
      image_url: string | null;
    }>;
  };
  onViewDetails: () => void;
}

export function PendingShipmentCard({ shipment, onViewDetails }: PendingShipmentCardProps) {
  const [trackingInput, setTrackingInput] = useState(shipment.tracking_code || '');
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const { updateShipmentStatus, addTrackingCode, markAsShipped, loading } = useManageSubscriptionShipment();

  const getStatusConfig = (status: ShipmentStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendente',
          icon: Clock,
          variant: 'secondary' as const,
          color: 'text-yellow-600'
        };
      case 'processing':
        return {
          label: 'Processando',
          icon: Package,
          variant: 'default' as const,
          color: 'text-blue-600'
        };
      case 'shipped':
        return {
          label: 'Enviado',
          icon: Truck,
          variant: 'default' as const,
          color: 'text-purple-600'
        };
      case 'delivered':
        return {
          label: 'Entregue',
          icon: CheckCircle,
          variant: 'default' as const,
          color: 'text-green-600'
        };
      default:
        return {
          label: status,
          icon: Clock,
          variant: 'secondary' as const,
          color: 'text-gray-600'
        };
    }
  };

  const statusConfig = getStatusConfig(shipment.status);
  const StatusIcon = statusConfig.icon;

  const handleMarkAsProcessing = async () => {
    await updateShipmentStatus(shipment.id, 'processing');
    setShowProcessDialog(false);
  };

  const handleAddTracking = async () => {
    if (trackingInput.trim()) {
      await addTrackingCode(shipment.id, trackingInput.trim());
    }
  };

  const handleMarkAsShipped = async () => {
    if (trackingInput.trim()) {
      const success = await markAsShipped(shipment.id, trackingInput.trim());
      if (success) {
        setShowShipDialog(false);
      }
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">
                📅 {shipment.month_year}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {shipment.subscription.plan.name}
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Status atual do envio</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Perfumes Grid */}
          <div>
            <p className="text-sm font-medium mb-2">Perfumes Selecionados:</p>
            <div className="grid grid-cols-2 gap-2">
              {shipment.perfumes.map((perfume) => (
                <TooltipProvider key={perfume.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                        {perfume.image_url ? (
                          <img
                            src={perfume.image_url}
                            alt={perfume.name}
                            className="h-10 w-10 object-cover rounded"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{perfume.brand}</p>
                          <p className="text-xs text-muted-foreground truncate">{perfume.name}</p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{perfume.brand}</p>
                      <p className="text-sm">{perfume.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          {/* Tracking Code */}
          {shipment.status !== 'pending' && (
            <div>
              <Label htmlFor={`tracking-${shipment.id}`} className="text-sm font-medium mb-2 flex items-center gap-2">
                Código de Rastreio
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adicione um código válido dos Correios</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="flex gap-2">
                <Input
                  id={`tracking-${shipment.id}`}
                  placeholder="Ex: BR123456789"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  disabled={shipment.status === 'shipped' || shipment.status === 'delivered'}
                />
                {shipment.status === 'processing' && !shipment.tracking_code && (
                  <Button
                    onClick={handleAddTracking}
                    disabled={loading || !trackingInput.trim()}
                    size="sm"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onViewDetails}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver preferências, histórico e reprocessar</p>
                </TooltipContent>
              </Tooltip>

              {shipment.status === 'pending' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowProcessDialog(true)}
                      disabled={loading}
                      size="sm"
                      className="flex-1"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Package className="h-4 w-4 mr-2" />
                      )}
                      Processar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Marcar como em processamento</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {shipment.status === 'processing' && trackingInput.trim() && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowShipDialog(true)}
                      disabled={loading}
                      size="sm"
                      className="flex-1"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Truck className="h-4 w-4 mr-2" />
                      )}
                      Marcar como Enviado
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Confirmar envio e notificar cliente</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>

          {/* Created Date */}
          <p className="text-xs text-muted-foreground">
            Criado em {format(new Date(shipment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação - Processar */}
      <AlertDialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como Processando?</AlertDialogTitle>
            <AlertDialogDescription>
              O envio será movido para o status "Processando". Você poderá adicionar o código de rastreio na sequência.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsProcessing} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação - Enviar */}
      <AlertDialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Envio</AlertDialogTitle>
            <AlertDialogDescription>
              Confirme que o pedido foi enviado com o código de rastreio informado. O cliente receberá uma notificação por email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Código de Rastreio:</p>
              <p className="font-mono text-lg">{trackingInput}</p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsShipped} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Confirmar Envio'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
