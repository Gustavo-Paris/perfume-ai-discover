
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { usePerfumes } from '@/hooks/usePerfumes';
import { usePerfumePricesObject } from '@/hooks/usePerfumePrices';
import { useRecalculatePerfumePrice } from '@/hooks/useRecalculatePerfumePrice';
import { DatabasePerfume } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCanReview, useUserReview } from '@/hooks/useReviews';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';
import SEO from '@/components/SEO';
import ProductSchema from '@/components/ProductSchema';

const PerfumeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCart();
  const { data: databasePerfumes, isLoading } = usePerfumes();
  const { user } = useAuth();
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  
  // Review hooks
  const { data: canReview } = useCanReview(id || '');
  const { data: userReview } = useUserReview(id || '');

  // Find perfume by id from database
  const databasePerfume = databasePerfumes?.find((p: DatabasePerfume) => p.id === id);
  
  // Get dynamic prices for this perfume
  const { prices, availableSizes, isLoading: pricesLoading } = usePerfumePricesObject(id || '');
  const recalculatePerfume = useRecalculatePerfumePrice();
  
  // Set initial size based on available sizes using useEffect
  useEffect(() => {
    if (availableSizes.length > 0 && selectedSize === null) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  if (isLoading || pricesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Carregando perfume...</div>
        </div>
      </div>
    );
  }

  if (!databasePerfume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Perfume não encontrado</h1>
          <Button onClick={() => navigate('/catalogo')}>
            Voltar ao Catálogo
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!selectedSize || !databasePerfume.id) return;
    
    try {
      await addToCart({
        perfume_id: databasePerfume.id,
        size_ml: selectedSize,
        quantity
      });

      toast.success(`Adicionado ao carrinho! ${databasePerfume.name} ${selectedSize}ml (${quantity}x) foi adicionado ao seu carrinho.`);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const currentPrice = selectedSize ? prices[selectedSize] || 0 : 0;

  const handleDebugRecalculate = async () => {
    if (!databasePerfume?.id) return;
    
    // Try to recalculate missing sizes (like 20ml)
    const allConfiguredSizes = [2, 5, 10, 20]; // From material_configurations
    const missingSizes = allConfiguredSizes.filter(size => !availableSizes.includes(size));
    
    if (missingSizes.length === 0) {
      toast('Todos os tamanhos já têm preços calculados');
      return;
    }
    
    toast(`🔄 Recalculando ${missingSizes.length} tamanho(s) faltante(s): ${missingSizes.join(', ')}ml`);
    await recalculatePerfume.mutateAsync({ 
      perfumeId: databasePerfume.id, 
      sizes: missingSizes 
    });
  };

  return (
    <>
      <SEO 
        title={`${databasePerfume.name} - ${databasePerfume.brand} | Perfumaria Online`}
        description={databasePerfume.description || `${databasePerfume.name} de ${databasePerfume.brand}. ${databasePerfume.family}. Compre online com entrega rápida.`}
        image={databasePerfume.image_url || '/placeholder.svg'}
        url={`https://sua-perfumaria.com/perfume/${databasePerfume.id}`}
        type="product"
      />
      {selectedSize && (
        <ProductSchema 
          perfume={databasePerfume}
          currentPrice={currentPrice}
          selectedSize={selectedSize as 2 | 5 | 10}
        />
      )}
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <div className="space-y-4">
            <div className="aspect-[4/5] overflow-hidden rounded-lg bg-white">
              <img
                src={databasePerfume.image_url || '/placeholder.svg'}
                alt={databasePerfume.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <Badge 
                variant="secondary" 
                className={`mb-2 ${
                  databasePerfume.gender === 'masculino' ? 'bg-blue-100 text-blue-800' : 
                  databasePerfume.gender === 'feminino' ? 'bg-pink-100 text-pink-800' : 
                  'bg-purple-100 text-purple-800'
                }`}
              >
                {databasePerfume.gender}
              </Badge>
              <p className="text-sm text-muted-foreground mb-1">{databasePerfume.brand}</p>
              <h1 className="font-playfair text-3xl font-bold mb-2">{databasePerfume.name}</h1>
              <p className="text-muted-foreground">{databasePerfume.family}</p>
            </div>

            {/* Description */}
            {databasePerfume.description && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-muted-foreground">{databasePerfume.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Notes - Melhorado */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                  Pirâmide Olfativa
                </h3>
                <div className="space-y-4">
                  {databasePerfume.top_notes && databasePerfume.top_notes.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400" />
                        <h4 className="font-medium text-orange-800">Notas de Saída</h4>
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                          Primeira impressão
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {databasePerfume.top_notes.map((note, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-white rounded-full text-sm text-orange-700 border border-orange-200"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {databasePerfume.heart_notes && databasePerfume.heart_notes.length > 0 && (
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-lg border border-pink-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-400 to-rose-400" />
                        <h4 className="font-medium text-rose-800">Notas de Coração</h4>
                        <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700">
                          Corpo da fragrância
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {databasePerfume.heart_notes.map((note, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-white rounded-full text-sm text-rose-700 border border-pink-200"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {databasePerfume.base_notes && databasePerfume.base_notes.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500" />
                        <h4 className="font-medium text-amber-800">Notas de Fundo</h4>
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                          Fixação e duração
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {databasePerfume.base_notes.map((note, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-white rounded-full text-sm text-amber-700 border border-amber-200"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Size Selection - Só tamanhos calculados */}
            <div>
              <h3 className="font-semibold mb-3">Tamanho</h3>
              <div className="flex gap-3 flex-wrap">
                {availableSizes
                  .filter(size => prices[size] && prices[size] > 0)
                  .map(size => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}ml - R$ {Number(prices[size] || 0).toFixed(2).replace('.', ',')}
                    </Button>
                  ))}
                {availableSizes.filter(size => prices[size] && prices[size] > 0).length === 0 && (
                  <div className="text-muted-foreground text-sm py-2">
                    Nenhum tamanho disponível para este perfume
                  </div>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="font-semibold mb-3">Quantidade</h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Price and Actions */}
            <div className="space-y-4">
              <div className="text-2xl font-bold">
                R$ {(Number(currentPrice) * quantity).toFixed(2).replace('.', ',')}
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleAddToCart}
                  className="flex-1 gradient-gold text-white hover:opacity-90"
                  disabled={!selectedSize || cartLoading}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {cartLoading ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
              
              {/* Recalcular preços faltantes */}
              {user && (
                <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded space-y-1">
                  <div>Tamanhos calculados: {availableSizes.filter(size => prices[size] && prices[size] > 0).join(', ')}ml</div>
                  <div>Total de preços: {Object.keys(prices).filter(size => prices[parseInt(size)] > 0).length}</div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDebugRecalculate}
                    disabled={recalculatePerfume.isPending}
                    className="mt-2"
                  >
                    🔄 {recalculatePerfume.isPending ? 'Recalculando...' : 'Recalcular preços faltantes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 space-y-8">
          {/* Review Form - Only show if user is logged in and can review */}
          {user && canReview && !userReview && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Avaliar Produto</h2>
              <ReviewForm perfumeId={databasePerfume.id} />
            </div>
          )}

          {/* Edit Review Form - Show if user has a pending review */}
          {user && userReview && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Sua Avaliação</h2>
              <ReviewForm perfumeId={databasePerfume.id} existingReview={userReview} />
            </div>
          )}

          {/* Review List */}
          <div>
            <ReviewList perfumeId={databasePerfume.id} />
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default PerfumeDetails;
