import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Import decant images
import decantsCollection from '@/assets/decants-collection.png';
import decantsDuo1 from '@/assets/decants-duo-1.png';
import decantsQuartet1 from '@/assets/decants-quartet-1.png';
import decantsQuartet2 from '@/assets/decants-quartet-2.png';
import decantsQuartet3 from '@/assets/decants-quartet-3.png';

interface FeaturedImage {
  id: number;
  title: string;
  image: string;
}

const featuredImages: FeaturedImage[] = [
  {
    id: 1,
    title: "Coleção Completa Paris & Co",
    image: decantsCollection
  },
  {
    id: 2,
    title: "Vulcan Feu & Turathi Blue",
    image: decantsDuo1
  },
  {
    id: 3,
    title: "Yara Collection",
    image: decantsQuartet1
  },
  {
    id: 4,
    title: "Fragrâncias Premium",
    image: decantsQuartet2
  },
  {
    id: 5,
    title: "Liquid Brunette & Badee Al Oud",
    image: decantsQuartet3
  }
];

const FeaturedSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredImages.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredImages.length) % featuredImages.length);
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4 text-gold">
            Nossos Decants Premium
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto font-sans font-medium">
            Fragrâncias de luxo em frascos exclusivos Paris & Co
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

          {/* Image Display */}
          <div className="overflow-hidden rounded-3xl">
            <div className="relative aspect-[16/9] md:aspect-[21/9] bg-gradient-to-br from-navy/60 to-navy/40 backdrop-blur-lg border border-gold/20 rounded-3xl overflow-hidden shadow-2xl cursor-pointer"
              onClick={() => navigate('/catalogo')}
            >
              {/* Render all images with absolute positioning for smooth crossfade */}
              {featuredImages.map((item, index) => (
                <motion.div
                  key={index}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: index === currentIndex ? 1 : 0 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-contain p-8 md:p-12"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <h3 className="font-display font-bold text-2xl md:text-3xl text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gold font-sans font-medium">
                      Clique para explorar o catálogo completo
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Scroll indicators */}
          <div className="flex justify-center mt-8 space-x-3">
            {featuredImages.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-gold w-8' 
                    : 'bg-white/30 w-2 hover:bg-white/50'
                }`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Ir para imagem ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSlider;
