
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import HeaderUserMenu from './HeaderUserMenu';

const HeaderActions = () => {
  const { items } = useCart();
  const navigate = useNavigate();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="hidden md:flex items-center space-x-4">
      <Button variant="ghost" size="icon">
        <Search className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <Heart className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => navigate('/carrinho')}
      >
        <ShoppingBag className="h-4 w-4" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold-500 text-xs text-white flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </Button>
      <HeaderUserMenu />
    </div>
  );
};

export default HeaderActions;
