import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Save, Upload, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CompanyData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  inscricao_estadual: string;
  inscricao_municipal: string;
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_complemento: string;
  endereco_bairro: string;
  endereco_cep: string;
  endereco_cidade: string;
  endereco_uf: string;
  endereco_codigo_municipio: string;
  telefone: string;
  email: string;
  regime_tributario: string;
  certificado_a1_base64: string;
  certificado_senha: string;
  ambiente_nfe: string;
  focus_nfe_token: string;
}

const AdminCompany = () => {
  const [companyData, setCompanyData] = useState<CompanyData>({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    inscricao_estadual: '',
    inscricao_municipal: '',
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
    certificado_a1_base64: '',
    certificado_senha: '',
    ambiente_nfe: 'homologacao',
    focus_nfe_token: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCompanyData(data);
        setHasData(true);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da empresa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = hasData
        ? await supabase
            .from('company_settings')
            .update(companyData)
        : await supabase
            .from('company_settings')
            .insert([companyData]);

      if (error) throw error;

      setHasData(true);
      toast({
        title: "Dados salvos",
        description: "Dados da empresa salvos com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados da empresa.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setCompanyData({
          ...companyData,
          certificado_a1_base64: base64.split(',')[1]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const isProductionReady = () => {
    const required = [
      'cnpj', 'razao_social', 'nome_fantasia', 'endereco_logradouro',
      'endereco_numero', 'endereco_bairro', 'endereco_cep', 'endereco_cidade',
      'endereco_uf', 'telefone', 'email'
    ];
    
    return required.every(field => companyData[field as keyof CompanyData]);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Dados da Empresa</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando dados...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dados da Empresa</h1>
          <p className="text-muted-foreground">
            Configure os dados da sua empresa para emissão de notas fiscais
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isProductionReady() ? "default" : "destructive"}>
            {isProductionReady() ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Pronto para Produção
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Dados Incompletos
              </>
            )}
          </Badge>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Dados'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados Básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Dados Básicos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={companyData.cnpj}
                  onChange={(e) => setCompanyData({ ...companyData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                <Input
                  id="inscricao_estadual"
                  value={companyData.inscricao_estadual}
                  onChange={(e) => setCompanyData({ ...companyData, inscricao_estadual: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="razao_social">Razão Social *</Label>
              <Input
                id="razao_social"
                value={companyData.razao_social}
                onChange={(e) => setCompanyData({ ...companyData, razao_social: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="nome_fantasia">Nome Fantasia *</Label>
              <Input
                id="nome_fantasia"
                value={companyData.nome_fantasia}
                onChange={(e) => setCompanyData({ ...companyData, nome_fantasia: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={companyData.telefone}
                  onChange={(e) => setCompanyData({ ...companyData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={companyData.email}
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="regime_tributario">Regime Tributário</Label>
              <Select 
                value={companyData.regime_tributario} 
                onValueChange={(value) => setCompanyData({ ...companyData, regime_tributario: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                  <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="lucro_real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="endereco_logradouro">Logradouro *</Label>
                <Input
                  id="endereco_logradouro"
                  value={companyData.endereco_logradouro}
                  onChange={(e) => setCompanyData({ ...companyData, endereco_logradouro: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endereco_numero">Número *</Label>
                <Input
                  id="endereco_numero"
                  value={companyData.endereco_numero}
                  onChange={(e) => setCompanyData({ ...companyData, endereco_numero: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endereco_complemento">Complemento</Label>
              <Input
                id="endereco_complemento"
                value={companyData.endereco_complemento}
                onChange={(e) => setCompanyData({ ...companyData, endereco_complemento: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endereco_bairro">Bairro *</Label>
                <Input
                  id="endereco_bairro"
                  value={companyData.endereco_bairro}
                  onChange={(e) => setCompanyData({ ...companyData, endereco_bairro: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endereco_cep">CEP *</Label>
                <Input
                  id="endereco_cep"
                  value={companyData.endereco_cep}
                  onChange={(e) => setCompanyData({ ...companyData, endereco_cep: e.target.value })}
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endereco_cidade">Cidade *</Label>
                <Input
                  id="endereco_cidade"
                  value={companyData.endereco_cidade}
                  onChange={(e) => setCompanyData({ ...companyData, endereco_cidade: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endereco_uf">UF *</Label>
                <Input
                  id="endereco_uf"
                  value={companyData.endereco_uf}
                  onChange={(e) => setCompanyData({ ...companyData, endereco_uf: e.target.value })}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endereco_codigo_municipio">Código do Município</Label>
              <Input
                id="endereco_codigo_municipio"
                value={companyData.endereco_codigo_municipio}
                onChange={(e) => setCompanyData({ ...companyData, endereco_codigo_municipio: e.target.value })}
                placeholder="3550308"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações NFe */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações NFe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ambiente_nfe">Ambiente NFe</Label>
              <Select 
                value={companyData.ambiente_nfe} 
                onValueChange={(value) => setCompanyData({ ...companyData, ambiente_nfe: value })}
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
            <div>
              <Label htmlFor="focus_nfe_token">Focus NFe Token</Label>
              <Input
                id="focus_nfe_token"
                type="password"
                value={companyData.focus_nfe_token}
                onChange={(e) => setCompanyData({ ...companyData, focus_nfe_token: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="certificado_upload">Certificado A1</Label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                id="certificado_upload"
                accept=".p12,.pfx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('certificado_upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Carregar Certificado
              </Button>
              {companyData.certificado_a1_base64 && (
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Certificado carregado
                </Badge>
              )}
            </div>
          </div>

          {companyData.certificado_a1_base64 && (
            <div>
              <Label htmlFor="certificado_senha">Senha do Certificado</Label>
              <Input
                id="certificado_senha"
                type="password"
                value={companyData.certificado_senha}
                onChange={(e) => setCompanyData({ ...companyData, certificado_senha: e.target.value })}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCompany;