
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import HeaderLogo from './HeaderLogo';
import HeaderNavigation from './HeaderNavigation';
import HeaderActions from './HeaderActions';
import HeaderMobileMenu from './HeaderMobileMenu';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { items } = useCart();
  const navigate = useNavigate();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Element;
      if (isSearchOpen && !target.closest('[data-search-container]')) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isSearchOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full h-16 bg-white/95 backdrop-blur-lg border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <HeaderLogo />
            </div>
            
            {/* Navigation - Hidden on smaller screens */}
            <div className="hidden lg:flex flex-1 justify-center">
              <HeaderNavigation />
            </div>
            
            {/* Actions */}
            <div className="flex-shrink-0" data-search-container>
              <HeaderActions isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen} />
            </div>
            
            {/* Mobile Actions */}
            <div className="md:hidden flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-700 hover:text-gray-900 hover-scale"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-gray-700 hover:text-gray-900 hover-scale"
                onClick={() => navigate('/carrinho')}
              >
                <ShoppingBag className="h-4 w-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center font-medium animate-scale-in">
                    {totalItems}
                  </span>
                )}
              </Button>
              <HeaderMobileMenu isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            </div>
          </div>
        </div>
      </header>

      {/* Search Overlay for Mobile */}
      {isSearchOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-fade-in" onClick={() => setIsSearchOpen(false)}>
          <div className="bg-white p-4 m-4 rounded-lg shadow-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-full">
              {/* Mobile search component would go here */}
              <input 
                type="text" 
                placeholder="Buscar perfumes..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
