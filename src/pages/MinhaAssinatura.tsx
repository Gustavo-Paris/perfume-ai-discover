import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Settings, History, Pause, Play, XCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { PreferencesForm } from '@/components/subscription/PreferencesForm';
import { ShipmentHistory } from '@/components/subscription/ShipmentHistory';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useManageSubscription } from '@/hooks/useManageSubscription';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MinhaAssinatura() {
  const navigate = useNavigate();
  const { data: subscription, isLoading } = useUserSubscription();
  const { pauseSubscription, resumeSubscription, cancelSubscription, loading: actionLoading } = useManageSubscription();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  const handlePause = async () => {
    if (subscription) {
      await pauseSubscription(subscription.id);
    }
  };

  const handleResume = async () => {
    if (subscription) {
      await resumeSubscription(subscription.id);
    }
  };

  const handleCancel = async () => {
    if (subscription) {
      await cancelSubscription(subscription.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen py-16 px-4">
        <SEO title="Minha Assinatura" />
        <div className="max-w-2xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nenhuma assinatura ativa</AlertTitle>
            <AlertDescription>
              Você ainda não possui uma assinatura. Que tal conhecer nossos planos?
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button onClick={() => navigate('/assinaturas')}>
              Ver Planos Disponíveis
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Minha Assinatura" />
      
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Minha Assinatura</h1>
            <p className="text-muted-foreground">
              Gerencie sua assinatura, preferências e histórico de envios
            </p>
          </div>

          {/* Status Card */}
          <SubscriptionStatus subscription={subscription} />

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            {subscription.status === 'active' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={actionLoading}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar Assinatura
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Pausar assinatura?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Sua assinatura será pausada e você não receberá novos envios até reativá-la.
                      Você pode reativar a qualquer momento.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePause}>
                      Confirmar Pausa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {subscription.status === 'paused' && (
              <Button onClick={handleResume} disabled={actionLoading}>
                <Play className="h-4 w-4 mr-2" />
                Reativar Assinatura
              </Button>
            )}

            {!subscription.cancel_at_period_end && subscription.status !== 'cancelled' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={actionLoading}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar Assinatura
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Você continuará recebendo seus decants até o final do período já pago.
                      Após isso, sua assinatura será encerrada. Você pode reativar posteriormente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Não cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
                      Sim, cancelar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="preferences" className="space-y-6">
            <TabsList>
              <TabsTrigger value="preferences">
                <Settings className="h-4 w-4 mr-2" />
                Preferências
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preferences">
              <PreferencesForm
                subscriptionId={subscription.id}
                preferences={subscription.preferences}
              />
            </TabsContent>

            <TabsContent value="history">
              <ShipmentHistory subscriptionId={subscription.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
