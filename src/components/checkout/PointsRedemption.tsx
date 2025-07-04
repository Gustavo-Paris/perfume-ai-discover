import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useUserPoints } from "@/hooks/usePointsTransactions";
import { Gift } from "lucide-react";

interface PointsRedemptionProps {
  subtotal: number;
  onPointsChange: (points: number, discount: number) => void;
}

export function PointsRedemption({ subtotal, onPointsChange }: PointsRedemptionProps) {
  const { data: availablePoints = 0 } = useUserPoints();
  const [pointsToUse, setPointsToUse] = useState(0);

  // Conversion rate: 100 points = R$5 (0.05 per point)
  const CONVERSION_RATE = 0.05;
  
  // Maximum discount: 20% of subtotal
  const maxDiscountAmount = subtotal * 0.2;
  const maxPointsAllowed = Math.min(
    availablePoints,
    Math.floor(maxDiscountAmount / CONVERSION_RATE)
  );

  const discountAmount = pointsToUse * CONVERSION_RATE;

  useEffect(() => {
    onPointsChange(pointsToUse, discountAmount);
  }, [pointsToUse, discountAmount, onPointsChange]);

  const handleSliderChange = (value: number[]) => {
    setPointsToUse(value[0]);
  };

  if (availablePoints === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-4 w-4" />
          Usar Pontos de Fidelidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Pontos disponíveis:
          </span>
          <Badge variant="outline">
            {availablePoints.toLocaleString('pt-BR')} pontos
          </Badge>
        </div>

        {maxPointsAllowed > 0 ? (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Pontos a usar:</span>
                <span className="font-medium">
                  {pointsToUse.toLocaleString('pt-BR')}
                </span>
              </div>
              
              <Slider
                value={[pointsToUse]}
                onValueChange={handleSliderChange}
                max={maxPointsAllowed}
                min={0}
                step={100}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{maxPointsAllowed.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            {pointsToUse > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">
                    Desconto aplicado:
                  </span>
                  <span className="font-medium text-green-700">
                    -R$ {discountAmount.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {pointsToUse.toLocaleString('pt-BR')} pontos = R$ {discountAmount.toFixed(2)}
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              • 100 pontos = R$ 5,00 de desconto
              • Máximo de 20% do valor do pedido
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Valor mínimo não atingido para usar pontos
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Pontos necessários: {Math.ceil(500 / CONVERSION_RATE)} (R$ 5,00 mínimo)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}