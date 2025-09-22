
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContextOptimized';
import { useActivePromotionByPerfume } from '@/hooks/usePromotions';

const Carrinho = () => {
  const { items, updateQuantity, removeItem, getTotal, clearCart, loading, getItemPrice } = useCart();
  const [subtotal, setSubtotal] = useState(0);

  useEffect(() => {
    const calculateSubtotal = async () => {
      const total = await getTotal();
      setSubtotal(total);
    };
    
    if (items.length > 0) {
      calculateSubtotal();
    }
  }, [items, getTotal]);

  const shipping = subtotal >= 299 ? 0 : 15.90;
  const total = subtotal + shipping;
  const pointsToEarn = Math.floor(total);

  const formatPrice = (price: number) => 
    `R$ ${price.toFixed(2).replace('.', ',')}`;

// Componente para mostrar preço com possível promoção
const ItemPriceDisplay = ({ perfume, size, quantity }: { perfume: any; size: number; quantity: number }) => {
  const { data: promotion } = useActivePromotionByPerfume(perfume.id);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const { getItemPrice } = useCart();

  useEffect(() => {
    const calculatePrices = async () => {
      // Preço original (sem promoção)
      let basePrice = 0;
      if (perfume.dynamicPrices && perfume.dynamicPrices[size]) {
        basePrice = perfume.dynamicPrices[size];
      } else {
        switch (size) {
          case 2: basePrice = perfume.price_2ml || 0; break;
          case 5: basePrice = perfume.price_5ml || 0; break;
          case 10: basePrice = perfume.price_10ml || 0; break;
          default: basePrice = perfume.price_full || 0; break;
        }
      }
      
      // Preço atual (com promoção se houver)
      const itemPrice = await getItemPrice(perfume.id, size);
      
      setOriginalPrice(basePrice);
      setCurrentPrice(itemPrice);
    };
    
    calculatePrices();
  }, [perfume, size, getItemPrice, promotion]);

  const hasDiscount = promotion && currentPrice < originalPrice;

  return (
    <div className="text-right">
      <div className="font-bold text-lg">
        {formatPrice(currentPrice * quantity)}
      </div>
      <div className="text-sm">
        {hasDiscount ? (
          <div className="space-y-1">
            <div className="text-muted-foreground line-through">
              {formatPrice(originalPrice)} cada
            </div>
            <div className="text-green-600 font-medium">
              {formatPrice(currentPrice)} cada
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">
            {formatPrice(currentPrice)} cada
          </div>
        )}
      </div>
    </div>
  );
};

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="font-playfair text-3xl font-bold mb-8">Carrinho de Compras</h1>
          
          <div className="text-center py-16 bg-white rounded-lg">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-playfair text-2xl font-semibold mb-2">
              Seu carrinho está vazio
            </h2>
            <p className="text-muted-foreground mb-6">
              Que tal descobrir algumas fragrâncias incríveis?
            </p>
            <div className="space-x-4">
              <Button asChild className="gradient-gold text-white hover:opacity-90">
                <Link to="/curadoria">
                  Começar Curadoria
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/catalogo">
                  Ver Catálogo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-playfair text-3xl font-bold">Carrinho de Compras</h1>
          <Button 
            variant="outline" 
            onClick={clearCart}
            className="text-red-600 hover:text-red-700"
            disabled={loading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Carrinho
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={`${item.perfume.id}-${item.size}`} className="perfume-card">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Product Image */}
                    <div className="w-full md:w-32 h-48 md:h-32 flex-shrink-0">
                      <img
                        src={item.perfume.image_url || '/placeholder.svg'}
                        alt={item.perfume.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-muted-foreground">{item.perfume.brand}</p>
                          <h3 className="font-playfair font-semibold text-lg">
                            {item.perfume.name}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary">{item.size}ml</Badge>
                            <Badge 
                              variant="secondary"
                              className={`
                                ${item.perfume.gender === 'masculino' ? 'bg-blue-100 text-blue-800' : ''}
                                ${item.perfume.gender === 'feminino' ? 'bg-pink-100 text-pink-800' : ''}
                                ${item.perfume.gender === 'unissex' ? 'bg-purple-100 text-purple-800' : ''}
                              `}
                            >
                              {item.perfume.gender}
                            </Badge>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.perfume.id, item.size)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Quantity and Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.perfume.id, item.size, item.quantity - 1)}
                            disabled={item.quantity <= 1 || loading}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.perfume.id, item.size, item.quantity + 1)}
                            disabled={loading}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <ItemPriceDisplay 
                          perfume={item.perfume} 
                          size={item.size} 
                          quantity={item.quantity}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="perfume-card">
              <CardHeader>
                <CardTitle className="font-playfair">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Frete</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'Grátis' : formatPrice(shipping)}
                  </span>
                </div>

                {shipping > 0 && subtotal < 299 && (
                  <p className="text-sm text-muted-foreground bg-gold-50 p-3 rounded-lg">
                    💡 Falta apenas {formatPrice(299 - subtotal)} para frete grátis!
                  </p>
                )}

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Pontos a ganhar</span>
                  <span>{pointsToEarn} pontos</span>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <Button 
                  asChild
                  className="w-full gradient-gold text-white hover:opacity-90"
                  size="lg"
                  disabled={loading}
                >
                  <Link to="/checkout">
                    Finalizar Compra
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>ou até 12x de {formatPrice(total / 12)} sem juros</p>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card className="perfume-card">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold mb-3">Vantagens da Paris & Co</h3>
                
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Garantia "Amou ou Troca" (7 dias)</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Ganhe 1 ponto a cada R$ 1</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Entrega rápida e segura</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Atendimento especializado</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/catalogo">
              Continuar Comprando
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Carrinho;
