
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePerfumes } from '@/hooks/usePerfumes';

const FeaturedProducts = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const { data: perfumes, isLoading } = usePerfumes();

  // Pega os primeiros 8 perfumes em destaque
  const featuredPerfumes = perfumes?.slice(0, 8) || [];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredPerfumes.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredPerfumes.length) % featuredPerfumes.length);
  };

  // Calcular quantos slides são visíveis por vez
  const getVisibleCount = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 4; // lg: 4 cards
      if (window.innerWidth >= 640) return 2;  // sm: 2 cards
      return 1; // mobile: 1 card
    }
    return 1;
  };

  const visibleCount = getVisibleCount();
  const maxIndex = Math.max(0, featuredPerfumes.length - visibleCount);

  const nextSlideResponsive = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlideResponsive = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  if (isLoading) {
    return (
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold mb-4 text-gray-900">
              Perfumes em Destaque
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!featuredPerfumes.length) {
    return null;
  }

  return (
    <section className="py-12 md:py-20 px-4 bg-gray-50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold mb-4 text-gray-900">
            Perfumes em Destaque
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Descubra nossa seleção curada dos perfumes mais desejados
          </p>
        </div>

        <div className="relative">
          {/* Navigation Buttons - Always visible but adapted for mobile */}
          <div className="flex justify-between items-center absolute top-1/2 -translate-y-1/2 w-full z-10 pointer-events-none px-2 md:px-0">
            <Button
              variant="outline"
              size="icon"
              className="pointer-events-auto bg-white shadow-lg border-gray-200 text-gray-700 hover:bg-gray-50 h-8 w-8 md:h-10 md:w-10 -ml-2 md:-ml-6"
              onClick={prevSlideResponsive}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="pointer-events-auto bg-white shadow-lg border-gray-200 text-gray-700 hover:bg-gray-50 h-8 w-8 md:h-10 md:w-10 -mr-2 md:-mr-6"
              onClick={nextSlideResponsive}
              disabled={currentIndex >= maxIndex}
            >
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>

          {/* Cards Container */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
              }}
            >
              {featuredPerfumes.map((perfume, index) => (
                <motion.div
                  key={perfume.id}
                  className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/4 px-2 md:px-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden card-hover">
                    {/* Image */}
                    <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative group">
                      <img
                        src={perfume.image_url || `https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=400&fit=crop&crop=center&q=80`}
                        alt={perfume.name}
                        loading={index < 4 ? "eager" : "lazy"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button 
                          size="sm" 
                          className="btn-primary text-xs md:text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/perfume/${perfume.id}`);
                          }}
                        >
                          <ShoppingBag className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                          Ver Produto
                        </Button>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 md:p-6">
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mb-2">
                          {perfume.gender}
                        </span>
                      </div>
                      <h3 className="font-medium text-base md:text-lg text-gray-900 mb-1 line-clamp-2">
                        {perfume.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-500 mb-3">
                        {perfume.brand}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-base md:text-lg text-gray-900">
                          R$ {perfume.price_5ml?.toFixed(2).replace('.', ',')}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/perfume/${perfume.id}`)}
                          className="text-xs"
                        >
                          Ver mais
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile indicators */}
          <div className="flex justify-center mt-6 md:mt-8 space-x-2">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-gray-900' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
