
import { useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Perfume } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { LazyImage } from '@/components/ui/lazy-image';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchRelatedData } from '@/utils/queryPrefetch';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { useActivePromotionByPerfume, calculatePromotionalPrice } from '@/hooks/usePromotions';
import PromotionBadge from '@/components/promotions/PromotionBadge';

interface PerfumeCardProps {
  perfume: Perfume;
}

const PerfumeCard = ({ perfume }: PerfumeCardProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Buscar promoção ativa para este perfume
  const { data: activePromotion } = useActivePromotionByPerfume(perfume.id);

  const handleQuickAdd = (e: React.MouseEvent, size: 5 | 10) => {
    e.stopPropagation();
    addToCart({
      perfume_id: perfume.id,
      size_ml: size,
      quantity: 1
    });
    
    toast({
      title: "Adicionado ao carrinho!",
      description: `${perfume.name} ${size}ml foi adicionado ao seu carrinho.`,
    });
  };

  // Prefetch perfume details on hover for better UX
  const handleMouseEnter = () => {
    prefetchRelatedData.perfumeDetails(queryClient, perfume.id);
  };

  // Use a high-quality perfume image from Unsplash as fallback
  const imageUrl = perfume.image_url || `https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop&crop=center&q=80`;

  // Calcular preços promocionais se houver promoção ativa
  const getDisplayPrice = (size: 5 | 10) => {
    const originalPrice = size === 5 ? perfume.price_5ml : perfume.price_10ml;
    if (!originalPrice) return null;

    if (activePromotion) {
      const promotionalField = size === 5 ? 'promotional_price_5ml' : 'promotional_price_10ml';
      const promotionalPrice = activePromotion[promotionalField];
      
      if (promotionalPrice) {
        return {
          original: originalPrice,
          promotional: promotionalPrice,
          hasDiscount: true
        };
      } else {
        // Calcular baseado no desconto
        const promotional = calculatePromotionalPrice(
          originalPrice, 
          activePromotion.discount_type as 'percent' | 'fixed', 
          activePromotion.discount_value
        );
        return {
          original: originalPrice,
          promotional,
          hasDiscount: true
        };
      }
    }

    return {
      original: originalPrice,
      promotional: originalPrice,
      hasDiscount: false
    };
  };

  const price5ml = getDisplayPrice(5);
  const price10ml = getDisplayPrice(10);
  const basePrice = price5ml?.promotional || perfume.price_5ml || 0;

  return (
    <TooltipProvider>
      <motion.div 
        className="glass rounded-2xl overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300"
        onClick={() => navigate(`/perfume/${perfume.id}`)}
        onMouseEnter={handleMouseEnter}
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
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
          <LazyImage
            src={imageUrl}
            alt={perfume.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-navy/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute top-4 right-4 space-y-2">
              <WishlistButton 
                perfumeId={perfume.id} 
                variant="icon" 
                size="sm"
                className="bg-white/90 hover:bg-white shadow-lg"
              />
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white text-navy border-0 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/perfume/${perfume.id}`);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Promotion Badge */}
          {activePromotion && (
            <div className="absolute top-4 left-4 z-10">
              <PromotionBadge 
                promotion={{
                  id: activePromotion.id,
                  title: activePromotion.title,
                  discount_type: activePromotion.discount_type as 'percent' | 'fixed',
                  discount_value: activePromotion.discount_value,
                  ends_at: activePromotion.ends_at
                }}
                size="sm"
                showTimer={true}
              />
            </div>
          )}

          {/* Gender Badge */}
          <div className={`absolute ${activePromotion ? 'bottom-4' : 'top-4'} left-4`}>
            <Badge 
              variant="secondary" 
              className={`
                font-display text-xs font-medium
                ${perfume.gender === 'masculino' ? 'bg-blue-500/20 text-blue-700 border-blue-500/30' : ''}
                ${perfume.gender === 'feminino' ? 'bg-pink-500/20 text-pink-700 border-pink-500/30' : ''}
                ${perfume.gender === 'unissex' ? 'bg-purple-500/20 text-purple-700 border-purple-500/30' : ''}
              `}
            >
              {perfume.gender}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 p-6">
          <div>
            <p className="text-sm text-gray-500 font-display font-medium">{perfume.brand}</p>
            <h3 className="font-display font-bold text-lg leading-tight text-gray-900 mt-1">
              {perfume.name}
            </h3>
            <p className="text-sm text-gray-600 font-display mt-1">{perfume.family}</p>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              {activePromotion && price5ml?.hasDiscount ? (
                <div className="space-y-1">
                  <p className="font-display font-bold text-lg text-red-600">
                    A partir de R$ {basePrice.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-sm text-gray-500 line-through">
                    R$ {(perfume.price_5ml || 0).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              ) : (
                <p className="font-display font-bold text-lg text-navy">
                  A partir de R$ {basePrice.toFixed(2).replace('.', ',')}
                </p>
              )}
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex gap-2">
            {price5ml && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={(e) => handleQuickAdd(e, 5)}
                    className="flex-1 bg-navy hover:bg-navy/90 text-white font-display font-medium"
                    size="sm"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    5ml
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {price5ml.hasDiscount ? (
                    <div className="text-center">
                      <p className="text-red-600 font-bold">
                        R$ {price5ml.promotional.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-gray-500 line-through">
                        R$ {price5ml.original.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  ) : (
                    <p>R$ {price5ml.promotional.toFixed(2).replace('.', ',')}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            )}
            {price10ml && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={(e) => handleQuickAdd(e, 10)}
                    className="flex-1 bg-navy hover:bg-navy/90 text-white font-display font-medium"
                    size="sm"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    10ml
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {price10ml.hasDiscount ? (
                    <div className="text-center">
                      <p className="text-red-600 font-bold">
                        R$ {price10ml.promotional.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-gray-500 line-through">
                        R$ {price10ml.original.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  ) : (
                    <p>R$ {price10ml.promotional.toFixed(2).replace('.', ',')}</p>
                  )}
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
