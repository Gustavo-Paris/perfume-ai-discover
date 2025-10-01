import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem, CartItemDB, Perfume } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { trackAddToCart } from '@/utils/analytics';
import { debugLog, debugError } from '@/utils/removeDebugLogs';

export interface PackagingCosts {
  containers_needed: {
    material_id: string;
    name: string;
    quantity: number;
    cost_per_unit: number;
    total_cost: number;
    items_per_container: number;
  }[];
  total_packaging_cost: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: { perfume_id: string; size_ml: number; quantity: number }) => Promise<void>;
  updateQuantity: (perfumeId: string, sizeML: number, quantity: number) => Promise<void>;
  removeItem: (perfumeId: string, sizeML: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => Promise<number>;
  loading: boolean;
  packagingCosts: PackagingCosts | null;
  calculatePackagingCosts: () => Promise<void>;
  getItemPrice: (perfumeId: string, size: number) => Promise<number>;
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
  const [packagingCosts, setPackagingCosts] = useState<PackagingCosts | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Cache de preços para evitar queries N+1
  const [pricesCache, setPricesCache] = useState<Record<string, Record<number, number>>>({});

  // Load cart on mount and when user changes
  useEffect(() => {
    loadCart();
  }, [user]);

  // Buscar TODOS os preços em uma única query para cache
  const loadAllPricesCache = async (perfumeIds: string[]) => {
    if (perfumeIds.length === 0) return {};

    try {
      const { data: allPrices, error } = await supabase
        .from('perfume_prices')
        .select('perfume_id, size_ml, price')
        .in('perfume_id', perfumeIds);

      if (error) throw error;

      // Organizar em cache
      const cache: Record<string, Record<number, number>> = {};
      allPrices?.forEach(price => {
        if (!cache[price.perfume_id]) {
          cache[price.perfume_id] = {};
        }
        cache[price.perfume_id][price.size_ml] = price.price;
      });

      debugLog('Cart prices cache loaded', { perfumeIds, cacheSize: Object.keys(cache).length });
      return cache;
    } catch (error) {
      debugError('Error loading prices cache:', error);
      return {};
    }
  };

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
      debugError('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFromDatabase = async () => {
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        user_id,
        perfume_id,
        size_ml,
        quantity,
        created_at,
        perfumes (
          id,
          name,
          brand,
          family,
          gender,
          description,
          image_url,
          price_2ml,
          price_5ml,
          price_10ml,
          price_full,
          top_notes,
          heart_notes,
          base_notes,
          category,
          created_at
        )
      `)
      .eq('user_id', user?.id);

    if (error) {
      debugError('Error loading cart from database:', error);
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setItems([]);
      return;
    }

    // OTIMIZAÇÃO: Buscar TODOS os preços em uma única query
    const perfumeIds = cartItems.map(item => item.perfume_id);
    const newPricesCache = await loadAllPricesCache(perfumeIds);
    setPricesCache(prev => ({ ...prev, ...newPricesCache }));

    // Criar items do carrinho com preços do cache
    const formattedItems: CartItem[] = cartItems.map(item => ({
      perfume: {
        ...item.perfumes,
        gender: item.perfumes.gender as 'masculino' | 'feminino' | 'unissex',
        size_ml: [],
        stock_full: 0,
        stock_5ml: 0,
        stock_10ml: 0,
        // Usar preços do cache
        dynamicPrices: newPricesCache[item.perfume_id] || {}
      } as Perfume & { dynamicPrices: Record<number, number> },
      size: item.size_ml,
      quantity: item.quantity
    }));

    setItems(formattedItems);
  };

  const loadFromSessionStorage = () => {
    const savedCart = sessionStorage.getItem('paris-co-guest-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        debugError('Error parsing cart from session storage:', error);
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
      debugError('Error merging session storage:', error);
    }
  };

  const saveToSessionStorage = (cartItems: CartItem[]) => {
    sessionStorage.setItem('paris-co-guest-cart', JSON.stringify(cartItems));
  };

  const addToCart = async (item: { perfume_id: string; size_ml: number; quantity: number }) => {
    setLoading(true);
    try {
      // Get perfume data for analytics - usar query única otimizada
      const { data: perfume } = await supabase
        .from('perfumes')
        .select('id, name, brand, price_2ml, price_5ml, price_10ml, price_full')
        .eq('id', item.perfume_id)
        .maybeSingle();

      if (user) {
        await addToCartDB(item.perfume_id, item.size_ml, item.quantity);
        await loadFromDatabase();
      } else {
        await addToCartSession(item.perfume_id, item.size_ml, item.quantity);
      }
      
      // Track add_to_cart event - usar preço do cache se disponível
      if (perfume) {
        let price = 0;
        
        // Usar cache de preços primeiro
        if (pricesCache[item.perfume_id]?.[item.size_ml]) {
          price = pricesCache[item.perfume_id][item.size_ml];
        } else {
          // Fallback para preços hardcoded
          price = item.size_ml === 2 ? perfume.price_2ml : 
                   item.size_ml === 5 ? perfume.price_5ml : 
                   item.size_ml === 10 ? perfume.price_10ml : 
                   perfume.price_full;
        }
        
        trackAddToCart({
          item_id: perfume.id,
          item_name: perfume.name,
          item_brand: perfume.brand,
          item_variant: `${item.size_ml}ml`,
          price: price || 0,
          quantity: item.quantity
        });
      }
      
      toast({
        title: "Item adicionado ao carrinho!",
        description: "O produto foi adicionado com sucesso.",
      });
    } catch (error) {
      debugError('Error adding to cart:', error);
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
      .select('id, user_id, perfume_id, size_ml, quantity, created_at')
      .eq('user_id', user?.id)
      .eq('perfume_id', perfumeId)
      .eq('size_ml', sizeML)
      .maybeSingle();

    const targetQty = (existingItem?.quantity || 0) + quantity;

    // Reserve stock before persisting cart (only for authenticated users)
    if (user) {
      const { error: reserveError } = await supabase.rpc('upsert_reservation', {
        perfume_uuid: perfumeId,
        size_ml_param: sizeML,
        qty_param: targetQty,
        user_uuid: user.id,
      });
      if (reserveError) {
        throw reserveError;
      }
    }

    if (existingItem) {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: targetQty })
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
          quantity: targetQty
        });

      if (error) throw error;
    }
  };

  const addToCartSession = async (perfumeId: string, sizeML: number, quantity: number) => {
    // Get perfume data
    const { data: perfume, error } = await supabase
      .from('perfumes')
      .select('id, name, brand, family, gender, description, image_url, price_2ml, price_5ml, price_10ml, price_full, top_notes, heart_notes, base_notes, category, created_at')
      .eq('id', perfumeId)
      .maybeSingle();

    if (error || !perfume) {
      throw new Error('Perfume not found');
    }

    // OTIMIZAÇÃO: Buscar preços dinâmicos apenas se não estiver no cache
    let dynamicPrices = pricesCache[perfumeId] || {};
    
    if (Object.keys(dynamicPrices).length === 0) {
      const { data: pricesData } = await supabase
        .from('perfume_prices')
        .select('size_ml, price')
        .eq('perfume_id', perfumeId);
      
      pricesData?.forEach(dp => {
        dynamicPrices[dp.size_ml] = dp.price;
      });
      
      // Atualizar cache
      setPricesCache(prev => ({
        ...prev,
        [perfumeId]: dynamicPrices
      }));
    }

    const newItems = [...items];
    const existingItemIndex = newItems.findIndex(
      item => item.perfume.id === perfumeId && item.size === sizeML
    );

    const formattedPerfume: Perfume & { dynamicPrices: Record<number, number> } = {
      ...perfume,
      gender: perfume.gender as 'masculino' | 'feminino' | 'unissex',
      size_ml: [],
      stock_full: 0,
      stock_5ml: 0,
      stock_10ml: 0,
      dynamicPrices
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
        // Reserve stock to the new target quantity first
        const { error: reserveError } = await supabase.rpc('upsert_reservation', {
          perfume_uuid: perfumeId,
          size_ml_param: sizeML,
          qty_param: quantity,
          user_uuid: user.id,
        });
        if (reserveError) {
          throw reserveError;
        }
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
      debugError('Error updating quantity:', error);
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

        // Remove reservation for this item
        await supabase
          .from('reservations')
          .delete()
          .eq('user_id', user.id)
          .eq('perfume_id', perfumeId)
          .eq('size_ml', sizeML);

        await loadFromDatabase();
      } else {
        const newItems = items.filter(
          item => !(item.perfume.id === perfumeId && item.size === sizeML)
        );
        setItems(newItems);
        saveToSessionStorage(newItems);
      }
    } catch (error) {
      debugError('Error removing item:', error);
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

        // Clear all reservations for this user
        await supabase
          .from('reservations')
          .delete()
          .eq('user_id', user.id);
      } else {
        sessionStorage.removeItem('paris-co-guest-cart');
      }
      
      setItems([]);
    } catch (error) {
      debugError('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePackagingCosts = async () => {
    try {
      const cartData = items.map(item => ({
        perfume_id: item.perfume.id,
        size_ml: item.size,
        quantity: item.quantity
      }));

      const { data, error } = await supabase.rpc('calculate_packaging_costs', {
        cart_items: cartData
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Type assertion to handle Supabase Json type
        const result = data[0] as PackagingCosts;
        setPackagingCosts(result);
      }
    } catch (error) {
      debugError('Error calculating packaging costs:', error);
    }
  };

  const getTotal = async () => {
    let itemsTotal = 0;
    
    for (const item of items) {
      // Usar cache de preços primeiro
      const perfumeWithDynamic = item.perfume as Perfume & { dynamicPrices?: Record<number, number> };
      let price = 0;
      
      // Se tem preços dinâmicos no cache, usar eles
      if (perfumeWithDynamic.dynamicPrices && perfumeWithDynamic.dynamicPrices[item.size]) {
        price = perfumeWithDynamic.dynamicPrices[item.size];
      } else if (pricesCache[item.perfume.id]?.[item.size]) {
        price = pricesCache[item.perfume.id][item.size];
      } else {
        // Fallback para preços fixos
        price = item.size === 2 ? item.perfume.price_2ml :
                item.size === 5 ? item.perfume.price_5ml :
                item.size === 10 ? item.perfume.price_10ml :
                item.perfume.price_full;
      }
      
      itemsTotal += price * item.quantity;
    }
    
    const packagingTotal = packagingCosts?.total_packaging_cost || 0;
    return itemsTotal + packagingTotal;
  };

  const getItemPrice = async (perfumeId: string, size: number): Promise<number> => {
    // Usar cache primeiro
    if (pricesCache[perfumeId]?.[size]) {
      return pricesCache[perfumeId][size];
    }

    // Se não estiver no cache, buscar e cachear
    const { data: priceData } = await supabase
      .from('perfume_prices')
      .select('price')
      .eq('perfume_id', perfumeId)
      .eq('size_ml', size)
      .maybeSingle();

    if (priceData) {
      setPricesCache(prev => ({
        ...prev,
        [perfumeId]: {
          ...prev[perfumeId],
          [size]: priceData.price
        }
      }));
      return priceData.price;
    }

    // Fallback: buscar preços hardcoded da tabela perfumes
    const { data: perfumeData } = await supabase
      .from('perfumes')
      .select('price_2ml, price_5ml, price_10ml, price_full')
      .eq('id', perfumeId)
      .maybeSingle();

    if (perfumeData) {
      let fallbackPrice = 0;
      switch (size) {
        case 2: fallbackPrice = perfumeData.price_2ml || 0; break;
        case 5: fallbackPrice = perfumeData.price_5ml || 0; break;
        case 10: fallbackPrice = perfumeData.price_10ml || 0; break;
        default: fallbackPrice = perfumeData.price_full || 0; break;
      }
      
      // Cachear o preço hardcoded também
      if (fallbackPrice > 0) {
        setPricesCache(prev => ({
          ...prev,
          [perfumeId]: {
            ...prev[perfumeId],
            [size]: fallbackPrice
          }
        }));
      }
      
      return fallbackPrice;
    }

    return 0;
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
        loading,
        packagingCosts,
        calculatePackagingCosts,
        getItemPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
