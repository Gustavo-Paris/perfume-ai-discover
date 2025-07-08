import { useState } from 'react';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useWishlistCollections, useCreateCollection, useUpdateCollection, useDeleteCollection } from '@/hooks/useWishlistCollections';
import type { WishlistCollection, CreateCollectionData } from '@/hooks/useWishlistCollections';

interface CollectionManagerProps {
  onSelectCollection?: (collectionId: string | null) => void;
  selectedCollectionId?: string | null;
}

export function CollectionManager({ onSelectCollection, selectedCollectionId }: CollectionManagerProps) {
  const { data: collections = [], isLoading } = useWishlistCollections();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<WishlistCollection | null>(null);
  const [formData, setFormData] = useState<CreateCollectionData>({
    name: '',
    description: '',
    color: '#ef4444'
  });

  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCollection) {
      await updateCollection.mutateAsync({
        id: editingCollection.id,
        ...formData
      });
      setEditingCollection(null);
    } else {
      await createCollection.mutateAsync(formData);
      setIsCreateDialogOpen(false);
    }
    
    setFormData({ name: '', description: '', color: '#ef4444' });
  };

  const handleEdit = (collection: WishlistCollection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      color: collection.color
    });
  };

  const handleDelete = async (collection: WishlistCollection) => {
    if (collection.is_default) {
      return; // Não permitir deletar lista padrão
    }

    if (confirm(`Tem certeza que deseja excluir a lista "${collection.name}"? Os itens serão movidos para a lista padrão.`)) {
      await deleteCollection.mutateAsync(collection.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Minhas Listas</h3>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Lista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Lista</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Lista</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Perfumes para o Verão"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva esta lista..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Cor da Lista</Label>
                <div className="flex gap-2 mt-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-foreground' : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createCollection.isPending}>
                  Criar Lista
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {/* Botão para ver todos */}
        <Card 
          className={`cursor-pointer transition-colors ${
            selectedCollectionId === null ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
          }`}
          onClick={() => onSelectCollection?.(null)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Todos os Favoritos</h4>
                  <p className="text-sm text-muted-foreground">
                    Ver todos os perfumes favoritados
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {collections.reduce((total, c) => total + (c.items_count || 0), 0)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Listas do usuário */}
        {collections.map((collection) => (
          <Card
            key={collection.id}
            className={`cursor-pointer transition-colors ${
              selectedCollectionId === collection.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
            }`}
            onClick={() => onSelectCollection?.(collection.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: collection.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{collection.name}</h4>
                      {collection.is_default && (
                        <Badge variant="outline" className="text-xs">
                          Padrão
                        </Badge>
                      )}
                    </div>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground">
                        {collection.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {collection.items_count || 0}
                  </Badge>
                  
                  {!collection.is_default && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(collection);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(collection);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de edição */}
      <Dialog open={!!editingCollection} onOpenChange={() => setEditingCollection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Lista</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome da Lista</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Descrição (opcional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div>
              <Label>Cor da Lista</Label>
              <div className="flex gap-2 mt-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-foreground' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={updateCollection.isPending}>
                Salvar Alterações
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingCollection(null)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}