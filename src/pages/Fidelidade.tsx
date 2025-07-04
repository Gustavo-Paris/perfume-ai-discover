import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePointsTransactions, useUserPoints, useCurrentTier } from "@/hooks/usePointsTransactions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Star, TrendingUp, Gift } from "lucide-react";

export default function Fidelidade() {
  const { data: points = 0, isLoading: pointsLoading } = useUserPoints();
  const { data: transactions = [], isLoading: transactionsLoading } = usePointsTransactions();
  const { currentTier, nextTier, pointsToNext } = useCurrentTier();

  const formatPoints = (points: number) => {
    return points.toLocaleString('pt-BR');
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'order_paid':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'review_approved':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'redemption':
        return <Gift className="h-4 w-4 text-red-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'order_paid':
        return 'Compra';
      case 'review_approved':
        return 'Avaliação';
      case 'redemption':
        return 'Resgate';
      default:
        return source;
    }
  };

  if (pointsLoading || transactionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Programa de Fidelidade</h1>
        <p className="text-muted-foreground mt-2">
          Acumule pontos e ganhe benefícios exclusivos
        </p>
      </div>

      {/* Saldo e Tier */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Seus Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPoints(points)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              pontos disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nível Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {currentTier?.name || 'Bronze'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentTier?.multiplier}x pontos
              </span>
            </div>
          </CardContent>
        </Card>

        {nextTier && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Próximo Nível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{nextTier.name}</span>
                  <span>{formatPoints(pointsToNext)} pontos</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, ((points - (currentTier?.min_points || 0)) / pointsToNext) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Como funciona */}
      <Card>
        <CardHeader>
          <CardTitle>Como Ganhar Pontos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">Compras</p>
              <p className="text-sm text-muted-foreground">
                1 ponto para cada R$ 1,00 gasto
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Star className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-medium">Avaliações</p>
              <p className="text-sm text-muted-foreground">
                20 pontos por avaliação aprovada
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pontos</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma transação encontrada
            </p>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction, index) => (
                <div key={transaction.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSourceIcon(transaction.source)}
                      <div>
                        <p className="font-medium">
                          {transaction.description || getSourceLabel(transaction.source)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.created_at), "d 'de' MMMM 'às' HH:mm", {
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.delta > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.delta > 0 ? '+' : ''}{formatPoints(transaction.delta)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Saldo: {formatPoints(transaction.balance_after)}
                      </p>
                    </div>
                  </div>
                  {index < transactions.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}