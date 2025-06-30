
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import HeaderLogo from './HeaderLogo';
import HeaderNavigation from './HeaderNavigation';
import HeaderActions from './HeaderActions';
import HeaderMobileMenu from './HeaderMobileMenu';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { items } = useCart();
  const navigate = useNavigate();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-navy/95 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <HeaderLogo />
          <HeaderNavigation />
          <HeaderActions />
          
          {/* Mobile Actions */}
          <div className="md:hidden flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-white hover:text-gold hover:bg-white/10"
              onClick={() => navigate('/carrinho')}
            >
              <ShoppingBag className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold text-xs text-navy flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Button>
            <HeaderMobileMenu isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
