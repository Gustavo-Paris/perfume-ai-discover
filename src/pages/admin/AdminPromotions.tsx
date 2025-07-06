import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Percent, DollarSign, Timer, Star } from 'lucide-react';
import { useActivePromotions, useCreatePromotion, useUpdatePromotion, useDeletePromotion, formatDiscount } from '@/hooks/usePromotions';
import { usePerfumes } from '@/hooks/usePerfumes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminPromotions() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [formData, setFormData] = useState({
    perfume_id: '',
    title: '',
    description: '',
    discount_type: 'percent' as 'percent' | 'fixed',
    discount_value: '',
    starts_at: '',
    ends_at: '',
    is_active: true
  });

  const { data: promotions, isLoading } = useActivePromotions();
  const { data: perfumes } = usePerfumes();
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();

  const resetForm = () => {
    setFormData({
      perfume_id: '',
      title: '',
      description: '',
      discount_type: 'percent',
      discount_value: '',
      starts_at: '',
      ends_at: '',
      is_active: true
    });
    setEditingPromotion(null);
  };

  const handleEdit = (promotion: any) => {
    setEditingPromotion(promotion);
    setFormData({
      perfume_id: promotion.perfume_id,
      title: promotion.title,
      description: promotion.description || '',
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value.toString(),
      starts_at: format(new Date(promotion.starts_at), 'yyyy-MM-dd\'T\'HH:mm'),
      ends_at: format(new Date(promotion.ends_at), 'yyyy-MM-dd\'T\'HH:mm'),
      is_active: promotion.is_active
    });
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const promotionData = {
      perfume_id: formData.perfume_id,
      title: formData.title,
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      starts_at: formData.starts_at,
      ends_at: formData.ends_at,
      is_active: formData.is_active
    };

    try {
      if (editingPromotion) {
        await updatePromotion.mutateAsync({
          id: editingPromotion.id,
          ...promotionData
        });
      } else {
        await createPromotion.mutateAsync(promotionData);
      }
      
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error saving promotion:', error);
    }
  };

  const getStatusBadge = (promotion: any) => {
    const now = new Date();
    const starts = new Date(promotion.starts_at);
    const ends = new Date(promotion.ends_at);

    if (!promotion.is_active) {
      return <Badge variant="secondary">Inativa</Badge>;
    }
    if (now < starts) {
      return <Badge variant="outline">Agendada</Badge>;
    }
    if (now > ends) {
      return <Badge variant="destructive">Expirada</Badge>;
    }
    return <Badge variant="default">Ativa</Badge>;
  };

  const selectedPerfume = perfumes?.find(p => p.id === formData.perfume_id);

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
          <h1 className="text-3xl font-bold">Promoções</h1>
          <p className="text-muted-foreground">
            Gerencie promoções e ofertas especiais para perfumes
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Promoção
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingPromotion ? 'Editar Promoção' : 'Criar Promoção'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="perfume_id">Perfume</Label>
                <Select
                  value={formData.perfume_id}
                  onValueChange={(value) => setFormData({ ...formData, perfume_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um perfume" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfumes?.map((perfume) => (
                      <SelectItem key={perfume.id} value={perfume.id}>
                        {perfume.brand} - {perfume.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título da Promoção</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Oferta Especial de Verão"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes da promoção"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: 'percent' | 'fixed') => 
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentual</SelectItem>
                      <SelectItem value="fixed">Valor Fixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    {formData.discount_type === 'percent' ? 'Percentual (%)' : 'Valor (R$)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step={formData.discount_type === 'percent' ? '1' : '0.01'}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'percent' ? '20' : '50.00'}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="starts_at">Início</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ends_at">Fim</Label>
                  <Input
                    id="ends_at"
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    required
                  />
                </div>
              </div>

              {selectedPerfume && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Preview do Desconto:</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDiscount(formData.discount_type, parseFloat(formData.discount_value) || 0)}
                    {' - '}
                    {selectedPerfume.brand} {selectedPerfume.name}
                  </p>
                </div>
              )}

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
                  disabled={createPromotion.isPending || updatePromotion.isPending}
                >
                  {editingPromotion ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {promotions?.map((promotion) => (
          <Card key={promotion.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Star className="h-5 w-5 text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{promotion.title}</h3>
                      {getStatusBadge(promotion)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {promotion.perfumes?.brand} - {promotion.perfumes?.name}
                    </p>
                    <p className="text-sm font-medium text-red-600">
                      {formatDiscount(promotion.discount_type, promotion.discount_value)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(promotion.starts_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {' - '}
                      {format(new Date(promotion.ends_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(promotion)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a promoção "{promotion.title}"?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePromotion.mutate(promotion.id)}
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
        
        {promotions?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma promoção criada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira promoção para oferecer descontos especiais aos seus clientes.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Promoção
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}