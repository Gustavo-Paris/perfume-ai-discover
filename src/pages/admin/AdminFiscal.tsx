import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Building, FileText, Package, Settings, Download, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { CompanySettings, ProductFiscalData, FiscalNote } from '@/types/fiscal';

const AdminFiscal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [productsFiscalData, setProductsFiscalData] = useState<ProductFiscalData[]>([]);
  const [fiscalNotes, setFiscalNotes] = useState<FiscalNote[]>([]);

  const [companyForm, setCompanyForm] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    inscricao_estadual: '',
    endereco_logradouro: '',
    endereco_numero: '',
    endereco_complemento: '',
    endereco_bairro: '',
    endereco_cep: '',
    endereco_cidade: '',
    endereco_uf: '',
    endereco_codigo_municipio: '',
    telefone: '',
    email: '',
    regime_tributario: 'simples_nacional',
    ambiente_nfe: 'homologacao',
    focus_nfe_token: ''
  });

  useEffect(() => {
    loadCompanySettings();
    loadProductsFiscalData();
    loadFiscalNotes();
  }, []);

  const loadCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setCompanySettings(data);
        setCompanyForm({
          cnpj: data.cnpj || '',
          razao_social: data.razao_social || '',
          nome_fantasia: data.nome_fantasia || '',
          inscricao_estadual: data.inscricao_estadual || '',
          endereco_logradouro: data.endereco_logradouro || '',
          endereco_numero: data.endereco_numero || '',
          endereco_complemento: data.endereco_complemento || '',
          endereco_bairro: data.endereco_bairro || '',
          endereco_cep: data.endereco_cep || '',
          endereco_cidade: data.endereco_cidade || '',
          endereco_uf: data.endereco_uf || '',
          endereco_codigo_municipio: data.endereco_codigo_municipio || '',
          telefone: data.telefone || '',
          email: data.email || '',
          regime_tributario: data.regime_tributario || 'simples_nacional',
          ambiente_nfe: data.ambiente_nfe || 'homologacao',
          focus_nfe_token: data.focus_nfe_token || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const loadProductsFiscalData = async () => {
    try {
      const { data, error } = await supabase
        .from('product_fiscal_data')
        .select(`
          *,
          perfume:perfumes (
            id,
            name,
            brand
          )
        `);

      if (error) {
        console.error('Erro ao carregar dados fiscais dos produtos:', error);
        return;
      }

      setProductsFiscalData(data || []);
    } catch (error) {
      console.error('Erro ao carregar dados fiscais:', error);
    }
  };

  const loadFiscalNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('fiscal_notes')
        .select(`
          *,
          order:orders (
            order_number,
            user_id,
            address_data
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar notas fiscais:', error);
        return;
      }

      setFiscalNotes(data || []);
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error);
    }
  };

  const saveCompanySettings = async () => {
    if (!companyForm.cnpj || !companyForm.razao_social || !companyForm.email) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('company_settings')
        .upsert(companyForm);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações da empresa salvas com sucesso"
      });

      loadCompanySettings();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro", 
        description: "Erro ao salvar configurações da empresa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNFE = async (orderId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-nfe', {
        body: { order_id: orderId }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "NF-e gerada com sucesso"
      });

      loadFiscalNotes();
    } catch (error: any) {
      console.error('Erro ao gerar NF-e:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar NF-e",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      authorized: 'default',
      rejected: 'destructive',
      cancelled: 'outline'
    } as const;

    const labels = {
      pending: 'Pendente',
      authorized: 'Autorizada',
      rejected: 'Rejeitada',  
      cancelled: 'Cancelada'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Sistema Fiscal - NF-e</h1>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">
            <Building className="h-4 w-4 mr-2" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-2" />
            Notas Fiscais
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>
                Configure os dados da sua empresa para emissão de NF-e
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={companyForm.cnpj}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="razao_social">Razão Social *</Label>
                  <Input
                    id="razao_social"
                    value={companyForm.razao_social}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, razao_social: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                  <Input
                    id="nome_fantasia"
                    value={companyForm.nome_fantasia}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, nome_fantasia: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                  <Input
                    id="inscricao_estadual"
                    value={companyForm.inscricao_estadual}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, inscricao_estadual: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endereco_logradouro">Endereço *</Label>
                  <Input
                    id="endereco_logradouro"
                    value={companyForm.endereco_logradouro}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, endereco_logradouro: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endereco_numero">Número *</Label>
                  <Input
                    id="endereco_numero"
                    value={companyForm.endereco_numero}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, endereco_numero: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endereco_bairro">Bairro *</Label>
                  <Input
                    id="endereco_bairro"
                    value={companyForm.endereco_bairro}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, endereco_bairro: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endereco_cep">CEP *</Label>
                  <Input
                    id="endereco_cep"
                    value={companyForm.endereco_cep}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, endereco_cep: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>
                <div>
                  <Label htmlFor="endereco_cidade">Cidade *</Label>
                  <Input
                    id="endereco_cidade"
                    value={companyForm.endereco_cidade}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, endereco_cidade: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endereco_uf">UF *</Label>
                  <Input
                    id="endereco_uf"
                    value={companyForm.endereco_uf}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, endereco_uf: e.target.value }))}
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="endereco_codigo_municipio">Código Município *</Label>
                  <Input
                    id="endereco_codigo_municipio"
                    value={companyForm.endereco_codigo_municipio}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, endereco_codigo_municipio: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              
              <Button onClick={saveCompanySettings} disabled={loading} className="w-full">
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Fiscais dos Produtos</CardTitle>
              <CardDescription>
                Configure NCM, CFOP e tributação dos produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productsFiscalData.map((product) => (
                  <div key={product.id} className="border rounded p-4">
                    <h4 className="font-semibold mb-2">
                      {(product as any).perfume?.brand} - {(product as any).perfume?.name}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>NCM</Label>
                        <Input value={product.ncm} readOnly />
                      </div>
                      <div>
                        <Label>CFOP</Label>
                        <Input value={product.cfop} readOnly />
                      </div>
                      <div>
                        <Label>Origem</Label>
                        <Input value={product.origem_mercadoria} readOnly />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais Emitidas</CardTitle>
              <CardDescription>
                Visualize e gerencie as notas fiscais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fiscalNotes.map((note) => (
                  <div key={note.id} className="border rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">
                          NF-e #{note.numero} - Série {note.serie}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Pedido: {(note as any).order?.order_number}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Valor: R$ {note.valor_total.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(note.status)}
                        {note.pdf_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={note.pdf_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {note.chave_acesso && (
                      <p className="text-xs font-mono bg-muted p-2 rounded">
                        Chave: {note.chave_acesso}
                      </p>
                    )}
                    
                    {note.erro_message && (
                      <p className="text-sm text-destructive mt-2">
                        Erro: {note.erro_message}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Emitida em: {new Date(note.data_emissao).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
                
                {fiscalNotes.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma nota fiscal encontrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Focus NFe</CardTitle>
              <CardDescription>
                Configure a integração com o provedor de NF-e
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="focus_nfe_token">Token Focus NFe</Label>
                <Input
                  id="focus_nfe_token"
                  type="password"
                  value={companyForm.focus_nfe_token}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, focus_nfe_token: e.target.value }))}
                  placeholder="Insira seu token da Focus NFe"
                />
              </div>
              
              <div>
                <Label htmlFor="ambiente_nfe">Ambiente</Label>
                <Select
                  value={companyForm.ambiente_nfe}
                  onValueChange={(value) => 
                    setCompanyForm(prev => ({ ...prev, ambiente_nfe: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homologacao">Homologação</SelectItem>
                    <SelectItem value="producao">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={saveCompanySettings} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFiscal;