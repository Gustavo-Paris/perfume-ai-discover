import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAffiliates } from '@/hooks/useAffiliates';
import { useAuth } from '@/contexts/AuthContext';
import { Copy, ExternalLink, TrendingUp, DollarSign, Users, UserX, Crown, Share2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function Afiliados() {
  const { user } = useAuth();
  const {
    affiliate,
    referrals,
    loading,
    loadAffiliateData,
    generateAffiliateLink
  } = useAffiliates();

  const [copied, setCopied] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    }
  }, [user, loadAffiliateData]);

  const copyLink = (path: string = '') => {
    const link = generateAffiliateLink(path);
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

    copyLink(path);
    setCustomUrl('');
  };

  // Se não está logado
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <UserX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Você precisa estar logado para acessar esta área.
            </p>
            <Button asChild>
              <Link to="/auth">Fazer Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se está logado mas não é afiliado
  if (!loading && !affiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Crown className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Programa de Afiliados</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Você não possui permissão de afiliado. Entre em contato conosco para mais informações sobre o programa de parceria.
            </p>
            <Button variant="outline" asChild>
              <Link to="/">Voltar ao Início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <div className="text-muted-foreground">
            Código: <Badge variant="secondary">{affiliate?.affiliate_code}</Badge>
          </div>
        </motion.div>

        {/* Estatísticas */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                R$ {affiliate?.total_earnings?.toFixed(2) || '0.00'}
              </div>
              <p className="text-sm text-muted-foreground">Total Ganho</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {affiliate?.total_referrals || 0}
              </div>
              <p className="text-sm text-muted-foreground">Vendas Realizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {((affiliate?.commission_rate || 0) * 100).toFixed(0)}%
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
                      value={generateAffiliateLink()}
                      readOnly
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => copyLink()}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Links específicos */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Links Específicos</label>
                  <div className="grid gap-2">
                    <div className="flex gap-2">
                      <Input 
                        value={generateAffiliateLink('/catalogo')}
                        readOnly
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => copyLink('/catalogo')}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        value={generateAffiliateLink('/curadoria')}
                        readOnly
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => copyLink('/curadoria')}
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
                            Pedido #{referral.order_id || 'N/A'}
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
                      <Share2 className="h-4 w-4" />
                      Materiais de Marketing
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• Use hashtags relevantes: #perfumes #fragrancia #beleza</p>
                      <p>• Compartilhe sua experiência pessoal com os produtos</p>
                      <p>• Destaque ofertas e lançamentos</p>
                      <p>• Crie conteúdo visual atrativo</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Dicas de Sucesso
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• Seja autêntico e transparente</p>
                      <p>• Teste os produtos que recomenda</p>
                      <p>• Engage com sua audiência</p>
                      <p>• Monitore suas estatísticas regularmente</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Calculadora de Comissão</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Valor do Pedido (R$)</label>
                      <Input 
                        type="number" 
                        placeholder="0,00"
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const commission = value * (affiliate?.commission_rate || 0.05);
                          // Você pode adicionar estado para mostrar o resultado
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Sua Comissão</label>
                      <div className="p-3 bg-muted rounded-md text-lg font-medium">
                        R$ 0,00
                      </div>
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
}