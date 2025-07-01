
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
    <header className="sticky top-0 z-50 w-full h-14 bg-white/95 backdrop-blur-lg border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-14 items-center justify-between">
          <HeaderLogo />
          <HeaderNavigation />
          <HeaderActions />
          
          {/* Mobile Actions */}
          <div className="md:hidden flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-gray-700 hover:text-gray-900"
              onClick={() => navigate('/carrinho')}
            >
              <ShoppingBag className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gray-900 text-xs text-white flex items-center justify-center font-bold">
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
