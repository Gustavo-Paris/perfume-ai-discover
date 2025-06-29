
import { useState } from 'react';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Perfume } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface PerfumeCardProps {
  perfume: Perfume;
}

const PerfumeCard = ({ perfume }: PerfumeCardProps) => {
  const [selectedSize, setSelectedSize] = useState(5);
  const [isLiked, setIsLiked] = useState(false);
  const { addItem } = useCart();
  const navigate = useNavigate();

  const getPrice = (size: number) => {
    switch (size) {
      case 5: return perfume.price_5ml;
      case 10: return perfume.price_10ml;
      default: return perfume.price_full;
    }
  };

  const handleAddToCart = () => {
    addItem({
      perfume,
      size: selectedSize,
      quantity: 1
    });
    
    toast({
      title: "Adicionado ao carrinho!",
      description: `${perfume.name} ${selectedSize}ml foi adicionado ao seu carrinho.`,
    });
  };

  return (
    <div className="perfume-card group">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-4">
        <img
          src={perfume.image_url}
          alt={perfume.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute top-4 right-4 space-y-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white/90 hover:bg-white"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white/90 hover:bg-white"
              onClick={() => navigate(`/perfume/${perfume.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Gender Badge */}
        <div className="absolute top-4 left-4">
          <Badge 
            variant="secondary" 
            className={`
              ${perfume.gender === 'masculino' ? 'bg-blue-100 text-blue-800' : ''}
              ${perfume.gender === 'feminino' ? 'bg-pink-100 text-pink-800' : ''}
              ${perfume.gender === 'unissex' ? 'bg-purple-100 text-purple-800' : ''}
            `}
          >
            {perfume.gender}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">{perfume.brand}</p>
          <h3 className="font-playfair font-semibold text-lg leading-tight">
            {perfume.name}
          </h3>
          <p className="text-sm text-muted-foreground">{perfume.family}</p>
        </div>

        {/* Size Selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Tamanho:</p>
          <div className="flex space-x-2">
            <Button
              variant={selectedSize === 5 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSize(5)}
              className="text-xs"
            >
              5ml
            </Button>
            <Button
              variant={selectedSize === 10 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSize(10)}
              className="text-xs"
            >
              10ml
            </Button>
            {perfume.size_ml.includes(50) && (
              <Button
                variant={selectedSize === 50 ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSize(50)}
                className="text-xs"
              >
                50ml
              </Button>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-lg">
              R$ {getPrice(selectedSize).toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-muted-foreground">
              ou 3x de R$ {(getPrice(selectedSize) / 3).toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button 
          onClick={handleAddToCart}
          className="w-full gradient-gold text-white hover:opacity-90"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>
    </div>
  );
};

export default PerfumeCard;
