import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Share2, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Copy, 
  CheckCircle, 
  ExternalLink,
  Calculator,
  Gift,
  Crown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface AffiliateData {
  id: string;
  affiliate_code: string;
  commission_rate: number;
  status: string;
  total_earnings: number;
  total_referrals: number;
  created_at: string;
}

interface AffiliateReferral {
  id: string;
  commission_amount: number;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  orders?: {
    order_number: string;
    total_amount: number;
  } | null;
}

const Afiliados = () => {
  const { user } = useAuth();
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    }
  }, [user]);

  const loadAffiliateData = async () => {
    try {
      // Buscar dados do afiliado
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (affiliateError && affiliateError.code !== 'PGRST116') {
        throw affiliateError;
      }

      setAffiliateData(affiliate);

      // Se for afiliado, buscar referências
      if (affiliate) {
        const { data: referralData, error: referralError } = await supabase
          .from('affiliate_referrals')
          .select(`
            *,
            orders:order_id (order_number, total_amount)
          `)
          .eq('affiliate_id', affiliate.id)
          .order('created_at', { ascending: false });

        if (referralError) {
          console.error('Error loading referrals:', referralError);
        } else {
          setReferrals(referralData || []);
        }
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do programa de afiliados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyToProgram = async () => {
    if (!user) return;

    setIsApplying(true);
    try {
      // Gerar código de afiliado único
      const { data: affiliateCode, error: codeError } = await supabase
        .rpc('generate_affiliate_code', { user_name: user.user_metadata?.name });

      if (codeError) throw codeError;

      // Criar registro de afiliado
      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          affiliate_code: affiliateCode,
          commission_rate: 0.05, // 5% padrão
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setAffiliateData(data);
      toast({
        title: "Parabéns! 🎉",
        description: "Você agora faz parte do nosso programa de afiliados!",
      });
    } catch (error) {
      console.error('Error applying to program:', error);
      toast({
        title: "Erro",
        description: "Erro ao se inscrever no programa de afiliados",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };

  const copyAffiliateLink = (path: string = '') => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}${path}?ref=${affiliateData?.affiliate_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copiado!",
      description: "Link de afiliado copiado para a área de transferência",
    });
  };

  const generateCustomLink = () => {
    if (!customUrl.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma URL para gerar o link",
        variant: "destructive"
      });
      return;
    }

    let path = customUrl;
    if (path.includes(window.location.origin)) {
      path = path.replace(window.location.origin, '');
    }
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    copyAffiliateLink(path);
    setCustomUrl('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-3xl font-bold mb-4">Programa de Afiliados</h1>
          <p className="text-muted-foreground mb-8">
            Faça login para acessar o programa de afiliados
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  // Se não é afiliado ainda
  if (!affiliateData) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Crown className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Programa de Afiliados</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ganhe dinheiro compartilhando os perfumes que você ama. 
              Receba <strong className="text-primary">5% de comissão</strong> em cada venda!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="text-center h-full">
                <CardContent className="p-6">
                  <DollarSign className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">5% de Comissão</h3>
                  <p className="text-muted-foreground">
                    Ganhe 5% do valor de cada pedido feito através dos seus links
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="text-center h-full">
                <CardContent className="p-6">
                  <Share2 className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">Fácil de Compartilhar</h3>
                  <p className="text-muted-foreground">
                    Links personalizados para redes sociais, blog ou onde quiser
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="text-center h-full">
                <CardContent className="p-6">
                  <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">Acompanhe Resultados</h3>
                  <p className="text-muted-foreground">
                    Dashboard completo para acompanhar suas vendas e ganhos
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              onClick={applyToProgram} 
              disabled={isApplying}
              size="lg"
              className="px-8"
            >
              {isApplying ? 'Processando...' : 'Quero Ser Afiliado'}
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Gratuito e sem compromisso. Comece a ganhar hoje mesmo!
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Dashboard do afiliado
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">Dashboard de Afiliado</h1>
          <p className="text-muted-foreground">
            Código: <Badge variant="secondary">{affiliateData.affiliate_code}</Badge>
          </p>
        </motion.div>

        {/* Estatísticas */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                R$ {affiliateData.total_earnings.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Total Ganho</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {affiliateData.total_referrals}
              </div>
              <p className="text-sm text-muted-foreground">Vendas Realizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {(affiliateData.commission_rate * 100).toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground">Taxa de Comissão</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="links" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="links">Meus Links</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="tools">Ferramentas</TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Links de Afiliado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Link principal */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Link Principal</label>
                  <div className="flex gap-2">
                    <Input 
                      value={`${window.location.origin}?ref=${affiliateData.affiliate_code}`}
                      readOnly
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => copyAffiliateLink()}
                      variant="outline"
                      size="sm"
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Links específicos */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Links Específicos</label>
                  <div className="grid gap-2">
                    <div className="flex gap-2">
                      <Input 
                        value={`${window.location.origin}/catalogo?ref=${affiliateData.affiliate_code}`}
                        readOnly
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => copyAffiliateLink('/catalogo')}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        value={`${window.location.origin}/curadoria?ref=${affiliateData.affiliate_code}`}
                        readOnly
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => copyAffiliateLink('/curadoria')}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Gerador de link customizado */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Criar Link Personalizado</label>
                  <div className="flex gap-2">
                    <Input 
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="Digite a URL (ex: /perfume/123)"
                      className="flex-1"
                    />
                    <Button onClick={generateCustomLink} variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                {referrals.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Nenhuma venda ainda</h3>
                    <p className="text-muted-foreground text-sm">
                      Compartilhe seus links para começar a ganhar comissões!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {referrals.map((referral) => (
                      <div 
                        key={referral.id}
                        className="flex justify-between items-center p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            Pedido #{referral.orders?.order_number || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(referral.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            +R$ {referral.commission_amount.toFixed(2)}
                          </p>
                          <Badge 
                            variant={referral.status === 'confirmed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {referral.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ferramentas e Recursos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Calculadora de Comissão
                    </h3>
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-2">
                        Exemplo de ganhos:
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Venda de R$ 100:</span>
                          <span className="font-medium">R$ 5,00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Venda de R$ 500:</span>
                          <span className="font-medium">R$ 25,00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Venda de R$ 1.000:</span>
                          <span className="font-medium">R$ 50,00</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Materiais de Divulgação
                    </h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Imagens para Redes Sociais
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Textos Prontos
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Guia do Afiliado
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Afiliados;