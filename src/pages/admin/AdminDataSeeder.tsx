import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Database, Package, Truck, Tag, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { samplePerfumes } from '@/data/perfumes';

interface SeedOperation {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  count?: number;
}

const AdminDataSeeder = () => {
  const [operations, setOperations] = useState<SeedOperation[]>([
    {
      id: 'perfumes',
      title: 'Perfumes',
      description: 'Popular catálogo com perfumes de exemplo',
      icon: <Package className="h-4 w-4" />,
      status: 'pending',
      progress: 0,
      count: samplePerfumes.length
    },
    {
      id: 'warehouses',
      title: 'Depósitos',
      description: 'Criar depósitos padrão (Principal e Secundário)',
      icon: <Truck className="h-4 w-4" />,
      status: 'pending',
      progress: 0,
      count: 2
    },
    {
      id: 'inventory',
      title: 'Lotes de Estoque',
      description: 'Criar lotes de estoque para os perfumes',
      icon: <Database className="h-4 w-4" />,
      status: 'pending',
      progress: 0
    },
    {
      id: 'promotions',
      title: 'Promoções',
      description: 'Criar promoções de exemplo',
      icon: <Tag className="h-4 w-4" />,
      status: 'pending',
      progress: 0,
      count: 5
    },
    {
      id: 'users',
      title: 'Usuários de Teste',
      description: 'Criar perfis de teste para demonstração',
      icon: <Users className="h-4 w-4" />,
      status: 'pending',
      progress: 0,
      count: 3
    }
  ]);

  const updateOperationStatus = (id: string, status: SeedOperation['status'], progress: number = 0) => {
    setOperations(prev => prev.map(op => 
      op.id === id ? { ...op, status, progress } : op
    ));
  };

  const seedPerfumes = async () => {
    updateOperationStatus('perfumes', 'running', 0);
    
    try {
      // Check if perfumes already exist
      const { count } = await supabase
        .from('perfumes')
        .select('id', { count: 'exact' });

      if (count && count > 0) {
        toast({
          title: "Perfumes já existem",
          description: `Encontrados ${count} perfumes no banco. Pulando importação.`,
        });
        updateOperationStatus('perfumes', 'completed', 100);
        return;
      }

      // Insert perfumes in batches
      const batchSize = 10;
      let processed = 0;

      for (let i = 0; i < samplePerfumes.length; i += batchSize) {
        const batch = samplePerfumes.slice(i, i + batchSize);
        const perfumesToInsert = batch.map(perfume => ({
          name: perfume.name,
          brand: perfume.brand,
          family: perfume.family,
          gender: perfume.gender,
          price_full: perfume.price_full,
          price_5ml: perfume.price_5ml,
          price_10ml: perfume.price_10ml,
          description: perfume.description,
          image_url: perfume.image_url,
          top_notes: perfume.top_notes,
          heart_notes: perfume.heart_notes,
          base_notes: perfume.base_notes,
          category: 'premium'
        }));

        const { error } = await supabase
          .from('perfumes')
          .insert(perfumesToInsert);

        if (error) throw error;

        processed += batch.length;
        const progress = (processed / samplePerfumes.length) * 100;
        updateOperationStatus('perfumes', 'running', progress);
      }

      updateOperationStatus('perfumes', 'completed', 100);
      toast({
        title: "Perfumes importados",
        description: `${samplePerfumes.length} perfumes foram importados com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao importar perfumes:', error);
      updateOperationStatus('perfumes', 'error', 0);
      toast({
        title: "Erro",
        description: "Erro ao importar perfumes.",
        variant: "destructive",
      });
    }
  };

  const seedWarehouses = async () => {
    updateOperationStatus('warehouses', 'running', 0);
    
    try {
      const { count } = await supabase
        .from('warehouses')
        .select('id', { count: 'exact' });

      if (count && count > 0) {
        toast({
          title: "Depósitos já existem",
          description: `Encontrados ${count} depósitos. Pulando criação.`,
        });
        updateOperationStatus('warehouses', 'completed', 100);
        return;
      }

      const warehouses = [
        {
          name: 'Depósito Principal',
          location: 'São Paulo - SP',
          is_primary: true
        },
        {
          name: 'Depósito Secundário',
          location: 'Rio de Janeiro - RJ',
          is_primary: false
        }
      ];

      const { error } = await supabase
        .from('warehouses')
        .insert(warehouses);

      if (error) throw error;

      updateOperationStatus('warehouses', 'completed', 100);
      toast({
        title: "Depósitos criados",
        description: "Depósitos padrão foram criados com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao criar depósitos:', error);
      updateOperationStatus('warehouses', 'error', 0);
      toast({
        title: "Erro",
        description: "Erro ao criar depósitos.",
        variant: "destructive",
      });
    }
  };

  const seedInventory = async () => {
    updateOperationStatus('inventory', 'running', 0);
    
    try {
      // Get perfumes and warehouses
      const { data: perfumes } = await supabase
        .from('perfumes')
        .select('id');

      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id')
        .eq('is_primary', true)
        .single();

      if (!perfumes || !warehouses) {
        throw new Error('Perfumes ou depósitos não encontrados');
      }

      // Check if inventory already exists
      const { count } = await supabase
        .from('inventory_lots')
        .select('id', { count: 'exact' });

      if (count && count > 0) {
        toast({
          title: "Estoque já existe",
          description: `Encontrados ${count} lotes. Pulando criação.`,
        });
        updateOperationStatus('inventory', 'completed', 100);
        return;
      }

      // Create inventory lots
      const lots = perfumes.map((perfume, index) => ({
        perfume_id: perfume.id,
        warehouse_id: warehouses.id,
        lot_code: `LOT${String(index + 1).padStart(3, '0')}`,
        qty_ml: Math.floor(Math.random() * 2000) + 500, // Random between 500-2500ml
        expiry_date: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString() // 1 year from now
      }));

      const batchSize = 20;
      let processed = 0;

      for (let i = 0; i < lots.length; i += batchSize) {
        const batch = lots.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('inventory_lots')
          .insert(batch);

        if (error) throw error;

        processed += batch.length;
        const progress = (processed / lots.length) * 100;
        updateOperationStatus('inventory', 'running', progress);
      }

      updateOperationStatus('inventory', 'completed', 100);
      toast({
        title: "Estoque criado",
        description: `${lots.length} lotes de estoque foram criados.`,
      });
    } catch (error) {
      console.error('Erro ao criar estoque:', error);
      updateOperationStatus('inventory', 'error', 0);
      toast({
        title: "Erro",
        description: "Erro ao criar lotes de estoque.",
        variant: "destructive",
      });
    }
  };

  const seedPromotions = async () => {
    updateOperationStatus('promotions', 'running', 0);
    
    try {
      // Get some perfumes for promotions
      const { data: perfumes } = await supabase
        .from('perfumes')
        .select('id, name, brand, price_full, price_5ml, price_10ml')
        .limit(5);

      if (!perfumes || perfumes.length === 0) {
        throw new Error('Nenhum perfume encontrado para criar promoções');
      }

      const promotions = perfumes.map((perfume, index) => {
        const discountPercent = [10, 15, 20, 25, 30][index];
        return {
          perfume_id: perfume.id,
          title: `Promoção ${perfume.brand} - ${discountPercent}% OFF`,
          description: `Desconto especial de ${discountPercent}% em ${perfume.name}`,
          discount_type: 'percent',
          discount_value: discountPercent,
          promotional_price_5ml: perfume.price_5ml * (1 - discountPercent / 100),
          promotional_price_10ml: perfume.price_10ml * (1 - discountPercent / 100),
          promotional_price_full: perfume.price_full * (1 - discountPercent / 100),
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(), // 30 days
          is_active: true
        };
      });

      const { error } = await supabase
        .from('promotions')
        .insert(promotions);

      if (error) throw error;

      updateOperationStatus('promotions', 'completed', 100);
      toast({
        title: "Promoções criadas",
        description: `${promotions.length} promoções foram criadas.`,
      });
    } catch (error) {
      console.error('Erro ao criar promoções:', error);
      updateOperationStatus('promotions', 'error', 0);
      toast({
        title: "Erro",
        description: "Erro ao criar promoções.",
        variant: "destructive",
      });
    }
  };

  const seedUsers = async () => {
    updateOperationStatus('users', 'running', 0);
    
    try {
      // This would create test user profiles
      // In a real implementation, you'd create actual users
      
      updateOperationStatus('users', 'completed', 100);
      toast({
        title: "Usuários de teste",
        description: "Funcionalidade de usuários de teste será implementada via convites.",
      });
    } catch (error) {
      console.error('Erro ao criar usuários:', error);
      updateOperationStatus('users', 'error', 0);
    }
  };

  const runAllOperations = async () => {
    await seedWarehouses();
    await seedPerfumes();
    await seedInventory();
    await seedPromotions();
    await seedUsers();
  };

  const getStatusIcon = (status: SeedOperation['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: SeedOperation['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      completed: 'default',
      error: 'destructive'
    } as const;

    const labels = {
      pending: 'Pendente',
      running: 'Executando',
      completed: 'Concluído',
      error: 'Erro'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const isRunning = operations.some(op => op.status === 'running');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Preparação de Dados</h1>
          <p className="text-muted-foreground">
            Popule o sistema com dados de exemplo para demonstração e testes
          </p>
        </div>
        <Button 
          onClick={runAllOperations} 
          disabled={isRunning}
          size="lg"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          {isRunning ? 'Executando...' : 'Executar Todas'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {operations.map((operation) => (
          <Card key={operation.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {operation.icon}
                  <CardTitle className="text-lg">{operation.title}</CardTitle>
                </div>
                {getStatusIcon(operation.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {operation.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                {getStatusBadge(operation.status)}
                {operation.count && (
                  <span className="text-sm text-muted-foreground">
                    {operation.count} itens
                  </span>
                )}
              </div>
              
              {operation.status === 'running' && (
                <div className="space-y-2">
                  <Progress value={operation.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {Math.round(operation.progress)}%
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={operation.status === 'running' || isRunning}
                onClick={() => {
                  switch (operation.id) {
                    case 'perfumes':
                      seedPerfumes();
                      break;
                    case 'warehouses':
                      seedWarehouses();
                      break;
                    case 'inventory':
                      seedInventory();
                      break;
                    case 'promotions':
                      seedPromotions();
                      break;
                    case 'users':
                      seedUsers();
                      break;
                  }
                }}
              >
                Executar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Preparação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {['pending', 'running', 'completed', 'error'].map((status) => {
              const count = operations.filter(op => op.status === status).length;
              const colors = {
                pending: 'text-gray-600',
                running: 'text-blue-600',
                completed: 'text-green-600',
                error: 'text-red-600'
              };
              const labels = {
                pending: 'Pendentes',
                running: 'Executando',
                completed: 'Concluídas',
                error: 'Com Erro'
              };
              
              return (
                <div key={status} className="space-y-1">
                  <div className={`text-2xl font-bold ${colors[status as keyof typeof colors]}`}>
                    {count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {labels[status as keyof typeof labels]}
                  </div>
                </div>
              );
            })}
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-600">
                {operations.reduce((acc, op) => acc + (op.count || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                Total de Itens
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDataSeeder;