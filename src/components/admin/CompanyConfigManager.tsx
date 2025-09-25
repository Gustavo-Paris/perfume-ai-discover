import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building, Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CompanyInfo {
  id?: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  endereco_completo: string;
  cep: string;
  cidade: string;
  estado: string;
  telefone: string;
  email_contato: string;
  email_sac: string;
  responsavel_tecnico: string;
}

export const CompanyConfigManager = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
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
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCompanyInfo(data);
      }
    } catch (error) {
      console.error('Error loading company info:', error);
      toast({
        title: "Erro ao Carregar",
        description: "Não foi possível carregar as informações da empresa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('company_info')
        .upsert(companyInfo)
        .select()
        .single();

      if (error) throw error;

      setCompanyInfo(data);
      toast({
        title: "Configurações Salvas",
        description: "As informações da empresa foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving company info:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <div className="p-6">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Configurações da Empresa</h2>
      </div>

      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          Estas informações são necessárias para a emissão de notas fiscais e integração com transportadoras.
          Certifique-se de preencher todos os campos com dados reais e válidos.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="razao_social">Razão Social *</Label>
              <Input
                id="razao_social"
                value={companyInfo.razao_social}
                onChange={(e) => handleInputChange('razao_social', e.target.value)}
                placeholder="Ex: EMPRESA LTDA"
              />
            </div>
            
            <div>
              <Label htmlFor="nome_fantasia">Nome Fantasia *</Label>
              <Input
                id="nome_fantasia"
                value={companyInfo.nome_fantasia}
                onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                placeholder="Ex: Minha Empresa"
              />
            </div>
            
            <div>
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={companyInfo.cnpj}
                onChange={(e) => handleInputChange('cnpj', e.target.value)}
                placeholder="00.000.000/0001-00"
              />
            </div>
            
            <div>
              <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
              <Input
                id="inscricao_estadual"
                value={companyInfo.inscricao_estadual || ''}
                onChange={(e) => handleInputChange('inscricao_estadual', e.target.value)}
                placeholder="Ex: 123456789"
              />
            </div>
            
            <div>
              <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
              <Input
                id="inscricao_municipal"
                value={companyInfo.inscricao_municipal || ''}
                onChange={(e) => handleInputChange('inscricao_municipal', e.target.value)}
                placeholder="Ex: 123456"
              />
            </div>
            
            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={companyInfo.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="endereco_completo">Endereço Completo *</Label>
            <Input
              id="endereco_completo"
              value={companyInfo.endereco_completo}
              onChange={(e) => handleInputChange('endereco_completo', e.target.value)}
              placeholder="Rua, Número, Complemento, Bairro"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                value={companyInfo.cep}
                onChange={(e) => handleInputChange('cep', e.target.value)}
                placeholder="00000-000"
              />
            </div>
            
            <div>
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={companyInfo.cidade}
                onChange={(e) => handleInputChange('cidade', e.target.value)}
                placeholder="Ex: São Paulo"
              />
            </div>
            
            <div>
              <Label htmlFor="estado">Estado *</Label>
              <Input
                id="estado"
                value={companyInfo.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                placeholder="Ex: SP"
                maxLength={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email_contato">Email de Contato *</Label>
              <Input
                id="email_contato"
                type="email"
                value={companyInfo.email_contato}
                onChange={(e) => handleInputChange('email_contato', e.target.value)}
                placeholder="contato@empresa.com"
              />
            </div>
            
            <div>
              <Label htmlFor="email_sac">Email SAC</Label>
              <Input
                id="email_sac"
                type="email"
                value={companyInfo.email_sac}
                onChange={(e) => handleInputChange('email_sac', e.target.value)}
                placeholder="sac@empresa.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="responsavel_tecnico">Responsável Técnico</Label>
            <Input
              id="responsavel_tecnico"
              value={companyInfo.responsavel_tecnico}
              onChange={(e) => handleInputChange('responsavel_tecnico', e.target.value)}
              placeholder="Nome do responsável técnico"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};