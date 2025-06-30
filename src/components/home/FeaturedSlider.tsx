
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface FeaturedPerfume {
  id: number;
  name: string;
  price: string;
  image: string;
}

const featuredPerfumes: FeaturedPerfume[] = [
  {
    id: 1,
    name: "Elegância Dourada",
    price: "89,90",
    image: "/images/featured1.jpg"
  },
  {
    id: 2,
    name: "Noite de Prata",
    price: "79,90",
    image: "/images/featured2.jpg"
  },
  {
    id: 3,
    name: "Brisa Matinal",
    price: "69,90",
    image: "/images/featured3.jpg"
  },
  {
    id: 4,
    name: "Mistério Oriental",
    price: "99,90",
    image: "/images/featured4.jpg"
  }
];

const FeaturedSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredPerfumes.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredPerfumes.length) % featuredPerfumes.length);
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4 text-gold">
            Perfumes em Destaque
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto font-sans font-medium">
            Descubra nossa seleção curada dos perfumes mais desejados
          </p>
        </div>

        <div className="relative">
          {/* Desktop Navigation */}
          <div className="hidden md:flex justify-between items-center absolute top-1/2 -translate-y-1/2 w-full z-10 pointer-events-none">
            <Button
              variant="outline"
              size="icon"
              className="pointer-events-auto bg-navy/80 backdrop-blur-md border-gold/20 text-gold hover:bg-gold/10 -ml-6"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="pointer-events-auto bg-navy/80 backdrop-blur-md border-gold/20 text-gold hover:bg-gold/10 -mr-6"
              onClick={nextSlide}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Cards Container */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-out md:justify-center"
              style={{ 
                transform: `translateX(-${currentIndex * 280}px)`,
              }}
            >
              {featuredPerfumes.map((perfume, index) => (
                <motion.div
                  key={perfume.id}
                  className="flex-shrink-0 w-60 mx-2 bg-navy/50 backdrop-blur-lg border border-gold/10 rounded-2xl overflow-hidden shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Image */}
                  <div className="aspect-[4/5] overflow-hidden bg-navy/40">
                    <img
                      src={perfume.image}
                      alt={perfume.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-lg text-white/90 mb-2">
                      {perfume.name}
                    </h3>
                    <p className="text-gold font-sans font-medium mb-3">
                      A partir de R$ {perfume.price}
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full btn-secondary"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile scroll indicators */}
          <div className="flex justify-center mt-6 space-x-2 md:hidden">
            {featuredPerfumes.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-gold' : 'bg-white/30'
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

export default FeaturedSlider;
