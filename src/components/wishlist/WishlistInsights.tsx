import { TrendingUp, Heart, BarChart3, Palette, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useWishlist } from '@/hooks/useWishlist';

interface InsightData {
  totalFavorites: number;
  favoriteFamily: string;
  favoriteGender: string;
  averagePrice: number;
  recentlyAdded: number;
  topNotes: string[];
}

export function WishlistInsights() {
  const { data: wishlistItems = [] } = useWishlist();

  const insights: InsightData = {
    totalFavorites: wishlistItems.length,
    favoriteFamily: '',
    favoriteGender: '',
    averagePrice: 0,
    recentlyAdded: 0,
    topNotes: []
  };

  if (wishlistItems.length > 0) {
    // Calcular família favorita
    const familyCount = new Map<string, number>();
    const genderCount = new Map<string, number>();
    const allNotes = new Map<string, number>();
    let totalPrice = 0;
    let priceCount = 0;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    wishlistItems.forEach(item => {
      // Família
      const family = item.perfume.family;
      familyCount.set(family, (familyCount.get(family) || 0) + 1);
      
      // Gênero
      const gender = item.perfume.gender;
      genderCount.set(gender, (genderCount.get(gender) || 0) + 1);
      
      // Preço médio
      const minPrice = Math.min(
        ...[item.perfume.price_5ml, item.perfume.price_10ml, item.perfume.price_full].filter(Boolean)
      );
      if (minPrice) {
        totalPrice += minPrice;
        priceCount++;
      }
      
      // Recentemente adicionados
      if (new Date(item.created_at) > weekAgo) {
        insights.recentlyAdded++;
      }
      
      // Notas mais comuns
      [...(item.perfume.top_notes || []), ...(item.perfume.heart_notes || []), ...(item.perfume.base_notes || [])].forEach(note => {
        allNotes.set(note, (allNotes.get(note) || 0) + 1);
      });
    });
    
    insights.favoriteFamily = Array.from(familyCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    insights.favoriteGender = Array.from(genderCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    insights.averagePrice = priceCount > 0 ? totalPrice / priceCount : 0;
    insights.topNotes = Array.from(allNotes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([note]) => note);
  }

  if (wishlistItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Sem insights ainda</h3>
          <p className="text-muted-foreground">
            Adicione perfumes aos favoritos para ver insights sobre suas preferências!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Favoritos</CardTitle>
          <Heart className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{insights.totalFavorites}</div>
          {insights.recentlyAdded > 0 && (
            <p className="text-xs text-muted-foreground">
              +{insights.recentlyAdded} esta semana
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Família Favorita</CardTitle>
          <Palette className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{insights.favoriteFamily}</div>
          <p className="text-xs text-muted-foreground">
            Gênero: {insights.favoriteGender}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {insights.averagePrice.toFixed(0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Por unidade menor
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Notas Favoritas</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.topNotes.slice(0, 3).map((note, index) => (
              <div key={note} className="flex items-center justify-between">
                <span className="text-sm">{note}</span>
                <Progress value={100 - (index * 25)} className="w-16 h-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}