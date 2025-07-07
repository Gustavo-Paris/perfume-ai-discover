import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Filter, SortAsc, Plus, Eye } from 'lucide-react';
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { LazyImage } from '@/components/ui/lazy-image';

export default function Wishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { data: wishlistItems = [], isLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'brand' | 'price'>('recent');
  const [filterBy, setFilterBy] = useState<'all' | 'masculino' | 'feminino' | 'unissex'>('all');

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Helper function to get the minimum price
  const getMinPrice = (perfume: any) => {
    const prices = [perfume.price_5ml, perfume.price_10ml].filter(Boolean);
    return prices.length > 0 ? Math.min(...prices) : perfume.price_full;
  };

  // Sort items
  const sortedItems = [...wishlistItems].sort((a, b) => {
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

  // Filter items - corrigido para os valores corretos do banco
  const filteredItems = sortedItems.filter(item => {
    if (filterBy === 'all') return true;
    return item.perfume.gender === filterBy;
  });

  const handleRemove = (perfumeId: string, perfumeName: string) => {
    removeFromWishlist.mutate(perfumeId);
  };

  const handleQuickAdd = (perfumeId: string, size: 5 | 10, perfumeName: string) => {
    addToCart({
      perfume_id: perfumeId,
      size_ml: size,
      quantity: 1
    });
    
    toast({
      title: "Adicionado ao carrinho!",
      description: `${perfumeName} ${size}ml foi adicionado ao seu carrinho.`,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/5] w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-red-500 fill-current" />
          <div>
            <h1 className="text-3xl font-bold">Meus Favoritos</h1>
            <p className="text-muted-foreground">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'perfume salvo' : 'perfumes salvos'}
            </p>
          </div>
        </div>

        {wishlistItems.length > 0 && (
          <div className="flex items-center gap-4">
            {/* Filter */}
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

            {/* Sort */}
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
        )}
      </div>

      {/* Empty State */}
      {wishlistItems.length === 0 && (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Sua lista de favoritos está vazia</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Explore nosso catálogo e adicione perfumes aos seus favoritos clicando no ❤️
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  {/* Brand */}
                  <Badge variant="secondary" className="text-xs">
                    {item.perfume.brand}
                  </Badge>

                  {/* Name */}
                  <Link to={`/perfume/${item.perfume.id}`}>
                    <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors">
                      {item.perfume.name}
                    </h3>
                  </Link>

                  {/* Details */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{item.perfume.family}</span>
                    <span>•</span>
                    <span className="capitalize">{item.perfume.gender}</span>
                  </div>

                  {/* Price - mostrar menor preço disponível */}
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

                  {/* Actions - botões funcionais para adicionar ao carrinho */}
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
      {filteredItems.length === 0 && wishlistItems.length > 0 && (
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
  );
}