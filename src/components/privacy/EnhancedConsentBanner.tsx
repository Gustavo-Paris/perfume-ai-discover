import { useState, useEffect } from 'react';
import { X, Info, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePrivacyConsent } from '@/hooks/usePrivacyConsent';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
}

const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'essential',
    name: 'Cookies Essenciais',
    description: 'Necessários para o funcionamento básico do site (carrinho, login, etc.)',
    required: true,
    enabled: true
  },
  {
    id: 'analytics',
    name: 'Cookies de Analytics',
    description: 'Ajudam a entender como você usa o site para melhorarmos a experiência',
    required: false,
    enabled: false
  },
  {
    id: 'marketing',
    name: 'Cookies de Marketing',
    description: 'Personalizam anúncios e ofertas baseadas nos seus interesses',
    required: false,
    enabled: false
  },
  {
    id: 'personalization',
    name: 'Cookies de Personalização',
    description: 'Lembram suas preferências para uma experiência personalizada',
    required: false,
    enabled: false
  }
];

interface EnhancedConsentBannerProps {
  onAccept?: () => void;
  onReject?: () => void;
}

export default function EnhancedConsentBanner({ onAccept, onReject }: EnhancedConsentBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState(COOKIE_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const { hasConsent } = usePrivacyConsent('PRIVACY_CHAT');
  const { toast } = useToast();

  // Se já tem consentimento, não mostrar o banner
  if (hasConsent) {
    return null;
  }

  const updateCategory = (categoryId: string, enabled: boolean) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, enabled } : cat
      )
    );
  };

  const handleAcceptAll = async () => {
    setLoading(true);
    try {
      await recordConsent(categories.map(cat => ({ ...cat, enabled: true })));
      onAccept?.();
    } catch (error) {
      console.error('Error accepting consent:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar suas preferências.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSelected = async () => {
    setLoading(true);
    try {
      await recordConsent(categories);
      onAccept?.();
    } catch (error) {
      console.error('Error saving consent preferences:', error);
      toast({
        title: "Erro", 
        description: "Não foi possível salvar suas preferências.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  const handleRejectAll = async () => {
    setLoading(true);
    try {
      const essentialOnly = categories.map(cat => ({
        ...cat, 
        enabled: cat.required
      }));
      await recordConsent(essentialOnly);
      onReject?.();
    } catch (error) {
      console.error('Error rejecting consent:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar sua escolha.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const recordConsent = async (selectedCategories: CookieCategory[]) => {
    const { data: user } = await supabase.auth.getUser();
    
    // Build cookie categories object
    const cookieCategories = selectedCategories.reduce((acc, cat) => {
      acc[cat.id] = cat.enabled;
      return acc;
    }, {} as Record<string, boolean>);

    // Only record consent in database for authenticated users (RLS compliance)
    if (user.user?.id) {
      const { error } = await supabase
        .from('privacy_consents')
        .insert({
          user_id: user.user.id,
          consent_type: 'PRIVACY_CHAT',
          consented: true,
          cookie_categories: cookieCategories,
          browser_fingerprint: navigator.userAgent,
          legal_basis: 'consent',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;
    } else {
      // For anonymous users, skip database recording but continue with cookie setting
      console.log('Skipping database consent recording for anonymous user - using cookies only');
    }

    // Set cookies for frontend use (works for both authenticated and anonymous users)
    selectedCategories.forEach(cat => {
      if (cat.enabled) {
        document.cookie = `${cat.id}_consent=true; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      }
    });
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in">
        <Card className="mx-auto max-w-5xl bg-white/95 backdrop-blur-lg border border-gray-200 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-primary mt-1" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-2">
                  Seus dados e privacidade são importantes para nós
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Usamos cookies para melhorar sua experiência, analisar o tráfego do site e personalizar conteúdo. 
                  Você pode escolher quais cookies aceitar.
                </p>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    onClick={handleAcceptAll}
                    disabled={loading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {loading ? 'Processando...' : 'Aceitar Todos'}
                  </Button>
                  
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="outline"
                    disabled={loading}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar Preferências
                  </Button>
                  
                  <Button
                    onClick={handleRejectAll}
                    variant="ghost"
                    disabled={loading}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Apenas Essenciais
                  </Button>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  Ao continuar navegando, você aceita nossos{' '}
                  <a href="/termos-uso" className="text-primary hover:underline">Termos de Uso</a> e{' '}
                  <a href="/privacidade" className="text-primary hover:underline">Política de Privacidade</a>.
                </p>
              </div>
              
              <Button
                onClick={handleRejectAll}
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-8 w-8"
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preferences Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Gerenciar Preferências de Cookies
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                Sobre os Cookies
              </h4>
              <p className="text-blue-800 text-sm">
                Os cookies nos ajudam a fornecer, proteger e melhorar nossos serviços. 
                Você pode escolher quais categorias aceitar.
              </p>
            </div>

            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={category.id}
                      checked={category.enabled}
                      onCheckedChange={(checked) => 
                        !category.required && updateCategory(category.id, checked as boolean)
                      }
                      disabled={category.required}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor={category.id} className="font-semibold cursor-pointer">
                        {category.name}
                        {category.required && (
                          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            Obrigatório
                          </span>
                        )}
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleAcceptSelected}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}