import { useState } from 'react';
import { Sparkles, GitCompare, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useWishlist } from '@/hooks/useWishlist';
import { useCreateComparison } from '@/hooks/usePerfumeComparisons';
import { LazyImage } from '@/components/ui/lazy-image';
import { useNavigate } from 'react-router-dom';

interface SmartComparisonProps {
  selectedItems?: string[];
  onSelectionChange?: (items: string[]) => void;
}

export function SmartComparison({ selectedItems = [], onSelectionChange }: SmartComparisonProps) {
  const { data: wishlistItems = [] } = useWishlist();
  const createComparison = useCreateComparison();
  const navigate = useNavigate();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localSelection, setLocalSelection] = useState<string[]>(selectedItems);

  // Algoritmo para sugerir comparações inteligentes
  const getSmartSuggestions = () => {
    if (wishlistItems.length < 2) return [];
    
    const suggestions = [];
    
    // Sugestão 1: Mesma família olfativa
    const familyGroups = new Map<string, any[]>();
    wishlistItems.forEach(item => {
      const family = item.perfume.family;
      if (!familyGroups.has(family)) familyGroups.set(family, []);
      familyGroups.get(family)!.push(item);
    });
    
    familyGroups.forEach((items, family) => {
      if (items.length >= 2) {
        suggestions.push({
          title: `${family} Similares`,
          description: `Compare perfumes da família ${family}`,
          items: items.slice(0, 4),
          type: 'family'
        });
      }
    });
    
    // Sugestão 2: Diferentes faixas de preço
    const sortedByPrice = [...wishlistItems].sort((a, b) => {
      const priceA = Math.min(...[a.perfume.price_5ml, a.perfume.price_10ml, a.perfume.price_full].filter(Boolean));
      const priceB = Math.min(...[b.perfume.price_5ml, b.perfume.price_10ml, b.perfume.price_full].filter(Boolean));
      return priceA - priceB;
    });
    
    if (sortedByPrice.length >= 2) {
      suggestions.push({
        title: 'Custo vs Benefício',
        description: 'Compare opções em diferentes faixas de preço',
        items: [sortedByPrice[0], sortedByPrice[Math.floor(sortedByPrice.length / 2)], sortedByPrice[sortedByPrice.length - 1]].filter((item, index, arr) => arr.indexOf(item) === index).slice(0, 3),
        type: 'price'
      });
    }
    
    // Sugestão 3: Notas em comum
    const findSimilarNotes = () => {
      const itemsWithNotes = wishlistItems.map(item => ({
        ...item,
        allNotes: [...(item.perfume.top_notes || []), ...(item.perfume.heart_notes || []), ...(item.perfume.base_notes || [])]
      }));
      
      const bestMatch = [];
      for (let i = 0; i < itemsWithNotes.length - 1; i++) {
        for (let j = i + 1; j < itemsWithNotes.length; j++) {
          const commonNotes = itemsWithNotes[i].allNotes.filter(note => 
            itemsWithNotes[j].allNotes.includes(note)
          );
          
          if (commonNotes.length >= 2) {
            bestMatch.push(itemsWithNotes[i], itemsWithNotes[j]);
            break;
          }
        }
        if (bestMatch.length >= 2) break;
      }
      
      return bestMatch.length >= 2 ? bestMatch.slice(0, 4) : [];
    };
    
    const similarNotes = findSimilarNotes();
    if (similarNotes.length >= 2) {
      suggestions.push({
        title: 'Notas Similares',
        description: 'Perfumes com notas olfativas em comum',
        items: similarNotes,
        type: 'notes'
      });
    }
    
    return suggestions.slice(0, 3);
  };

  const handleSuggestionSelect = (suggestion: any) => {
    const ids = suggestion.items.map((item: any) => item.perfume.id);
    setLocalSelection(ids);
    onSelectionChange?.(ids);
  };

  const handleCreateComparison = async (items: string[], name: string) => {
    try {
      const result = await createComparison.mutateAsync({
        name,
        perfume_ids: items,
      });
      navigate(`/comparacao/${result.id}`);
      setDialogOpen(false);
    } catch (error) {
      console.error('Error creating comparison:', error);
    }
  };

  const handleQuickCompare = (suggestion: any) => {
    const ids = suggestion.items.map((item: any) => item.perfume.id);
    handleCreateComparison(ids, suggestion.title);
  };

  const suggestions = getSmartSuggestions();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Comparações Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Adicione mais perfumes aos favoritos para ver sugestões de comparação!</p>
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{suggestion.title}</h4>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      Selecionar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleQuickCompare(suggestion)}
                      disabled={createComparison.isPending}
                    >
                      <GitCompare className="h-3 w-3 mr-1" />
                      Comparar
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {suggestion.items.map((item: any) => (
                    <div key={item.id} className="flex-shrink-0 w-16">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <LazyImage
                          src={item.perfume.image_url || '/placeholder.svg'}
                          alt={item.perfume.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-center mt-1 text-muted-foreground truncate">
                        {item.perfume.brand}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          
          {wishlistItems.length > 0 && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Comparação Personalizada
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para comparação personalizada */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl" aria-describedby="comparison-description">
          <DialogHeader>
            <DialogTitle>Criar Comparação Personalizada</DialogTitle>
          </DialogHeader>
          
          <div id="comparison-description" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Selecione 2-4 perfumes para comparar
              </p>
              <Badge variant="secondary">
                {localSelection.length}/4 selecionados
              </Badge>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
              {wishlistItems.map((item) => (
                <Card 
                  key={item.id} 
                  className={`cursor-pointer transition-all ${
                    localSelection.includes(item.perfume.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    const isSelected = localSelection.includes(item.perfume.id);
                    if (isSelected) {
                      setLocalSelection(prev => prev.filter(id => id !== item.perfume.id));
                    } else if (localSelection.length < 4) {
                      setLocalSelection(prev => [...prev, item.perfume.id]);
                    }
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={localSelection.includes(item.perfume.id)}
                        disabled
                      />
                      <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                        <LazyImage
                          src={item.perfume.image_url || '/placeholder.svg'}
                          alt={item.perfume.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{item.perfume.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.perfume.brand}</p>
                        <p className="text-xs text-muted-foreground">{item.perfume.family}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => handleCreateComparison(localSelection, 'Comparação Personalizada')}
                disabled={localSelection.length < 2 || createComparison.isPending}
                className="flex-1"
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Criar Comparação
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}