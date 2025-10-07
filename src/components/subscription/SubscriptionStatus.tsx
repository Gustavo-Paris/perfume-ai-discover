import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, CreditCard, AlertCircle, CheckCircle, PauseCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserSubscription, SubscriptionPlan } from '@/types/subscription';

interface SubscriptionStatusProps {
  subscription: UserSubscription & { plan?: SubscriptionPlan };
}

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle,
          label: 'Ativa',
          variant: 'default' as const,
          color: 'text-green-600'
        };
      case 'paused':
        return {
          icon: PauseCircle,
          label: 'Pausada',
          variant: 'secondary' as const,
          color: 'text-yellow-600'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          label: 'Cancelada',
          variant: 'destructive' as const,
          color: 'text-red-600'
        };
      case 'past_due':
        return {
          icon: AlertCircle,
          label: 'Pagamento Pendente',
          variant: 'destructive' as const,
          color: 'text-orange-600'
        };
      default:
        return {
          icon: AlertCircle,
          label: status,
          variant: 'secondary' as const,
          color: 'text-gray-600'
        };
    }
  };

  const statusConfig = getStatusConfig(subscription.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Status da Assinatura</span>
          <Badge variant={statusConfig.variant}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {statusConfig.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Período Atual</p>
              <p className="text-sm text-muted-foreground">
                {subscription.current_period_start && subscription.current_period_end ? (
                  <>
                    {format(new Date(subscription.current_period_start), 'dd/MM/yyyy', { locale: ptBR })}
                    {' - '}
                    {format(new Date(subscription.current_period_end), 'dd/MM/yyyy', { locale: ptBR })}
                  </>
                ) : (
                  'Não disponível'
                )}
              </p>
            </div>
          </div>

          {subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date() && (
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Período de Trial</p>
                <p className="text-sm text-muted-foreground">
                  Termina em {format(new Date(subscription.trial_ends_at), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          )}

          {subscription.plan && (
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Plano</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.plan.name} - R$ {subscription.plan.price_monthly.toFixed(2)}/mês
                </p>
              </div>
            </div>
          )}
        </div>

        {subscription.cancel_at_period_end && (
          <div className="rounded-lg bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              <AlertCircle className="inline h-4 w-4 mr-1" />
              Sua assinatura será cancelada ao final do período atual
            </p>
          </div>
        )}

        {subscription.status === 'past_due' && (
          <div className="rounded-lg bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              <AlertCircle className="inline h-4 w-4 mr-1" />
              Há um problema com o pagamento. Por favor, atualize seu método de pagamento.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
