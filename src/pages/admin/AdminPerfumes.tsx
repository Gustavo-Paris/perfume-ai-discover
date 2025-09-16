import { useState } from 'react';
import { Plus, Edit, Trash2, Upload, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { usePerfumes, useCreatePerfume, useUpdatePerfume, useDeletePerfume } from '@/hooks/usePerfumes';
import { useUpdatePerfumeMargin } from '@/hooks/useUpdatePerfumeMargin';
import { DatabasePerfume } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { syncPerfumesToAlgolia } from '@/utils/algoliaSync';

const AdminPerfumes = () => {
  const { data: perfumes, isLoading } = usePerfumes();
  const createPerfume = useCreatePerfume();
  const updatePerfume = useUpdatePerfume();
  const deletePerfume = useDeletePerfume();
  const updateMargin = useUpdatePerfumeMargin();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPerfume, setEditingPerfume] = useState<DatabasePerfume | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newMargin, setNewMargin] = useState<number>(50);
  const [formData, setFormData] = useState({
    brand: '',
    name: '',
    description: '',
    family: '',
    gender: 'masculino' as 'masculino' | 'feminino' | 'unissex',
    top_notes: [] as string[],
    heart_notes: [] as string[],
    base_notes: [] as string[],
    price_2ml: null as number | null,
    price_5ml: null as number | null,
    price_10ml: null as number | null,
    price_full: 0,
    image_url: '',
    category: '',
  });

  const handleSyncToAlgolia = async () => {
    setIsSyncing(true);
    try {
      const success = await syncPerfumesToAlgolia();
      if (success) {
        toast({ title: "Perfumes sincronizados com Algolia com sucesso!" });
      } else {
        toast({ 
          title: "Erro", 
          description: "Falha ao sincronizar com Algolia.",
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Erro ao sincronizar com Algolia.",
        variant: "destructive" 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      name: '',
      description: '',
      family: '',
      gender: 'masculino',
      top_notes: [],
      heart_notes: [],
      base_notes: [],
      price_2ml: null,
      price_5ml: null,
      price_10ml: null,
      price_full: 0,
      image_url: '',
      category: '',
    });
    setNewMargin(50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPerfume) {
        await updatePerfume.mutateAsync({ id: editingPerfume.id, ...formData });
        toast({ title: "Perfume atualizado com sucesso!" });
        setEditingPerfume(null);
      } else {
        await createPerfume.mutateAsync(formData);
        toast({ title: "Perfume criado com sucesso!" });
        setIsCreateOpen(false);
      }
      resetForm();
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Ocorreu um erro ao salvar o perfume.",
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este perfume?')) {
      try {
        await deletePerfume.mutateAsync(id);
        toast({ title: "Perfume excluído com sucesso!" });
      } catch (error) {
        toast({ 
          title: "Erro", 
          description: "Ocorreu um erro ao excluir o perfume.",
          variant: "destructive" 
        });
      }
    }
  };

  const handleEdit = (perfume: DatabasePerfume) => {
    console.log('Editing perfume:', perfume); // Debug log
    setFormData({
      brand: perfume.brand,
      name: perfume.name,
      description: perfume.description || '',
      family: perfume.family,
      gender: perfume.gender,
      top_notes: perfume.top_notes,
      heart_notes: perfume.heart_notes,
      base_notes: perfume.base_notes,
      price_2ml: perfume.price_2ml,
      price_5ml: perfume.price_5ml,
      price_10ml: perfume.price_10ml,
      price_full: perfume.price_full,
      image_url: perfume.image_url || '',
      category: perfume.category || '',
    });
    // Load the actual margin from database or default to 50%
    const marginFromDb = (perfume as any).target_margin_percentage;
    console.log('Margin from DB:', marginFromDb); // Debug log
    console.log('Perfume category:', perfume.category); // Debug log
    console.log('Price 2ml:', perfume.price_2ml); // Debug log
    setNewMargin(marginFromDb ? marginFromDb * 100 : 50);
    setEditingPerfume(perfume);
  };

  const handleMarginUpdate = async () => {
    if (!editingPerfume) return;
    
    try {
      await updateMargin.mutateAsync({
        perfumeId: editingPerfume.id,
        newMarginPercentage: newMargin / 100
      });
      // After successful update, refresh the perfume data to show new prices
      const updatedPerfume = perfumes?.find(p => p.id === editingPerfume.id);
      if (updatedPerfume) {
        handleEdit(updatedPerfume);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar margem de lucro",
        variant: "destructive"
      });
    }
  };

  const formatNotes = (notes: string[]) => notes.join(', ');
  
  const parseNotes = (notesString: string): string[] => {
    return notesString.split(',').map(note => note.trim()).filter(note => note.length > 0);
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciar Perfumes</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleSyncToAlgolia}
            disabled={isSyncing}
            variant="outline"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Algolia'}
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Perfume
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Perfume</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="family">Família Olfativa</Label>
                    <Input
                      id="family"
                      value={formData.family}
                      onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gênero</Label>
                    <Select value={formData.gender} onValueChange={(value: any) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="unissex">Unissex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Notas de Topo (separadas por vírgula)</Label>
                  <Input
                    value={formatNotes(formData.top_notes)}
                    onChange={(e) => setFormData({ ...formData, top_notes: parseNotes(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Notas de Coração (separadas por vírgula)</Label>
                  <Input
                    value={formatNotes(formData.heart_notes)}
                    onChange={(e) => setFormData({ ...formData, heart_notes: parseNotes(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Notas de Base (separadas por vírgula)</Label>
                  <Input
                    value={formatNotes(formData.base_notes)}
                    onChange={(e) => setFormData({ ...formData, base_notes: parseNotes(e.target.value) })}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Preços (Calculados Automaticamente)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Os preços são calculados automaticamente com base nos custos dos materiais e margem de lucro
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {formData.price_2ml && formData.price_2ml > 0 && (
                      <div className="p-3 border rounded-lg bg-muted/50">
                        <Label className="text-xs text-muted-foreground">2ml</Label>
                        <p className="text-lg font-semibold">R$ {formData.price_2ml?.toFixed(2) || '0.00'}</p>
                      </div>
                    )}
                    <div className="p-3 border rounded-lg bg-muted/50">
                      <Label className="text-xs text-muted-foreground">5ml</Label>
                      <p className="text-lg font-semibold">R$ {formData.price_5ml?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-muted/50">
                      <Label className="text-xs text-muted-foreground">10ml</Label>
                      <p className="text-lg font-semibold">R$ {formData.price_10ml?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image_url">URL da Imagem</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Criar Perfume
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Perfumes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Família</TableHead>
                <TableHead>Gênero</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preços</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perfumes?.map((perfume) => (
                <TableRow key={perfume.id}>
                  <TableCell className="font-medium">{perfume.brand}</TableCell>
                  <TableCell>{perfume.name}</TableCell>
                  <TableCell>{perfume.family}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{perfume.gender}</Badge>
                  </TableCell>
                  <TableCell>{perfume.category}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {perfume.price_2ml && perfume.price_2ml > 0 && (
                        <div>2ml: R$ {perfume.price_2ml}</div>
                      )}
                      {perfume.price_5ml && <div>5ml: R$ {perfume.price_5ml}</div>}
                      {perfume.price_10ml && <div>10ml: R$ {perfume.price_10ml}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(perfume)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(perfume.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingPerfume} onOpenChange={() => setEditingPerfume(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfume</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-brand">Marca</Label>
                <Input
                  id="edit-brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-family">Família Olfativa</Label>
                <Input
                  id="edit-family"
                  value={formData.family}
                  onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-gender">Gênero</Label>
                <Select value={formData.gender} onValueChange={(value: any) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="unissex">Unissex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Notas de Topo (separadas por vírgula)</Label>
              <Input
                value={formatNotes(formData.top_notes)}
                onChange={(e) => setFormData({ ...formData, top_notes: parseNotes(e.target.value) })}
              />
            </div>

            <div>
              <Label>Notas de Coração (separadas por vírgula)</Label>
              <Input
                value={formatNotes(formData.heart_notes)}
                onChange={(e) => setFormData({ ...formData, heart_notes: parseNotes(e.target.value) })}
              />
            </div>

            <div>
              <Label>Notas de Base (separadas por vírgula)</Label>
              <Input
                value={formatNotes(formData.base_notes)}
                onChange={(e) => setFormData({ ...formData, base_notes: parseNotes(e.target.value) })}
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label>Preços (Calculados Automaticamente)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Os preços são calculados automaticamente com base nos custos dos materiais e margem de lucro
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {formData.price_2ml && formData.price_2ml > 0 && (
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <Label className="text-xs text-muted-foreground">2ml</Label>
                    <p className="text-lg font-semibold">R$ {formData.price_2ml?.toFixed(2) || '0.00'}</p>
                  </div>
                )}
                <div className="p-3 border rounded-lg bg-muted/50">
                  <Label className="text-xs text-muted-foreground">5ml</Label>
                  <p className="text-lg font-semibold">R$ {formData.price_5ml?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/50">
                  <Label className="text-xs text-muted-foreground">10ml</Label>
                  <p className="text-lg font-semibold">R$ {formData.price_10ml?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>

            {editingPerfume && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label>Margem de Lucro</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Ajuste a margem de lucro para recalcular automaticamente todos os preços
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={newMargin}
                      onChange={(e) => setNewMargin(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <Label className="text-sm font-medium">%</Label>
                  <Button
                    type="button"
                    onClick={handleMarginUpdate}
                    disabled={updateMargin.isPending}
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {updateMargin.isPending ? 'Aplicando...' : 'Aplicar'}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Categoria</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-image_url">URL da Imagem</Label>
                <Input
                  id="edit-image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Atualizar Perfume
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPerfumes;
