import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Tag, Calendar, Users, DollarSign, Percent } from 'lucide-react';
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from '@/hooks/useCoupons';
import { Coupon } from '@/types/coupon';
import { debugError } from '@/utils/removeDebugLogsProduction';

export default function AdminCoupons() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent' as 'percent' | 'value',
    value: '',
    max_uses: '',
    min_order_value: '',
    expires_at: '',
    is_active: true
  });

  const { data: coupons, isLoading } = useCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percent',
      value: '',
      max_uses: '',
      min_order_value: '',
      expires_at: '',
      is_active: true
    });
    setEditingCoupon(null);
  };

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      max_uses: coupon.max_uses?.toString() || '',
      min_order_value: coupon.min_order_value.toString(),
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
      is_active: coupon.is_active
    });
    setEditingCoupon(coupon);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (coupon: Coupon) => {
    try {
      await deleteCoupon.mutateAsync(coupon.code);
    } catch (error) {
      debugError('Error deleting coupon:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const couponData = {
      code: formData.code.toUpperCase(),
      type: formData.type,
      value: parseFloat(formData.value),
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      min_order_value: parseFloat(formData.min_order_value) || 0,
      expires_at: formData.expires_at || null,
      is_active: formData.is_active
    };

    try {
      if (editingCoupon) {
        await updateCoupon.mutateAsync({
          code: editingCoupon.code,
          updates: couponData
        });
      } else {
        await createCoupon.mutateAsync(couponData);
      }
      
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      debugError('Error saving coupon:', error);
    }
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (!coupon.is_active) {
      return <Badge variant="secondary">Inativo</Badge>;
    }
    return <Badge variant="default">Ativo</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Cupons de Desconto</h1>
            <p className="text-muted-foreground">
              Gerencie cupons de desconto e promoções
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCoupon ? 'Editar Cupom' : 'Criar Cupom'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código do Cupom</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: DESCONTO10"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'percent' | 'value') => 
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentual</SelectItem>
                        <SelectItem value="value">Valor Fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="value">
                      {formData.type === 'percent' ? 'Percentual (%)' : 'Valor (R$)'}
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      step={formData.type === 'percent' ? '1' : '0.01'}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder={formData.type === 'percent' ? '10' : '50.00'}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_uses">Limite de Usos</Label>
                    <Input
                      id="max_uses"
                      type="number"
                      value={formData.max_uses}
                      onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                      placeholder="Deixe vazio para ilimitado"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_order_value">Valor Mínimo do Pedido (R$)</Label>
                    <Input
                      id="min_order_value"
                      type="number"
                      step="0.01"
                      value={formData.min_order_value}
                      onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_at">Data de Expiração</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Cupom Ativo</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createCoupon.isPending || updateCoupon.isPending}
                  >
                    {editingCoupon ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {coupons?.map((coupon) => (
            <Card key={coupon.code}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Tag className="h-5 w-5 text-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{coupon.code}</h3>
                        {getStatusBadge(coupon)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {coupon.type === 'percent' 
                          ? `${coupon.value}% de desconto`
                          : `R$ ${coupon.value.toFixed(2)} de desconto`
                        }
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        {coupon.max_uses && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {coupon.current_uses}/{coupon.max_uses} usos
                          </span>
                        )}
                        {coupon.min_order_value > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Min: R$ {coupon.min_order_value.toFixed(2)}
                          </span>
                        )}
                        {coupon.expires_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expira: {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(coupon)}
                      disabled={updateCoupon.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={deleteCoupon.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o cupom <strong>{coupon.code}</strong>? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(coupon)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {coupons?.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum cupom criado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro cupom de desconto para oferecer promoções aos seus clientes.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Cupom
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
    </div>
  );
}