import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Filter, SortAsc, Plus, Eye, GitCompare, FolderOpen, Move, Share } from 'lucide-react';
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useWishlistCollections, useCollectionItems, useMoveToCollection } from '@/hooks/useWishlistCollections';
import { useCreateComparison } from '@/hooks/usePerfumeComparisons';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { LazyImage } from '@/components/ui/lazy-image';
import { CollectionManager } from '@/components/wishlist/CollectionManager';

export default function Wishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { data: wishlistItems = [], isLoading: wishlistLoading } = useWishlist();
  const { data: collections = [] } = useWishlistCollections();
  const removeFromWishlist = useRemoveFromWishlist();
  const moveToCollection = useMoveToCollection();
  const createComparison = useCreateComparison();
  
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'brand' | 'price'>('recent');
  const [filterBy, setFilterBy] = useState<'all' | 'masculino' | 'feminino' | 'unissex'>('all');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  // Dados baseados na coleção selecionada
  const { data: collectionItems = [], isLoading: collectionLoading } = useCollectionItems(selectedCollectionId || undefined);
  
  // Buscar coleção padrão sempre
  const defaultCollection = collections.find(c => c.is_default);
  const { data: defaultCollectionItems = [] } = useCollectionItems(defaultCollection?.id);
  
  // Determinar quais itens mostrar
  const currentItems = selectedCollectionId 
    ? collectionItems 
    : defaultCollectionItems.length > 0 
      ? defaultCollectionItems
      : wishlistItems; // usar todos os itens como fallback
  
  const isLoading = selectedCollectionId ? collectionLoading : wishlistLoading;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // Helper function to get the minimum price
  const getMinPrice = (perfume: any) => {
    const prices = [perfume.price_5ml, perfume.price_10ml].filter(Boolean);
    return prices.length > 0 ? Math.min(...prices) : perfume.price_full;
  };

  // Sort items
  const sortedItems = [...currentItems].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.perfume.name.localeCompare(b.perfume.name);
      case 'brand':
        return a.perfume.brand.localeCompare(b.perfume.brand);
      case 'price':
        return getMinPrice(a.perfume) - getMinPrice(b.perfume);
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Filter items
  const filteredItems = sortedItems.filter(item => {
    if (filterBy === 'all') return true;
    return item.perfume.gender === filterBy;
  });

  const handleRemove = (perfumeId: string, perfumeName: string) => {
    removeFromWishlist.mutate(perfumeId);
    setSelectedItems(prev => prev.filter(id => id !== perfumeId));
  };

  const handleQuickAdd = async (perfumeId: string, size: 5 | 10, perfumeName: string) => {
    try {
      await addToCart({
        perfume_id: perfumeId,
        size_ml: size,
        quantity: 1
      });
    } catch (error) {
      console.error('Error adding to cart from wishlist:', error);
    }
  };

  const handleSelectItem = (perfumeId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, perfumeId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== perfumeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map(item => item.perfume.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleMoveSelected = async (targetCollectionId: string) => {
    for (const perfumeId of selectedItems) {
      await moveToCollection.mutateAsync({ perfumeId, collectionId: targetCollectionId });
    }
    setSelectedItems([]);
    setMoveDialogOpen(false);
  };

  const handleCreateComparison = async () => {
    if (selectedItems.length < 2) {
      toast({
        title: "Seleção insuficiente",
        description: "Selecione pelo menos 2 perfumes para comparar",
        variant: "destructive",
      });
      return;
    }

    if (selectedItems.length > 4) {
      toast({
        title: "Muitos itens selecionados",
        description: "Selecione no máximo 4 perfumes para comparar",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createComparison.mutateAsync({
        name: 'Comparação dos Favoritos',
        perfume_ids: selectedItems,
      });
      
      navigate(`/comparacao/${result.id}`);
    } catch (error) {
      console.error('Error creating comparison:', error);
    }
  };

  const currentCollection = selectedCollectionId 
    ? collections.find(c => c.id === selectedCollectionId)
    : null;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[4/5] w-full" />
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Listas */}
        <div className="lg:col-span-1">
          <CollectionManager 
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={setSelectedCollectionId}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-500 fill-current" />
              <div>
                <h1 className="text-3xl font-bold">
                  {currentCollection ? currentCollection.name : 'Meus Favoritos'}
                </h1>
                <p className="text-muted-foreground">
                  {currentItems.length} {currentItems.length === 1 ? 'perfume' : 'perfumes'}
                  {currentCollection?.description && ` • ${currentCollection.description}`}
                </p>
              </div>
            </div>

            {currentItems.length > 0 && (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                {/* Actions for selected items */}
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2 mb-2 lg:mb-0">
                    <Badge variant="secondary">
                      {selectedItems.length} selecionados
                    </Badge>
                    
                    <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Move className="h-4 w-4 mr-2" />
                          Mover
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Mover para Lista</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          {collections.map((collection) => (
                            <Button
                              key={collection.id}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => handleMoveSelected(collection.id)}
                            >
                              <div
                                className="w-3 h-3 rounded-full mr-3"
                                style={{ backgroundColor: collection.color }}
                              />
                              {collection.name}
                            </Button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCreateComparison}
                      disabled={selectedItems.length < 2 || selectedItems.length > 4}
                    >
                      <GitCompare className="h-4 w-4 mr-2" />
                      Comparar
                    </Button>
                  </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 flex-wrap lg:ml-auto">
                  <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="masculino">Masculinos</SelectItem>
                      <SelectItem value="feminino">Femininos</SelectItem>
                      <SelectItem value="unissex">Unissex</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-40">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Mais recentes</SelectItem>
                      <SelectItem value="name">Nome A-Z</SelectItem>
                      <SelectItem value="brand">Marca A-Z</SelectItem>
                      <SelectItem value="price">Menor preço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Bulk actions */}
          {filteredItems.length > 0 && (
            <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Selecionar todos ({filteredItems.length})
              </span>
            </div>
          )}

          {/* Empty State */}
          {currentItems.length === 0 && (
            <div className="text-center py-16">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">
                {currentCollection ? 'Esta lista está vazia' : 'Sua lista de favoritos está vazia'}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {currentCollection 
                  ? 'Adicione perfumes a esta lista para organizar seus favoritos'
                  : 'Explore nosso catálogo e adicione perfumes aos seus favoritos clicando no ❤️'
                }
              </p>
              <Button asChild>
                <Link to="/catalogo">
                  Explorar Perfumes
                </Link>
              </Button>
            </div>
          )}

          {/* Wishlist Items */}
          {filteredItems.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Link to={`/perfume/${item.perfume.id}`}>
                      <LazyImage
                        src={item.perfume.image_url || '/placeholder.svg'}
                        alt={`${item.perfume.brand} ${item.perfume.name}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                    
                    {/* Selection checkbox */}
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedItems.includes(item.perfume.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.perfume.id, checked as boolean)}
                        className="bg-background/80 backdrop-blur-sm"
                      />
                    </div>
                    
                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(item.perfume.id, item.perfume.name)}
                      disabled={removeFromWishlist.isPending}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Badge variant="secondary" className="text-xs">
                        {item.perfume.brand}
                      </Badge>

                      <Link to={`/perfume/${item.perfume.id}`}>
                        <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors">
                          {item.perfume.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{item.perfume.family}</span>
                        <span>•</span>
                        <span className="capitalize">{item.perfume.gender}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-lg font-bold text-primary">
                          A partir de R$ {getMinPrice(item.perfume).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.perfume.price_5ml && `5ml: R$ ${item.perfume.price_5ml.toFixed(2)}`}
                          {item.perfume.price_5ml && item.perfume.price_10ml && ' • '}
                          {item.perfume.price_10ml && `10ml: R$ ${item.perfume.price_10ml.toFixed(2)}`}
                        </div>
                      </div>

                      <TooltipProvider>
                        <div className="flex gap-2">
                          {item.perfume.price_5ml && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  onClick={() => handleQuickAdd(item.perfume.id, 5, item.perfume.name)}
                                  className="flex-1"
                                  size="sm"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  5ml
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>R$ {item.perfume.price_5ml.toFixed(2)}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {item.perfume.price_10ml && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  onClick={() => handleQuickAdd(item.perfume.id, 10, item.perfume.name)}
                                  className="flex-1"
                                  size="sm"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  10ml
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>R$ {item.perfume.price_10ml.toFixed(2)}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/perfume/${item.perfume.id}`}>
                              <Eye className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </TooltipProvider>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Filtered empty state */}
          {filteredItems.length === 0 && currentItems.length > 0 && (
            <div className="text-center py-16">
              <Filter className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Nenhum resultado encontrado</h2>
              <p className="text-muted-foreground mb-6">
                Tente ajustar os filtros para ver mais perfumes
              </p>
              <Button variant="outline" onClick={() => setFilterBy('all')}>
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}