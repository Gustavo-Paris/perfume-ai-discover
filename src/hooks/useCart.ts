
import { useState, useEffect } from 'react';
import { CartItem } from '@/types';

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('paris-co-cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('paris-co-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(
        i => i.perfume.id === item.perfume.id && i.size === item.size
      );

      if (existingItem) {
        return currentItems.map(i =>
          i.perfume.id === item.perfume.id && i.size === item.size
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }

      return [...currentItems, item];
    });
  };

  const removeItem = (perfumeId: string, size: number) => {
    setItems(currentItems =>
      currentItems.filter(item => 
        !(item.perfume.id === perfumeId && item.size === size)
      )
    );
  };

  const updateQuantity = (perfumeId: string, size: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(perfumeId, size);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.perfume.id === perfumeId && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      let price = item.perfume.price_full;
      if (item.size === 5) price = item.perfume.price_5ml;
      if (item.size === 10) price = item.perfume.price_10ml;
      return total + (price * item.quantity);
    }, 0);
  };

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
  };
};
