import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionPlan } from '@/types/subscription';
import { useSubscriptionCheckout } from '@/hooks/useSubscriptionCheckout';

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  isPopular?: boolean;
  currentPlanId?: string;
}

export function SubscriptionPlanCard({ plan, isPopular, currentPlanId }: SubscriptionPlanCardProps) {
  const { createCheckout, loading } = useSubscriptionCheckout();
  const isCurrentPlan = currentPlanId === plan.id;

  const features = Array.isArray(plan.features) 
    ? plan.features 
    : JSON.parse(plan.features as any || '[]');

  return (
    <Card className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
            Mais Popular
          </span>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">
            R$ {plan.price_monthly.toFixed(2)}
          </span>
          <span className="text-muted-foreground">/mês</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          {features.map((feature: string, index: number) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        {isCurrentPlan ? (
          <Button disabled className="w-full">
            Plano Atual
          </Button>
        ) : (
          <Button 
            onClick={() => createCheckout(plan.id)}
            disabled={loading}
            className="w-full"
            variant={isPopular ? "default" : "outline"}
          >
            {loading ? "Processando..." : "Assinar Agora"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
