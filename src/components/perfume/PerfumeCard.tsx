
import { useState } from 'react';
import { Heart, Plus, Eye } from 'lucide-react';
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
  const [isLiked, setIsLiked] = useState(false);
  const { addItem } = useCart();
  const navigate = useNavigate();

  const handleQuickAdd = (e: React.MouseEvent, size: 5 | 10) => {
    e.stopPropagation();
    addItem({
      perfume,
      size,
      quantity: 1
    });
    
    toast({
      title: "Adicionado ao carrinho!",
      description: `${perfume.name} ${size}ml foi adicionado ao seu carrinho.`,
    });
  };

  return (
    <div className="perfume-card group cursor-pointer" onClick={() => navigate(`/perfume/${perfume.id}`)}>
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg mb-4 bg-white">
        <img
          src={perfume.image_url || '/placeholder.svg'}
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
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/perfume/${perfume.id}`);
              }}
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

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-lg">
              A partir de R$ {perfume.price_5ml.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex gap-2">
          {perfume.price_5ml && perfume.price_5ml > 0 && (
            <Button 
              onClick={(e) => handleQuickAdd(e, 5)}
              className="flex-1 gradient-gold text-white hover:opacity-90"
              size="sm"
            >
              <Plus className="mr-1 h-3 w-3" />
              5ml - R$ {perfume.price_5ml.toFixed(2).replace('.', ',')}
            </Button>
          )}
          {perfume.price_10ml && perfume.price_10ml > 0 && (
            <Button 
              onClick={(e) => handleQuickAdd(e, 10)}
              className="flex-1 gradient-gold text-white hover:opacity-90"
              size="sm"
            >
              <Plus className="mr-1 h-3 w-3" />
              10ml - R$ {perfume.price_10ml.toFixed(2).replace('.', ',')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerfumeCard;
