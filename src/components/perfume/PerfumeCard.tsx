
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Perfume } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCart } from '@/contexts/CartContextOptimized';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { LazyImage } from '@/components/ui/lazy-image';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchRelatedData } from '@/utils/queryPrefetch';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { useActivePromotionByPerfume, calculatePromotionalPrice } from '@/hooks/usePromotions';
import PromotionBadge from '@/components/promotions/PromotionBadge';
import { usePerfumePricesObject } from '@/hooks/usePerfumePrices';

interface PriceInfo {
  original: number;
  promotional: number;
  hasDiscount: boolean;
  needsCalculation?: boolean;
}

interface PerfumeCardProps {
  perfume: Perfume;
}

const PerfumeCard = ({ perfume }: PerfumeCardProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Buscar promoção ativa para este perfume
  const { data: activePromotion } = useActivePromotionByPerfume(perfume.id);
  
  // Buscar preços dinâmicos do perfume
  const { prices: dynamicPrices, availableSizes } = usePerfumePricesObject(perfume.id);
  
  // ✅ PRIORIZAR available_sizes do perfume (configurado no admin)
  const configuredSizes = perfume.available_sizes && perfume.available_sizes.length > 0 
    ? perfume.available_sizes 
    : availableSizes;

  const handleQuickAdd = async (e: React.MouseEvent, size: number) => {
    e.stopPropagation();
    
    try {
      await addToCart({
        perfume_id: perfume.id,
        size_ml: size,
        quantity: 1
      });
    } catch (error: any) {
      // Erro já tratado no CartContext com toast
      console.error('Erro ao adicionar ao carrinho:', error);
    }
  };

  // Prefetch perfume details on hover for better UX
  const handleMouseEnter = () => {
    prefetchRelatedData.perfumeDetails(queryClient, perfume.id);
  };

  // Use a high-quality perfume image from Unsplash as fallback
  const imageUrl = perfume.image_url || `https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop&crop=center&q=80`;

  // Calcular preços promocionais se houver promoção ativa - versão dinâmica
  const getDisplayPrice = (size: number): PriceInfo => {
    // Primeiro tentar preços dinâmicos da nova tabela
    let originalPrice = dynamicPrices[size];
    
    // Fallback para preços hardcoded (compatibilidade)
    if (!originalPrice) {
      originalPrice = size === 2 ? perfume.price_2ml : 
                     size === 5 ? perfume.price_5ml : 
                     size === 10 ? perfume.price_10ml : 0;
    }
    
    // Se não há preço disponível, marcar como necessitando cálculo
    if (!originalPrice || typeof originalPrice !== 'number' || originalPrice <= 0) {
      return {
        original: 0,
        promotional: 0,
        hasDiscount: false,
        needsCalculation: true
      };
    }

    if (activePromotion) {
      const promotionalField = size === 2 ? 'promotional_price_2ml' : 
                               size === 5 ? 'promotional_price_5ml' : 
                               size === 10 ? 'promotional_price_10ml' : null;
      const promotionalPrice = promotionalField ? activePromotion[promotionalField] : null;
      
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

  // ✅ USAR tamanhos configurados, filtrando apenas os que têm preços válidos
  const sizesWithPrices = configuredSizes
    .map(size => ({
      size,
      priceInfo: getDisplayPrice(size)
    }))
    .filter(item => !item.priceInfo?.needsCalculation && item.priceInfo?.promotional > 0);
  
  // Calculate the lowest available price for display
  const availablePrices = sizesWithPrices.map(item => item.priceInfo!.promotional);
  const basePrice = availablePrices.length > 0 ? Math.min(...availablePrices) : 0;

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
            <div className="absolute top-4 right-4">
              <WishlistButton 
                perfumeId={perfume.id} 
                variant="icon" 
                size="sm"
                className="bg-white/90 hover:bg-white shadow-lg"
              />
            </div>
          </div>

          {/* Promotion Badge */}
          {activePromotion && (
            <div className="absolute bottom-4 left-4 z-10">
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
          <div className="absolute top-4 left-4">
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

          {/* Product Type Info */}
          {(perfume.product_type || perfume.source_size_ml) && (
            <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
              {perfume.product_type === 'decant' && perfume.source_size_ml ? (
                <span>Decant de frasco {perfume.source_size_ml}ml</span>
              ) : perfume.product_type === 'miniature' && perfume.source_size_ml ? (
                <span>Miniatura {perfume.source_size_ml}ml</span>
              ) : (
                <span>Tamanhos disponíveis</span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              {activePromotion && sizesWithPrices.some(item => item.priceInfo?.hasDiscount) ? (
                <div className="space-y-1">
                  <p className="font-display font-bold text-lg text-red-600">
                    A partir de R$ {basePrice.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-sm text-gray-500 line-through">
                    R$ {sizesWithPrices.find(item => item.priceInfo?.hasDiscount)?.priceInfo?.original.toFixed(2).replace('.', ',') || '0,00'}
                  </p>
                </div>
              ) : (
                <p className="font-display font-bold text-lg text-foreground">
                  A partir de R$ {basePrice.toFixed(2).replace('.', ',')}
                </p>
              )}
            </div>
          </div>

          {/* Quick Add Buttons - Só tamanhos calculados */}
          <div className="flex gap-1">
            {sizesWithPrices.map(({ size, priceInfo }) => (
              <Tooltip key={size}>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={(e) => handleQuickAdd(e, size)}
                     className="flex-1 bg-navy hover:bg-navy/90 text-white font-display font-medium text-xs h-8 px-1 min-w-0 flex items-center justify-center gap-0.5"
                     size="sm"
                   >
                     <Plus className="h-3 w-3" />
                     <span>{size}ml{perfume.product_type === 'miniature' ? '' : ''}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {priceInfo!.hasDiscount ? (
                    <div className="text-center">
                      <p className="text-red-600 font-bold">
                        R$ {priceInfo!.promotional.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-gray-500 line-through">
                        R$ {priceInfo!.original.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  ) : (
                    <p>R$ {priceInfo!.promotional.toFixed(2).replace('.', ',')}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

export default PerfumeCard;
