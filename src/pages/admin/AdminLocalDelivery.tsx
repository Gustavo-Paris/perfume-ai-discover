import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { MapPin, Truck, Store, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface LocalDeliverySettings {
  id: string;
  company_city: string;
  company_state: string;
  company_cep: string;
  local_delivery_fee: number;
  pickup_available: boolean;
  pickup_address: string;
  pickup_instructions: string;
  local_delivery_radius_km: number;
  local_delivery_enabled: boolean;
}

const AdminLocalDelivery = () => {
  const [settings, setSettings] = useState<LocalDeliverySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('local_delivery_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('local_delivery_settings')
        .update(settings)
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Configurações salvas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof LocalDeliverySettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Carregando configurações...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p>Não foi possível carregar as configurações.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Entrega Local</h1>
          <p className="text-muted-foreground">
            Configure as opções de entrega local e retirada na loja
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Entrega Local Ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar sistema de entrega local
                </p>
              </div>
              <Switch
                checked={settings.local_delivery_enabled}
                onCheckedChange={(checked) => handleChange('local_delivery_enabled', checked)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Cidade da Empresa</Label>
                <Input
                  id="city"
                  value={settings.company_city}
                  onChange={(e) => handleChange('company_city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={settings.company_state}
                  onChange={(e) => handleChange('company_state', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cep">CEP da Empresa</Label>
              <Input
                id="cep"
                value={settings.company_cep}
                onChange={(e) => handleChange('company_cep', e.target.value)}
                placeholder="00000-000"
              />
            </div>

            <div>
              <Label htmlFor="radius">Raio de Entrega (km)</Label>
              <Input
                id="radius"
                type="number"
                value={settings.local_delivery_radius_km}
                onChange={(e) => handleChange('local_delivery_radius_km', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Entrega Local */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Entrega Local
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="delivery-fee">Taxa de Entrega Local (R$)</Label>
              <Input
                id="delivery-fee"
                type="number"
                step="0.01"
                value={settings.local_delivery_fee}
                onChange={(e) => handleChange('local_delivery_fee', parseFloat(e.target.value))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Taxa cobrada para entrega na cidade
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Retirada na Loja */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Retirada na Loja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Retirada Disponível</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que clientes retirem produtos na loja
                </p>
              </div>
              <Switch
                checked={settings.pickup_available}
                onCheckedChange={(checked) => handleChange('pickup_available', checked)}
              />
            </div>

            {settings.pickup_available && (
              <>
                <div>
                  <Label htmlFor="pickup-address">Endereço para Retirada</Label>
                  <Input
                    id="pickup-address"
                    value={settings.pickup_address}
                    onChange={(e) => handleChange('pickup_address', e.target.value)}
                    placeholder="Endereço completo da loja"
                  />
                </div>

                <div>
                  <Label htmlFor="pickup-instructions">Instruções de Retirada</Label>
                  <Textarea
                    id="pickup-instructions"
                    value={settings.pickup_instructions}
                    onChange={(e) => handleChange('pickup_instructions', e.target.value)}
                    placeholder="Horários de funcionamento, instruções especiais, etc."
                    rows={3}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLocalDelivery;