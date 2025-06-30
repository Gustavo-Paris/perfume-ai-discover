
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { toast } from '@/hooks/use-toast';
import { usePerfumes } from '@/hooks/usePerfumes';
import { DatabasePerfume } from '@/types';

const PerfumeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { data: databasePerfumes, isLoading } = usePerfumes();
  const [selectedSize, setSelectedSize] = useState<5 | 10 | null>(5);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);

  // Find perfume by id from database
  const databasePerfume = databasePerfumes?.find((p: DatabasePerfume) => p.id === id);

  if (isLoading) {
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

  // Convert DatabasePerfume to Perfume format for compatibility with cart
  const perfume = {
    id: databasePerfume.id,
    name: databasePerfume.name,
    brand: databasePerfume.brand,
    family: databasePerfume.family,
    gender: databasePerfume.gender,
    size_ml: [50, 100],
    price_full: Number(databasePerfume.price_full),
    price_5ml: databasePerfume.price_5ml ? Number(databasePerfume.price_5ml) : 0,
    price_10ml: databasePerfume.price_10ml ? Number(databasePerfume.price_10ml) : 0,
    stock_full: 10,
    stock_5ml: 50,
    stock_10ml: 30,
    description: databasePerfume.description || '',
    image_url: databasePerfume.image_url || '',
    top_notes: databasePerfume.top_notes,
    heart_notes: databasePerfume.heart_notes,
    base_notes: databasePerfume.base_notes,
    created_at: databasePerfume.created_at
  };

  const handleAddToCart = () => {
    if (!selectedSize) return;
    
    addItem({
      perfume,
      size: selectedSize,
      quantity
    });

    toast({
      title: "Adicionado ao carrinho!",
      description: `${perfume.name} ${selectedSize}ml (${quantity}x) foi adicionado ao seu carrinho.`,
    });
  };

  const currentPrice = selectedSize === 5 ? perfume.price_5ml : 
                      selectedSize === 10 ? perfume.price_10ml : 
                      perfume.price_5ml;

  return (
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
                src={perfume.image_url || '/placeholder.svg'}
                alt={perfume.name}
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
                  perfume.gender === 'masculino' ? 'bg-blue-100 text-blue-800' : 
                  perfume.gender === 'feminino' ? 'bg-pink-100 text-pink-800' : 
                  'bg-purple-100 text-purple-800'
                }`}
              >
                {perfume.gender}
              </Badge>
              <p className="text-sm text-muted-foreground mb-1">{perfume.brand}</p>
              <h1 className="font-playfair text-3xl font-bold mb-2">{perfume.name}</h1>
              <p className="text-muted-foreground">{perfume.family}</p>
            </div>

            {/* Description */}
            {perfume.description && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-muted-foreground">{perfume.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Notas Olfativas</h3>
                <div className="space-y-3">
                  {perfume.top_notes && perfume.top_notes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Notas de Saída</h4>
                      <p className="text-sm">{perfume.top_notes.join(', ')}</p>
                    </div>
                  )}
                  {perfume.heart_notes && perfume.heart_notes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Notas de Coração</h4>
                      <p className="text-sm">{perfume.heart_notes.join(', ')}</p>
                    </div>
                  )}
                  {perfume.base_notes && perfume.base_notes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Notas de Fundo</h4>
                      <p className="text-sm">{perfume.base_notes.join(', ')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Size Selection */}
            <div>
              <h3 className="font-semibold mb-3">Tamanho</h3>
              <div className="flex gap-3">
                {perfume.price_5ml && perfume.price_5ml > 0 && (
                  <Button
                    variant={selectedSize === 5 ? "default" : "outline"}
                    onClick={() => setSelectedSize(5)}
                  >
                    5ml - R$ {perfume.price_5ml.toFixed(2).replace('.', ',')}
                  </Button>
                )}
                {perfume.price_10ml && perfume.price_10ml > 0 && (
                  <Button
                    variant={selectedSize === 10 ? "default" : "outline"}
                    onClick={() => setSelectedSize(10)}
                  >
                    10ml - R$ {perfume.price_10ml.toFixed(2).replace('.', ',')}
                  </Button>
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
                R$ {(currentPrice * quantity).toFixed(2).replace('.', ',')}
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleAddToCart}
                  className="flex-1 gradient-gold text-white hover:opacity-90"
                  disabled={!selectedSize}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Adicionar ao Carrinho
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfumeDetails;
