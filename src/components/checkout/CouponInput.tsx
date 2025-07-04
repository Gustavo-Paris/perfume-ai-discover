import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Tag, X } from 'lucide-react';
import { useValidateCoupon } from '@/hooks/useCoupons';
import { CouponValidationResult } from '@/types/coupon';

interface CouponInputProps {
  orderTotal: number;
  onCouponApplied: (result: CouponValidationResult) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: {
    code: string;
    discount_amount: number;
  };
}

export const CouponInput = ({ 
  orderTotal, 
  onCouponApplied, 
  onCouponRemoved,
  appliedCoupon 
}: CouponInputProps) => {
  const [couponCode, setCouponCode] = useState('');
  const [showInput, setShowInput] = useState(false);
  
  const validateCoupon = useValidateCoupon();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    const result = await validateCoupon.mutateAsync({
      code: couponCode.trim().toUpperCase(),
      orderTotal
    });

    if (result.valid) {
      onCouponApplied(result);
      setShowInput(false);
      setCouponCode('');
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setCouponCode('');
    setShowInput(false);
  };

  if (appliedCoupon) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700">
              <Tag className="h-4 w-4" />
              <span className="font-medium">
                Cupom {appliedCoupon.code} aplicado
              </span>
              <span className="text-sm">
                (-R$ {appliedCoupon.discount_amount.toFixed(2)})
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              className="text-green-700 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!showInput) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowInput(true)}
        className="w-full"
      >
        <Tag className="mr-2 h-4 w-4" />
        Adicionar cupom de desconto
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="coupon">Código do cupom</Label>
          <div className="flex gap-2">
            <Input
              id="coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Digite o código do cupom"
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyCoupon();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim() || validateCoupon.isPending}
            >
              {validateCoupon.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Aplicar'
              )}
            </Button>
          </div>
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowInput(false)}
          className="w-full"
        >
          Cancelar
        </Button>
      </CardContent>
    </Card>
  );
};