import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Plus, Save, Trash2, Share, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LazyImage } from '@/components/ui/lazy-image';
import { useCreateComparison, useUpdateComparison, useDeleteComparison, useRemoveFromComparison } from '@/hooks/usePerfumeComparisons';
import type { PerfumeComparison } from '@/hooks/usePerfumeComparisons';

interface PerfumeComparisonProps {
  comparison: PerfumeComparison;
  onClose?: () => void;
  showActions?: boolean;
}

export function PerfumeComparisonComponent({ comparison, onClose, showActions = true }: PerfumeComparisonProps) {
  const updateComparison = useUpdateComparison();
  const deleteComparison = useDeleteComparison();
  const removeFromComparison = useRemoveFromComparison();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: comparison.name,
    notes: comparison.notes || ''
  });

  const handleSave = async () => {
    await updateComparison.mutateAsync({
      id: comparison.id,
      ...editData
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir esta comparação?')) {
      await deleteComparison.mutateAsync(comparison.id);
      onClose?.();
    }
  };

  const handleRemovePerfume = async (perfumeId: string) => {
    await removeFromComparison.mutateAsync({
      comparisonId: comparison.id,
      perfumeId
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/comparacao/${comparison.id}`;
    navigator.clipboard.writeText(url);
    // Toast já é mostrado pelo hook
  };

  const perfumes = comparison.perfumes || [];
  const allNotes = new Set<string>();
  
  // Coletar todas as notas únicas
  perfumes.forEach(perfume => {
    [...(perfume.top_notes || []), ...(perfume.heart_notes || []), ...(perfume.base_notes || [])].forEach(note => {
      allNotes.add(note);
    });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="text-xl font-bold"
              />
              <Textarea
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                placeholder="Adicione suas observações sobre esta comparação..."
                rows={2}
              />
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold">{comparison.name}</h1>
              {comparison.notes && (
                <p className="text-muted-foreground mt-2">{comparison.notes}</p>
              )}
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={updateComparison.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <Share className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Perfumes Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {perfumes.map((perfume) => (
          <Card key={perfume.id} className="overflow-hidden">
            <div className="relative aspect-[4/5]">
              <LazyImage
                src={perfume.image_url || '/placeholder.svg'}
                alt={`${perfume.brand} ${perfume.name}`}
                className="w-full h-full object-cover"
              />
              
              {showActions && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePerfume(perfume.id)}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              <Badge variant="secondary" className="text-xs">
                {perfume.brand}
              </Badge>

              <Link to={`/perfume/${perfume.id}`}>
                <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors">
                  {perfume.name}
                </h3>
              </Link>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{perfume.family}</span>
                  <span>•</span>
                  <span className="capitalize">{perfume.gender}</span>
                </div>

                <div className="text-lg font-bold text-primary">
                  A partir de R$ {(perfume.price_5ml || perfume.price_10ml || perfume.price_full)?.toFixed(2)}
                </div>
              </div>

              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to={`/perfume/${perfume.id}`}>
                  <Eye className="h-3 w-3 mr-2" />
                  Ver Detalhes
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Add Perfume Placeholder */}
        {showActions && perfumes.length < 4 && (
          <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center justify-center h-full min-h-[300px]">
              <div className="text-center text-muted-foreground">
                <Plus className="h-12 w-12 mx-auto mb-4" />
                <p className="text-sm">Adicionar Perfume</p>
                <p className="text-xs">Máximo 4 perfumes</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comparison Table */}
      {perfumes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparação Detalhada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Característica</th>
                    {perfumes.map((perfume) => (
                      <th key={perfume.id} className="text-left p-2 font-medium min-w-[200px]">
                        {perfume.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Marca</td>
                    {perfumes.map((perfume) => (
                      <td key={perfume.id} className="p-2">{perfume.brand}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Família</td>
                    {perfumes.map((perfume) => (
                      <td key={perfume.id} className="p-2">{perfume.family}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Gênero</td>
                    {perfumes.map((perfume) => (
                      <td key={perfume.id} className="p-2 capitalize">{perfume.gender}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Preço (5ml)</td>
                    {perfumes.map((perfume) => (
                      <td key={perfume.id} className="p-2">
                        {perfume.price_5ml ? `R$ ${perfume.price_5ml.toFixed(2)}` : 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Preço (10ml)</td>
                    {perfumes.map((perfume) => (
                      <td key={perfume.id} className="p-2">
                        {perfume.price_10ml ? `R$ ${perfume.price_10ml.toFixed(2)}` : 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Notas de Saída</td>
                    {perfumes.map((perfume) => (
                      <td key={perfume.id} className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {(perfume.top_notes || []).map((note: string) => (
                            <Badge key={note} variant="outline" className="text-xs">
                              {note}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Notas de Coração</td>
                    {perfumes.map((perfume) => (
                      <td key={perfume.id} className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {(perfume.heart_notes || []).map((note: string) => (
                            <Badge key={note} variant="outline" className="text-xs">
                              {note}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Notas de Fundo</td>
                    {perfumes.map((perfume) => (
                      <td key={perfume.id} className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {(perfume.base_notes || []).map((note: string) => (
                            <Badge key={note} variant="outline" className="text-xs">
                              {note}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}