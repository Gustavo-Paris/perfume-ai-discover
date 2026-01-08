import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TestTube, ShoppingBag, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TestOrderCreatorProps {
  onSuccess: () => void;
}

// SEGURANÇA: Este componente só funciona em ambiente de desenvolvimento/homologação
const isDevEnvironment = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' ||
         hostname === '127.0.0.1' ||
         hostname.includes('preview') ||
         hostname.includes('staging') ||
         hostname.includes('homolog') ||
         import.meta.env.DEV;
};

export function TestOrderCreator({ onSuccess }: TestOrderCreatorProps) {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState('11111111111'); // CPF de teste padrão
  const [customerName, setCustomerName] = useState('Cliente Teste Homologação');
  const [customerEmail, setCustomerEmail] = useState('teste@homologacao.com');
  const [totalAmount, setTotalAmount] = useState(150.00);
  const [selectedPerfume, setSelectedPerfume] = useState<string>('');
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [isAllowed, setIsAllowed] = useState(false);

  // Verificar se o ambiente permite criar pedidos de teste
  useEffect(() => {
    setIsAllowed(isDevEnvironment());
  }, []);

  // Load perfumes on mount
  useEffect(() => {
    const loadPerfumes = async () => {
      const { data } = await supabase
        .from('perfumes')
        .select('id, name, brand')
        .limit(10);
      
      if (data) {
        setPerfumes(data);
        if (data.length > 0) setSelectedPerfume(data[0].id);
      }
    };
    loadPerfumes();
  }, []);

  const createTestOrder = async () => {
    if (!selectedPerfume) {
      toast({
        title: "❌ Erro",
        description: "Selecione um perfume para o pedido de teste",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      // 1. Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Você precisa estar autenticado para criar pedidos de teste');
      }

      // 2. Generate test order number
      const orderNumber = `TEST-${Date.now().toString().slice(-8)}`;

      // 3. Create test order (marked as PAID)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          status: 'pending',
          payment_status: 'paid', // ✅ MARKED AS PAID
          payment_method: 'pix',
          total_amount: totalAmount,
          subtotal: totalAmount - 15,
          shipping_cost: 15,
          shipping_service: 'PAC',
          address_data: {
            recipient_name: customerName,
            street: 'Rua de Teste',
            number: '123',
            complement: 'Apto 1',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zip_code: '01310-100',
            phone: '11999999999',
            cpf_cnpj: cpfCnpj,
            email: customerEmail
          }
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          perfume_id: selectedPerfume,
          quantity: 1,
          size_ml: 50,
          unit_price: totalAmount - 15,
          total_price: totalAmount - 15
        });

      if (itemError) throw itemError;

      toast({
        title: "✅ Pedido de Teste Criado!",
        description: `Pedido ${orderNumber} criado e marcado como PAGO. Agora você pode gerar a NF-e!`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating test order:', error);
      toast({
        title: "❌ Erro ao Criar Pedido",
        description: error instanceof Error ? error.message : "Falha ao criar pedido de teste",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  // SEGURANÇA: Bloquear em produção
  if (!isAllowed) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Funcionalidade Bloqueada</AlertTitle>
        <AlertDescription>
          A criação de pedidos de teste está desabilitada em ambiente de produção por motivos de segurança.
          Esta funcionalidade só está disponível em ambientes de desenvolvimento, staging ou homologação.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-purple-500" />
          Criar Pedido de Teste para Homologação
        </CardTitle>
        <CardDescription>
          Crie um pedido fictício marcado como PAGO para testar a emissão de NF-e de homologação.
          <span className="text-amber-600 font-medium"> ⚠️ Somente para ambiente de teste/homologação.</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF/CNPJ do Cliente</Label>
            <Input
              id="cpf"
              placeholder="11111111111"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use CPF de homologação: 11111111111
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cliente</Label>
            <Input
              id="name"
              placeholder="Cliente Teste"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email do Cliente</Label>
            <Input
              id="email"
              type="email"
              placeholder="teste@homologacao.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total">Valor Total (R$)</Label>
            <Input
              id="total"
              type="number"
              step="0.01"
              min="1"
              value={totalAmount}
              onChange={(e) => setTotalAmount(parseFloat(e.target.value))}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="perfume">Perfume do Pedido</Label>
            <Select value={selectedPerfume} onValueChange={setSelectedPerfume}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfume" />
              </SelectTrigger>
              <SelectContent>
                {perfumes.map((perfume) => (
                  <SelectItem key={perfume.id} value={perfume.id}>
                    {perfume.brand} - {perfume.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            O que acontecerá:
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>✅ Pedido será criado com status <strong>PAGO</strong></li>
            <li>✅ Número do pedido: TEST-XXXXXXXX</li>
            <li>✅ Endereço fictício será preenchido automaticamente</li>
            <li>✅ Você poderá gerar NF-e de homologação imediatamente</li>
            <li>⚠️ Este pedido é apenas para teste - não envolve pagamento real</li>
          </ul>
        </div>

        <Button 
          onClick={createTestOrder} 
          disabled={creating || !selectedPerfume}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          size="lg"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando Pedido...
            </>
          ) : (
            <>
              <TestTube className="w-4 h-4 mr-2" />
              Criar Pedido de Teste
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
