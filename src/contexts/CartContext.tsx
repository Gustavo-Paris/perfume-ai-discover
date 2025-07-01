
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem, CartItemDB, Perfume } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

interface CartContextType {
  items: CartItem[];
  addToCart: (item: { perfume_id: string; size_ml: number; quantity: number }) => Promise<void>;
  updateQuantity: (perfumeId: string, sizeML: number, quantity: number) => Promise<void>;
  removeItem: (perfumeId: string, sizeML: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load cart on mount and when user changes
  useEffect(() => {
    loadCart();
  }, [user]);

  const loadCart = async () => {
    setLoading(true);
    try {
      if (user) {
        // Load from database for logged users
        await loadFromDatabase();
        // Merge with session storage if exists
        await mergeSessionStorage();
      } else {
        // Load from session storage for guests
        loadFromSessionStorage();
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFromDatabase = async () => {
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        perfumes (*)
      `)
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error loading cart from database:', error);
      return;
    }

    const formattedItems: CartItem[] = cartItems?.map((item: any) => ({
      perfume: {
        ...item.perfumes,
        gender: item.perfumes.gender as 'masculino' | 'feminino' | 'unissex',
        size_ml: [],
        stock_full: 0,
        stock_5ml: 0,
        stock_10ml: 0
      } as Perfume,
      size: item.size_ml,
      quantity: item.quantity
    })) || [];

    setItems(formattedItems);
  };

  const loadFromSessionStorage = () => {
    const savedCart = sessionStorage.getItem('paris-co-guest-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Error parsing cart from session storage:', error);
        sessionStorage.removeItem('paris-co-guest-cart');
      }
    }
  };

  const mergeSessionStorage = async () => {
    const savedCart = sessionStorage.getItem('paris-co-guest-cart');
    if (!savedCart || !user) return;

    try {
      const guestItems: CartItem[] = JSON.parse(savedCart);
      
      for (const guestItem of guestItems) {
        await addToCartDB(guestItem.perfume.id, guestItem.size, guestItem.quantity);
      }

      // Clear session storage after merge
      sessionStorage.removeItem('paris-co-guest-cart');
      
      // Reload from database
      await loadFromDatabase();
    } catch (error) {
      console.error('Error merging session storage:', error);
    }
  };

  const saveToSessionStorage = (cartItems: CartItem[]) => {
    sessionStorage.setItem('paris-co-guest-cart', JSON.stringify(cartItems));
  };

  const addToCart = async (item: { perfume_id: string; size_ml: number; quantity: number }) => {
    setLoading(true);
    try {
      if (user) {
        await addToCartDB(item.perfume_id, item.size_ml, item.quantity);
        await loadFromDatabase();
      } else {
        await addToCartSession(item.perfume_id, item.size_ml, item.quantity);
      }
      
      toast({
        title: "Item adicionado ao carrinho!",
        description: "O produto foi adicionado com sucesso.",
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item ao carrinho.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCartDB = async (perfumeId: string, sizeML: number, quantity: number) => {
    // Check if item already exists
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user?.id)
      .eq('perfume_id', perfumeId)
      .eq('size_ml', sizeML)
      .single();

    if (existingItem) {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);

      if (error) throw error;
    } else {
      // Insert new item
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user?.id,
          perfume_id: perfumeId,
          size_ml: sizeML,
          quantity
        });

      if (error) throw error;
    }
  };

  const addToCartSession = async (perfumeId: string, sizeML: number, quantity: number) => {
    // Get perfume data
    const { data: perfume, error } = await supabase
      .from('perfumes')
      .select('*')
      .eq('id', perfumeId)
      .single();

    if (error || !perfume) {
      throw new Error('Perfume not found');
    }

    const newItems = [...items];
    const existingItemIndex = newItems.findIndex(
      item => item.perfume.id === perfumeId && item.size === sizeML
    );

    const formattedPerfume: Perfume = {
      ...perfume,
      gender: perfume.gender as 'masculino' | 'feminino' | 'unissex',
      size_ml: [],
      stock_full: 0,
      stock_5ml: 0,
      stock_10ml: 0
    };

    if (existingItemIndex >= 0) {
      newItems[existingItemIndex].quantity += quantity;
    } else {
      newItems.push({
        perfume: formattedPerfume,
        size: sizeML,
        quantity
      });
    }

    setItems(newItems);
    saveToSessionStorage(newItems);
  };

  const updateQuantity = async (perfumeId: string, sizeML: number, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(perfumeId, sizeML);
      return;
    }

    setLoading(true);
    try {
      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('user_id', user.id)
          .eq('perfume_id', perfumeId)
          .eq('size_ml', sizeML);

        if (error) throw error;
        await loadFromDatabase();
      } else {
        const newItems = items.map(item =>
          item.perfume.id === perfumeId && item.size === sizeML
            ? { ...item, quantity }
            : item
        );
        setItems(newItems);
        saveToSessionStorage(newItems);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quantidade.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (perfumeId: string, sizeML: number) => {
    setLoading(true);
    try {
      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('perfume_id', perfumeId)
          .eq('size_ml', sizeML);

        if (error) throw error;
        await loadFromDatabase();
      } else {
        const newItems = items.filter(
          item => !(item.perfume.id === perfumeId && item.size === sizeML)
        );
        setItems(newItems);
        saveToSessionStorage(newItems);
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        sessionStorage.removeItem('paris-co-guest-cart');
      }
      
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      let price = item.perfume.price_full;
      if (item.size === 5) price = item.perfume.price_5ml || 0;
      if (item.size === 10) price = item.perfume.price_10ml || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        getTotal,
        loading
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
