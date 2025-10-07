import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RefreshCw, Package, User, Heart, Ban, Gauge, Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useReprocessSubscription } from '@/hooks/useReprocessSubscription';
import { useSubscriptionHistory } from '@/hooks/useSubscriptionHistory';
import { ShipmentStatus } from '@/types/subscription';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [showReprocessDialog, setShowReprocessDialog] = useState(false);
  const { reprocessSelection, loading: reprocessing } = useReprocessSubscription();
  const { data: history, isLoading: loadingHistory } = useSubscriptionHistory(shipment.subscription_id);

  const handleReprocess = async () => {
    const success = await reprocessSelection(shipment.subscription_id);
    if (success) {
      toast({
        title: 'Seleção reprocessada',
        description: 'Novos perfumes foram selecionados para este envio',
        duration: 3000,
      });
      setShowReprocessDialog(false);
      onClose();
    }
  };

  const getStatusBadgeVariant = (status: ShipmentStatus) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      default: return 'secondary';
    }
  };

  const pastPerfumeIds = history
    ?.filter((h) => h.id !== shipment.id)
    ?.flatMap((h) => h.perfume_ids || []) || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Package className="h-6 w-6" />
              Detalhes do Envio - {shipment.month_year}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="space-y-6 p-4">
              {/* Status */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Status Atual
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(shipment.status)}>
                    {shipment.status}
                  </Badge>
                  {shipment.tracking_code && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <code className="text-sm font-mono bg-muted px-3 py-1 rounded cursor-help">
                            {shipment.tracking_code}
                          </code>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Código de rastreamento</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
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
                    <TooltipProvider key={perfume.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-help">
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
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Clique para copiar o nome</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>

              {/* Reasoning da Seleção */}
              {shipment.selection_reasoning && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Justificativa da Seleção
                    </h3>
                    <div className="bg-muted p-3 rounded-lg">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
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
                            <Heart className="h-3 w-3 text-red-500" />
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
                            <Ban className="h-3 w-3 text-red-500" />
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
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : history && history.length > 1 ? (
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
              ) : null}

              {/* Ações Avançadas */}
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Ações Avançadas</h3>
                
                {shipment.status === 'pending' ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => setShowReprocessDialog(true)}
                          disabled={reprocessing}
                          variant="outline"
                          className="w-full"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${reprocessing ? 'animate-spin' : ''}`} />
                          Reprocessar Seleção de Perfumes
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Executar novamente o algoritmo de seleção</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Reprocessamento indisponível</AlertTitle>
                    <AlertDescription>
                      O reprocessamento só está disponível para envios com status "Pendente".
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação - Reprocessar */}
      <AlertDialog open={showReprocessDialog} onOpenChange={setShowReprocessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Reprocessar Seleção de Perfumes?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá executar novamente o algoritmo de seleção de perfumes, substituindo os perfumes atuais por novos.
              <br /><br />
              <strong>Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Os novos perfumes serão selecionados com base nas preferências do cliente e no histórico de envios anteriores.
              </AlertDescription>
            </Alert>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReprocess} disabled={reprocessing}>
              {reprocessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reprocessando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Confirmar Reprocessamento
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
