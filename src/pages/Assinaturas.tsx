import { Sparkles, Heart, Truck, Shield } from 'lucide-react';
import SEO from '@/components/SEO';
import { SubscriptionPlanCard } from '@/components/subscription/SubscriptionPlanCard';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

export default function Assinaturas() {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');
  const cancelled = searchParams.get('cancelled');

  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: userSubscription } = useUserSubscription();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <SEO 
        title="Clube de Decants - Assinatura Mensal"
        description="Receba mensalmente uma seleção personalizada de decants premium. Descubra novas fragrâncias todos os meses com curadoria especializada."
      />

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          
          <div className="relative max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Clube Exclusivo de Decants</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Descubra fragrâncias incríveis
              <br />
              <span className="text-primary">todos os meses</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Receba uma seleção personalizada de decants premium na sua casa. 
              Curadoria especializada baseada nas suas preferências.
            </p>
          </div>
        </section>

        {/* Alertas */}
        {success && (
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Assinatura criada com sucesso! Você receberá um email de confirmação em breve.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {cancelled && (
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Alert variant="destructive">
              <AlertDescription>
                Checkout cancelado. Volte quando estiver pronto para assinar!
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Benefits Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Curadoria Personalizada</h3>
                <p className="text-sm text-muted-foreground">
                  Seleção baseada nas suas preferências e histórico
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Sem Repetição</h3>
                <p className="text-sm text-muted-foreground">
                  Nunca receba o mesmo perfume duas vezes
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Frete Grátis</h3>
                <p className="text-sm text-muted-foreground">
                  Entrega gratuita em todos os planos
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Cancele Quando Quiser</h3>
                <p className="text-sm text-muted-foreground">
                  Sem multas ou taxas de cancelamento
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                Escolha seu plano
              </h2>
              <p className="text-muted-foreground">
                Todos os planos incluem período de trial de 7 dias grátis
              </p>
            </div>

            {plansLoading ? (
              <div className="grid md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[500px]" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                {plans?.map((plan, index) => (
                  <SubscriptionPlanCard
                    key={plan.id}
                    plan={plan}
                    isPopular={index === 1}
                    currentPlanId={userSubscription?.plan_id}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              Perguntas Frequentes
            </h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Como funciona a curadoria?</h3>
                <p className="text-muted-foreground">
                  Você configura suas preferências (famílias olfativas, intensidade, notas que não gosta) 
                  e nossa equipe seleciona perfumes que combinam com seu perfil todos os meses.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Posso pular um mês?</h3>
                <p className="text-muted-foreground">
                  Sim! Você pode pausar sua assinatura a qualquer momento e reativar quando quiser, 
                  sem custos adicionais.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Quando recebo meu primeiro envio?</h3>
                <p className="text-muted-foreground">
                  Após o período de trial de 7 dias, processamos e enviamos sua primeira caixa. 
                  Os envios subsequentes ocorrem todo início de mês.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Como funciona o cancelamento?</h3>
                <p className="text-muted-foreground">
                  Você pode cancelar a qualquer momento sem multas. A assinatura permanece ativa 
                  até o final do período já pago.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Os decants são originais?</h3>
                <p className="text-muted-foreground">
                  Sim! Trabalhamos apenas com fragrâncias 100% originais e autênticas, 
                  fracionadas com todo cuidado e higiene.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 px-4 bg-primary text-primary-foreground">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pronto para começar sua jornada olfativa?
            </h2>
            <p className="text-lg opacity-90">
              Junte-se a centenas de assinantes satisfeitos. 7 dias grátis para experimentar!
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
