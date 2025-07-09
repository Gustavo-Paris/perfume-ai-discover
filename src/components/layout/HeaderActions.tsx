
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import HeaderUserMenu from './HeaderUserMenu';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import AlgoliaAutocomplete from '@/components/search/AlgoliaAutocomplete';

interface HeaderActionsProps {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  disabled?: boolean;
}

const HeaderActions = ({ isSearchOpen, setIsSearchOpen, disabled = false }: HeaderActionsProps) => {
  const { items } = useCart();
  const navigate = useNavigate();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className="hidden md:flex items-center space-x-3">
        {/* Search Toggle */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="hover-scale"
        >
          {isSearchOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
        
        {/* Wishlist */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="hover-scale"
          onClick={() => navigate('/wishlist')}
        >
          <Heart className="h-4 w-4" />
        </Button>
        
        {/* Notifications */}
        <NotificationDropdown />
        
        {/* Cart */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover-scale"
          onClick={() => navigate('/carrinho')}
        >
          <ShoppingBag className="h-4 w-4" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center font-medium animate-scale-in">
              {totalItems}
            </span>
          )}
        </Button>
        
        {/* User Menu */}
        <HeaderUserMenu disabled={disabled} />
      </div>

      {/* Expandable Search Bar */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-lg animate-fade-in z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="max-w-2xl mx-auto">
              <AlgoliaAutocomplete />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderActions;
