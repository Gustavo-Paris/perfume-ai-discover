import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Save, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CompanyData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  inscricao_estadual: string;
  inscricao_municipal: string;
  endereco_completo: string;
  cep: string;
  cidade: string;
  estado: string;
  telefone: string;
  email_contato: string;
  email_sac: string;
  responsavel_tecnico: string;
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
    endereco_completo: '',
    cep: '',
    cidade: '',
    estado: '',
    telefone: '',
    email_contato: '',
    email_sac: '',
    responsavel_tecnico: '',
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
        .from('company_info')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCompanyData(data as CompanyData);
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
            .from('company_info')
            .update(companyData)
            .eq('cnpj', companyData.cnpj)
        : await supabase
            .from('company_info')
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
      'cnpj', 'razao_social', 'nome_fantasia', 'endereco_completo',
      'cep', 'cidade', 'estado', 'telefone', 'email_contato'
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
                <Label htmlFor="email_contato">Email de Contato *</Label>
                <Input
                  id="email_contato"
                  type="email"
                  value={companyData.email_contato}
                  onChange={(e) => setCompanyData({ ...companyData, email_contato: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email_sac">Email SAC</Label>
              <Input
                id="email_sac"
                type="email"
                value={companyData.email_sac}
                onChange={(e) => setCompanyData({ ...companyData, email_sac: e.target.value })}
              />
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
            <div>
              <Label htmlFor="endereco_completo">Endereço Completo *</Label>
              <Textarea
                id="endereco_completo"
                value={companyData.endereco_completo}
                onChange={(e) => setCompanyData({ ...companyData, endereco_completo: e.target.value })}
                placeholder="Rua, Número, Complemento, Bairro"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  value={companyData.cep}
                  onChange={(e) => setCompanyData({ ...companyData, cep: e.target.value })}
                  placeholder="00000-000"
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  value={companyData.estado}
                  onChange={(e) => setCompanyData({ ...companyData, estado: e.target.value })}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={companyData.cidade}
                onChange={(e) => setCompanyData({ ...companyData, cidade: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
              <Input
                id="inscricao_municipal"
                value={companyData.inscricao_municipal}
                onChange={(e) => setCompanyData({ ...companyData, inscricao_municipal: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="responsavel_tecnico">Responsável Técnico</Label>
              <Input
                id="responsavel_tecnico"
                value={companyData.responsavel_tecnico}
                onChange={(e) => setCompanyData({ ...companyData, responsavel_tecnico: e.target.value })}
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