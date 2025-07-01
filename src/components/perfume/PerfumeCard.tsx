
import { useState } from 'react';
import { Heart, Plus, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Perfume } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

  // Use a high-quality perfume image from Unsplash as fallback
  const imageUrl = perfume.image_url || `https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop&crop=center&q=80`;

  return (
    <TooltipProvider>
      <motion.div 
        className="product-card group cursor-pointer"
        onClick={() => navigate(`/perfume/${perfume.id}`)}
        whileHover={{ 
          scale: 1.03,
          y: -4
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg mb-4 bg-navy/40">
          <img
            src={imageUrl}
            alt={perfume.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-navy/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute top-4 right-4 space-y-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white text-navy"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLiked(!isLiked);
                }}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-neonC text-neonC' : ''}`} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white text-navy"
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
                font-body text-xs
                ${perfume.gender === 'masculino' ? 'bg-neonB/20 text-neonB border-neonB/30' : ''}
                ${perfume.gender === 'feminino' ? 'bg-neonC/20 text-neonC border-neonC/30' : ''}
                ${perfume.gender === 'unissex' ? 'bg-neonA/20 text-neonA border-neonA/30' : ''}
              `}
            >
              {perfume.gender}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 p-4">
          <div>
            <p className="text-sm text-white/60 font-body">{perfume.brand}</p>
            <h3 className="font-heading font-semibold text-lg leading-tight text-white">
              {perfume.name}
            </h3>
            <p className="text-sm text-white/60 font-body">{perfume.family}</p>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg text-gold">
                A partir de R$ {perfume.price_5ml.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex gap-2">
            {perfume.price_5ml && perfume.price_5ml > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={(e) => handleQuickAdd(e, 5)}
                    className="flex-1 btn-primary"
                    size="sm"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    5ml
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>R$ {perfume.price_5ml.toFixed(2).replace('.', ',')}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {perfume.price_10ml && perfume.price_10ml > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={(e) => handleQuickAdd(e, 10)}
                    className="flex-1 btn-primary"
                    size="sm"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    10ml
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>R$ {perfume.price_10ml.toFixed(2).replace('.', ',')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

export default PerfumeCard;
