import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Package, User, MapPin, Heart, Ban, Gauge } from 'lucide-react';
import { useReprocessSubscription } from '@/hooks/useReprocessSubscription';
import { useSubscriptionHistory } from '@/hooks/useSubscriptionHistory';
import { ShipmentStatus } from '@/types/subscription';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface ShipmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: {
    id: string;
    month_year: string;
    status: ShipmentStatus;
    tracking_code: string | null;
    created_at: string;
    selection_reasoning: Record<string, any> | null;
    subscription_id: string;
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
      family?: string;
      gender?: string;
    }>;
  };
  preferences?: {
    preferred_families: string[];
    preferred_gender: string[];
    excluded_notes: string[];
    intensity_preference: string;
    surprise_me: boolean;
    notes: string | null;
  };
}

export function ShipmentDetailsModal({
  isOpen,
  onClose,
  shipment,
  preferences
}: ShipmentDetailsModalProps) {
  const { reprocessSelection, loading: reprocessing } = useReprocessSubscription();
  const { data: history } = useSubscriptionHistory(shipment.subscription_id);

  const handleReprocess = async () => {
    const success = await reprocessSelection(shipment.subscription_id);
    if (success) {
      toast({
        title: 'Seleção reprocessada',
        description: 'Novos perfumes foram selecionados para este envio'
      });
      onClose();
    }
  };

  const pastPerfumeIds = history
    ?.filter((h) => h.id !== shipment.id)
    ?.flatMap((h) => h.perfume_ids || []) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Detalhes do Envio - {shipment.month_year}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 p-4">
            {/* Status */}
            <div>
              <h3 className="font-semibold mb-2">Status Atual</h3>
              <Badge>{shipment.status}</Badge>
              {shipment.tracking_code && (
                <p className="text-sm text-muted-foreground mt-2">
                  Rastreio: <span className="font-mono">{shipment.tracking_code}</span>
                </p>
              )}
            </div>

            <Separator />

            {/* Informações do Plano */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Plano
              </h3>
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <p className="font-medium">{shipment.subscription.plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {shipment.subscription.plan.decants_per_month} decants de {shipment.subscription.plan.size_ml}ml por mês
                </p>
              </div>
            </div>

            <Separator />

            {/* Perfumes Selecionados */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Perfumes Selecionados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {shipment.perfumes.map((perfume) => (
                  <div key={perfume.id} className="flex gap-3 p-3 bg-muted rounded-lg">
                    {perfume.image_url ? (
                      <img
                        src={perfume.image_url}
                        alt={perfume.name}
                        className="h-20 w-20 object-cover rounded"
                      />
                    ) : (
                      <div className="h-20 w-20 bg-primary/10 rounded flex items-center justify-center">
                        <Package className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{perfume.brand}</p>
                      <p className="text-sm text-muted-foreground">{perfume.name}</p>
                      {perfume.family && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {perfume.family} • {perfume.gender}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasoning da Seleção */}
            {shipment.selection_reasoning && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Justificativa da Seleção</h3>
                  <div className="bg-muted p-3 rounded-lg">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {JSON.stringify(shipment.selection_reasoning, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            )}

            {/* Preferências do Cliente */}
            {preferences && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Preferências do Cliente
                  </h3>
                  <div className="space-y-3">
                    {preferences.preferred_families.length > 0 && (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2 mb-1">
                          <Heart className="h-3 w-3" />
                          Famílias Preferidas
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {preferences.preferred_families.map((family) => (
                            <Badge key={family} variant="secondary">
                              {family}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {preferences.excluded_notes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2 mb-1">
                          <Ban className="h-3 w-3" />
                          Notas Excluídas
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {preferences.excluded_notes.map((note) => (
                            <Badge key={note} variant="destructive">
                              {note}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {preferences.intensity_preference && (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2 mb-1">
                          <Gauge className="h-3 w-3" />
                          Intensidade
                        </p>
                        <Badge>{preferences.intensity_preference}</Badge>
                      </div>
                    )}

                    {preferences.notes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Observações</p>
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                          {preferences.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Histórico de Envios Anteriores */}
            {history && history.length > 1 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Histórico de Envios Anteriores</h3>
                  <div className="space-y-2">
                    {history
                      .filter((h) => h.id !== shipment.id)
                      .slice(0, 6)
                      .map((h) => (
                        <div key={h.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <span>{h.month_year}</span>
                          <Badge variant="outline">{h.status}</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Ações Avançadas */}
            <Separator />
            <div>
              <h3 className="font-semibold mb-3">Ações Avançadas</h3>
              <Button
                onClick={handleReprocess}
                disabled={reprocessing || shipment.status !== 'pending'}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${reprocessing ? 'animate-spin' : ''}`} />
                Reprocessar Seleção de Perfumes
              </Button>
              {shipment.status !== 'pending' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Reprocessamento disponível apenas para envios pendentes
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
