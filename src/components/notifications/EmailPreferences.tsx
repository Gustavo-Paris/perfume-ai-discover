import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Mail, Bell, ShoppingCart, Heart, AlertTriangle, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EmailPreference {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  category: 'transactional' | 'marketing' | 'notifications';
}

const EmailPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<EmailPreference[]>([
    {
      type: 'order_updates',
      label: 'Atualizações de Pedidos',
      description: 'Confirmação, pagamento aprovado, envio e entrega',
      icon: <ShoppingCart className="h-4 w-4" />,
      enabled: true,
      category: 'transactional'
    },
    {
      type: 'cart_recovery',
      label: 'Recuperação de Carrinho',
      description: 'Lembretes quando você deixa itens no carrinho',
      icon: <ShoppingCart className="h-4 w-4" />,
      enabled: true,
      category: 'marketing'
    },
    {
      type: 'wishlist_promotions',
      label: 'Promoções da Wishlist',
      description: 'Quando perfumes da sua wishlist entram em promoção',
      icon: <Heart className="h-4 w-4" />,
      enabled: true,
      category: 'marketing'
    },
    {
      type: 'review_notifications',
      label: 'Avaliações',
      description: 'Quando suas avaliações são aprovadas',
      icon: <Bell className="h-4 w-4" />,
      enabled: true,
      category: 'notifications'
    },
    {
      type: 'promotional_offers',
      label: 'Ofertas Promocionais',
      description: 'Descontos especiais e ofertas exclusivas',
      icon: <Gift className="h-4 w-4" />,
      enabled: true,
      category: 'marketing'
    },
    {
      type: 'stock_alerts',
      label: 'Alertas de Estoque',
      description: 'Quando perfumes em falta voltam ao estoque',
      icon: <AlertTriangle className="h-4 w-4" />,
      enabled: false,
      category: 'notifications'
    }
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('privacy_consents')
        .select('*')
        .eq('user_id', user?.id)
        .eq('consent_type', 'email_preferences');

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      if (data && data.length > 0) {
        const consent = data[0];
        const savedPrefs = (consent as any).metadata as Record<string, boolean> || {};
        setPreferences(prev => 
          prev.map(pref => ({
            ...pref,
            enabled: savedPrefs[pref.type] ?? pref.enabled
          }))
        );
      }
    } catch (error) {
      console.error('Error loading email preferences:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar preferências de email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const prefsObject = preferences.reduce((acc, pref) => {
        acc[pref.type] = pref.enabled;
        return acc;
      }, {} as Record<string, boolean>);

      const { error } = await supabase
        .from('privacy_consents')
        .upsert({
          user_id: user.id,
          consent_type: 'email_preferences',
          consented: true,
          metadata: prefsObject,
          expires_at: null // Preferências não expiram
        }, {
          onConflict: 'user_id,consent_type'
        });

      if (error) throw error;

      toast({
        title: "Preferências salvas",
        description: "Suas preferências de email foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving email preferences:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar preferências de email.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (type: string) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.type === type ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) {
      acc[pref.category] = [];
    }
    acc[pref.category].push(pref);
    return acc;
  }, {} as Record<string, EmailPreference[]>);

  const categoryLabels = {
    transactional: 'Emails Transacionais',
    marketing: 'Marketing e Promoções',
    notifications: 'Notificações'
  };

  const categoryDescriptions = {
    transactional: 'Emails essenciais sobre seus pedidos e conta (não podem ser desabilitados)',
    marketing: 'Ofertas especiais, promoções e recuperação de carrinho',
    notifications: 'Alertas e lembretes sobre produtos e atividades'
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando preferências...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Preferências de Email</h2>
        <p className="text-muted-foreground">
          Gerencie que tipos de email você deseja receber
        </p>
      </div>

      {Object.entries(groupedPreferences).map(([category, prefs]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                </p>
              </div>
              {category === 'transactional' && (
                <Badge variant="secondary">Obrigatório</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {prefs.map((pref, index) => (
              <div key={pref.type}>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1 text-muted-foreground">
                      {pref.icon}
                    </div>
                    <div className="flex-1">
                      <Label 
                        htmlFor={pref.type}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {pref.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pref.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={pref.type}
                    checked={pref.enabled}
                    onCheckedChange={() => togglePreference(pref.type)}
                    disabled={category === 'transactional'}
                  />
                </div>
                {index < prefs.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={loadPreferences}
          disabled={saving}
        >
          Restaurar
        </Button>
        <Button 
          onClick={savePreferences}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </Button>
      </div>

      <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Mail className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-900 dark:text-orange-100">
                Sobre Emails Transacionais
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Emails transacionais (confirmação de pedido, pagamento, envio) são essenciais 
                para o funcionamento da loja e não podem ser desabilitados. Eles contêm 
                informações importantes sobre suas compras.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailPreferences;