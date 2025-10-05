
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem, CartItemDB, Perfume } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { trackAddToCart } from '@/utils/analytics';

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
          available_sizes,
          created_at
        )
      `)
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error loading cart from database:', error);
      return;
    }

    // Buscar preços dinâmicos para cada perfume no carrinho
    const formattedItems: CartItem[] = [];
    
    for (const item of cartItems || []) {
      // Buscar preços dinâmicos para este perfume
      const { data: dynamicPrices } = await supabase
        .from('perfume_prices')
        .select('size_ml, price')
        .eq('perfume_id', item.perfume_id);
      
      // Criar objeto de preços dinâmicos
      const pricesMap: Record<number, number> = {};
      dynamicPrices?.forEach(dp => {
        pricesMap[dp.size_ml] = dp.price;
      });
      
      // ✅ VALIDAR se o tamanho do item está em available_sizes
      const availableSizes = (item.perfumes.available_sizes as number[]) || [];
      if (availableSizes.length > 0 && !availableSizes.includes(item.size_ml)) {
        console.warn(`Item no carrinho com tamanho indisponível: ${item.perfumes.name} - ${item.size_ml}ml`);
        // Remover item do carrinho se tamanho não está disponível
        await supabase
          .from('cart_items')
          .delete()
          .eq('id', item.id);
        continue; // Pular este item
      }
      
      formattedItems.push({
        perfume: {
          ...item.perfumes,
          gender: item.perfumes.gender as 'masculino' | 'feminino' | 'unissex',
          size_ml: availableSizes.length > 0 ? availableSizes : [],
          stock_full: 0,
          stock_5ml: 0,
          stock_10ml: 0,
          available_sizes: availableSizes,
          // Adicionar preços dinâmicos ao objeto perfume
          dynamicPrices: pricesMap
        } as Perfume & { dynamicPrices: Record<number, number> },
        size: item.size_ml,
        quantity: item.quantity
      });
    }

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
      // ✅ VALIDAR ESTOQUE DISPONÍVEL - buscar quantidade REAL no banco para evitar race conditions
      let currentQuantity = 0;
      
      if (user) {
        // Usuário logado: buscar do banco
        const { data: cartItems } = await supabase
          .from('cart_items')
          .select('quantity')
          .eq('user_id', user.id)
          .eq('perfume_id', item.perfume_id)
          .eq('size_ml', item.size_ml)
          .maybeSingle();
        
        currentQuantity = cartItems?.quantity || 0;
      } else {
        // Usuário guest: buscar do estado local
        const currentItemInCart = items.find(
          i => i.perfume.id === item.perfume_id && i.size === item.size_ml
        );
        currentQuantity = currentItemInCart?.quantity || 0;
      }
      
      const targetQuantity = currentQuantity + item.quantity;
      
      // Verificar disponibilidade usando função do banco (excluindo a reserva do próprio usuário)
      const { data: availability, error: availError } = await supabase.rpc('check_perfume_availability', {
        perfume_uuid: item.perfume_id,
        size_ml_param: item.size_ml,
        quantity_requested: targetQuantity,
        user_uuid: user?.id || null
      });
      
      if (availError || !availability || availability.length === 0) {
        throw new Error('Erro ao verificar disponibilidade do produto');
      }
      
      const stockInfo = availability[0];
      if (!stockInfo.available) {
        throw new Error(
          `Estoque insuficiente. Disponível: ${stockInfo.max_quantity} unidade(s) de ${item.size_ml}ml (${stockInfo.stock_ml}ml em estoque)`
        );
      }
      
      // Get perfume data for analytics
      const { data: perfume } = await supabase
        .from('perfumes')
        .select('id, name, brand, price_2ml, price_5ml, price_10ml, price_full')
        .eq('id', item.perfume_id)
        .single();

      if (user) {
        await addToCartDB(item.perfume_id, item.size_ml, item.quantity);
        await loadFromDatabase();
      } else {
        await addToCartSession(item.perfume_id, item.size_ml, item.quantity);
      }
      
      // Track add_to_cart event
      if (perfume) {
        // Buscar preço dinâmico se existir
        const { data: dynamicPrice } = await supabase
          .from('perfume_prices')
          .select('price')
          .eq('perfume_id', item.perfume_id)
          .eq('size_ml', item.size_ml)
          .maybeSingle();
        
        // Usar preço dinâmico se disponível, senão usar hardcoded
        let price = 0;
        if (dynamicPrice) {
          price = dynamicPrice.price;
        } else {
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
      
      // ✅ Toast só aparece após SUCESSO completo
      toast({
        title: "Item adicionado ao carrinho!",
        description: `${perfume?.name || 'Produto'} ${item.size_ml}ml foi adicionado ao seu carrinho.`,
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      
      // Mostrar mensagem de erro específica
      const errorMessage = error.message || "Não foi possível adicionar o item ao carrinho.";
      toast({
        title: "Erro ao adicionar ao carrinho",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCartDB = async (perfumeId: string, sizeML: number, quantity: number) => {
    // ✅ VALIDAR available_sizes antes de adicionar
    const { data: perfume } = await supabase
      .from('perfumes')
      .select('available_sizes')
      .eq('id', perfumeId)
      .single();
    
    const availableSizes = (perfume?.available_sizes as number[]) || [];
    if (availableSizes.length > 0 && !availableSizes.includes(sizeML)) {
      throw new Error(`Tamanho ${sizeML}ml não disponível para este perfume`);
    }
    
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
      .select('id, name, brand, family, gender, description, image_url, price_2ml, price_5ml, price_10ml, price_full, top_notes, heart_notes, base_notes, category, available_sizes, created_at')
      .eq('id', perfumeId)
      .single();

    if (error || !perfume) {
      throw new Error('Perfume not found');
    }
    
    // ✅ VALIDAR se o tamanho está disponível
    const availableSizes = (perfume.available_sizes as number[]) || [];
    if (availableSizes.length > 0 && !availableSizes.includes(sizeML)) {
      throw new Error(`Tamanho ${sizeML}ml não disponível para este perfume`);
    }

    // Buscar preços dinâmicos
    const { data: dynamicPrices } = await supabase
      .from('perfume_prices')
      .select('size_ml, price')
      .eq('perfume_id', perfumeId);
    
    // Criar objeto de preços dinâmicos
    const pricesMap: Record<number, number> = {};
    dynamicPrices?.forEach(dp => {
      pricesMap[dp.size_ml] = dp.price;
    });

    const newItems = [...items];
    const existingItemIndex = newItems.findIndex(
      item => item.perfume.id === perfumeId && item.size === sizeML
    );

    const formattedPerfume: Perfume & { dynamicPrices: Record<number, number> } = {
      ...perfume,
      gender: perfume.gender as 'masculino' | 'feminino' | 'unissex',
      size_ml: availableSizes.length > 0 ? availableSizes : [],
      stock_full: 0,
      stock_5ml: 0,
      stock_10ml: 0,
      available_sizes: availableSizes,
      dynamicPrices: pricesMap
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
      // ✅ VALIDAR ESTOQUE DISPONÍVEL antes de atualizar quantidade (excluindo reserva do próprio usuário)
      const { data: availability, error: availError } = await supabase.rpc('check_perfume_availability', {
        perfume_uuid: perfumeId,
        size_ml_param: sizeML,
        quantity_requested: quantity,
        user_uuid: user?.id || null
      });
      
      if (availError || !availability || availability.length === 0) {
        throw new Error('Erro ao verificar disponibilidade do produto');
      }
      
      const stockInfo = availability[0];
      if (!stockInfo.available) {
        toast({
          title: "Estoque insuficiente",
          description: `Disponível apenas ${stockInfo.max_quantity} unidade(s) de ${sizeML}ml (${stockInfo.stock_ml}ml em estoque total)`,
          variant: "destructive",
        });
        setLoading(false);
        return; // Não atualizar se não houver estoque
      }
      
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
      console.error('Error clearing cart:', error);
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
      console.error('Error calculating packaging costs:', error);
    }
  };

  const getTotal = async () => {
    let itemsTotal = 0;
    
    for (const item of items) {
      // Tentar usar preços dinâmicos primeiro
      const perfumeWithDynamic = item.perfume as Perfume & { dynamicPrices?: Record<number, number> };
      let price = 0;
      
      // Se tem preços dinâmicos, usar eles
      if (perfumeWithDynamic.dynamicPrices && perfumeWithDynamic.dynamicPrices[item.size]) {
        price = perfumeWithDynamic.dynamicPrices[item.size];
      } else {
        // Fallback para preços hardcoded
        if (item.size === 2) price = item.perfume.price_2ml || 0;
        else if (item.size === 5) price = item.perfume.price_5ml || 0;
        else if (item.size === 10) price = item.perfume.price_10ml || 0;
        else price = item.perfume.price_full || 0; // Para outros tamanhos como fallback
      }
      
      // Verificar se há promoção ativa para este perfume
      try {
        const { data: promotion } = await supabase
          .rpc('get_active_promotion', { perfume_uuid: item.perfume.id });
        
        if (promotion && promotion.length > 0) {
          const activePromotion = promotion[0];
          
          // Aplicar preço promocional se disponível para este tamanho
          if (item.size === 5 && activePromotion.promotional_price_5ml) {
            price = activePromotion.promotional_price_5ml;
          } else if (item.size === 10 && activePromotion.promotional_price_10ml) {
            price = activePromotion.promotional_price_10ml;
          } else if (activePromotion.promotional_price_full && item.size !== 5 && item.size !== 10) {
            price = activePromotion.promotional_price_full;
          }
        }
      } catch (error) {
        console.error('Error checking promotion for item:', error);
      }
      
      itemsTotal += price * item.quantity;
    }
    
    const packagingTotal = packagingCosts?.total_packaging_cost || 0;
    return itemsTotal + packagingTotal;
  };

  const getItemPrice = async (perfumeId: string, size: number) => {
    // Encontrar o item no carrinho
    const item = items.find(i => i.perfume.id === perfumeId);
    if (!item) return 0;
    
    // Tentar usar preços dinâmicos primeiro
    const perfumeWithDynamic = item.perfume as Perfume & { dynamicPrices?: Record<number, number> };
    let price = 0;
    
    // Se tem preços dinâmicos, usar eles
    if (perfumeWithDynamic.dynamicPrices && perfumeWithDynamic.dynamicPrices[size]) {
      price = perfumeWithDynamic.dynamicPrices[size];
    } else {
      // Fallback para preços hardcoded
      if (size === 2) price = item.perfume.price_2ml || 0;
      else if (size === 5) price = item.perfume.price_5ml || 0;
      else if (size === 10) price = item.perfume.price_10ml || 0;
      else price = item.perfume.price_full || 0;
    }
    
    // Verificar se há promoção ativa para este perfume
    try {
      const { data: promotion } = await supabase
        .rpc('get_active_promotion', { perfume_uuid: perfumeId });
      
      if (promotion && promotion.length > 0) {
        const activePromotion = promotion[0];
        
        // Aplicar preço promocional se disponível para este tamanho
        if (size === 5 && activePromotion.promotional_price_5ml) {
          price = activePromotion.promotional_price_5ml;
        } else if (size === 10 && activePromotion.promotional_price_10ml) {
          price = activePromotion.promotional_price_10ml;
        } else if (activePromotion.promotional_price_full && size !== 5 && size !== 10) {
          price = activePromotion.promotional_price_full;
        }
      }
    } catch (error) {
      console.error('Error checking promotion for item:', error);
    }
    
    return price;
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
