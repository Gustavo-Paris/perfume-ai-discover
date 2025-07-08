import { useState } from 'react';
import { Tag, Plus, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface WishlistTagsProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allItems: any[];
}

export function WishlistTags({ selectedTags, onTagsChange, allItems }: WishlistTagsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Gerar tags automáticas baseadas nos perfumes
  const generateAutoTags = () => {
    const tags = new Set<string>();
    
    allItems.forEach(item => {
      const perfume = item.perfume;
      
      // Tags por família
      tags.add(perfume.family);
      
      // Tags por gênero
      tags.add(perfume.gender);
      
      // Tags por faixa de preço
      const minPrice = Math.min(...[perfume.price_5ml, perfume.price_10ml, perfume.price_full].filter(Boolean));
      if (minPrice <= 50) tags.add('Econômico');
      else if (minPrice <= 100) tags.add('Intermediário');
      else tags.add('Premium');
      
      // Tags por marca popular
      const popularBrands = ['Chanel', 'Dior', 'Tom Ford', 'Creed', 'Maison Margiela'];
      if (popularBrands.includes(perfume.brand)) {
        tags.add('Marca de Luxo');
      }
      
      // Tags por notas comuns
      const allNotes = [...(perfume.top_notes || []), ...(perfume.heart_notes || []), ...(perfume.base_notes || [])];
      const commonNotes = ['Rosa', 'Baunilha', 'Cedro', 'Bergamota', 'Jasmim', 'Almíscar', 'Âmbar'];
      
      allNotes.forEach(note => {
        if (commonNotes.includes(note)) {
          tags.add(`Com ${note}`);
        }
      });
      
      // Tags sazonais (baseado em notas)
      const freshNotes = ['Bergamota', 'Limão', 'Laranja', 'Hortelã', 'Eucalipto'];
      const warmNotes = ['Baunilha', 'Âmbar', 'Almíscar', 'Canela', 'Cravo'];
      
      const hasFresh = allNotes.some(note => freshNotes.includes(note));
      const hasWarm = allNotes.some(note => warmNotes.includes(note));
      
      if (hasFresh) tags.add('Verão');
      if (hasWarm) tags.add('Inverno');
    });
    
    return Array.from(tags).sort();
  };

  const autoTags = generateAutoTags();
  const customTags = ['Favorito Absoluto', 'Para Trabalho', 'Para Ocasiões Especiais', 'Vintage', 'Moderno', 'Versátil'];
  const allAvailableTags = [...autoTags, ...customTags];

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (newTag.trim() && !allAvailableTags.includes(newTag.trim())) {
      const trimmedTag = newTag.trim();
      onTagsChange([...selectedTags, trimmedTag]);
      setNewTag('');
    }
  };

  const getFilteredItemsCount = (tag: string) => {
    return allItems.filter(item => {
      const perfume = item.perfume;
      const minPrice = Math.min(...[perfume.price_5ml, perfume.price_10ml, perfume.price_full].filter(Boolean));
      const allNotes = [...(perfume.top_notes || []), ...(perfume.heart_notes || []), ...(perfume.base_notes || [])];
      
      switch (tag) {
        case perfume.family:
        case perfume.gender:
          return true;
        case 'Econômico':
          return minPrice <= 50;
        case 'Intermediário':
          return minPrice > 50 && minPrice <= 100;
        case 'Premium':
          return minPrice > 100;
        case 'Marca de Luxo':
          return ['Chanel', 'Dior', 'Tom Ford', 'Creed', 'Maison Margiela'].includes(perfume.brand);
        case 'Verão':
          return allNotes.some(note => ['Bergamota', 'Limão', 'Laranja', 'Hortelã', 'Eucalipto'].includes(note));
        case 'Inverno':
          return allNotes.some(note => ['Baunilha', 'Âmbar', 'Almíscar', 'Canela', 'Cravo'].includes(note));
        default:
          if (tag.startsWith('Com ')) {
            const note = tag.replace('Com ', '');
            return allNotes.includes(note);
          }
          return false;
      }
    }).length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Filtros por Tags
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Gerenciar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Gerenciar Tags</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Adicionar tag personalizada */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adicionar Tag Personalizada</label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Digite uma nova tag..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                    />
                    <Button onClick={handleAddCustomTag} disabled={!newTag.trim()}>
                      Adicionar
                    </Button>
                  </div>
                </div>
                
                {/* Tags automáticas */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Tags Automáticas</h4>
                  <div className="grid gap-2 max-h-32 overflow-y-auto">
                    {autoTags.map(tag => (
                      <div key={tag} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedTags.includes(tag)}
                            onCheckedChange={() => handleTagToggle(tag)}
                          />
                          <span className="text-sm">{tag}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {getFilteredItemsCount(tag)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Tags personalizadas */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Tags Sugeridas</h4>
                  <div className="grid gap-2">
                    {customTags.map(tag => (
                      <div key={tag} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedTags.includes(tag)}
                            onCheckedChange={() => handleTagToggle(tag)}
                          />
                          <span className="text-sm">{tag}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedTags.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum filtro ativo</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filtros ativos:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTagsChange([])}
                className="h-6 px-2 text-xs"
              >
                Limpar todos
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleTagToggle(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}