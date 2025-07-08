import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Copy, ExternalLink, TrendingUp, Users, DollarSign, UserPlus } from 'lucide-react';
import { TableSkeleton, CardSkeleton } from '@/components/ui/LoadingStates';

interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  commission_rate: number;
  status: string;
  total_earnings: number;
  total_referrals: number;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
  } | null;
}

interface AffiliateReferral {
  id: string;
  affiliate_id: string;
  commission_amount: number;
  status: string;
  created_at: string;
  confirmed_at: string;
  paid_at?: string;
  payment_method?: string;
  payment_reference?: string;
  payment_notes?: string;
}

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      console.log('Loading affiliate data...');
      
      // Carregar afiliados
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (affiliatesError) throw affiliatesError;
      console.log('Affiliates loaded:', affiliatesData);

      // Buscar profiles separadamente
      const affiliatesWithProfiles = await Promise.all(
        (affiliatesData || []).map(async (affiliate) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', affiliate.user_id)
            .single();
          
          return {
            ...affiliate,
            profiles: profile
          };
        })
      );

      // Carregar todos os usuários que não são afiliados
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .order('name');

      if (usersError) throw usersError;
      console.log('All users:', usersData);

      // Filtrar usuários que já são afiliados
      const affiliateUserIds = (affiliatesData || []).map(a => a.user_id);
      const nonAffiliateUsers = (usersData || []).filter(user => 
        !affiliateUserIds.includes(user.id)
      );
      console.log('Non-affiliate users:', nonAffiliateUsers);

      // Carregar referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (referralsError) throw referralsError;
      console.log('Referrals loaded:', referralsData);

      setAffiliates(affiliatesWithProfiles);
      setAllUsers(nonAffiliateUsers);
      setReferrals(referralsData || []);
    } catch (error) {
      console.error('Error loading affiliate data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos afiliados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAffiliateStatus = async (affiliateId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ status: newStatus })
        .eq('id', affiliateId);

      if (error) throw error;

      setAffiliates(prev => 
        prev.map(affiliate => 
          affiliate.id === affiliateId 
            ? { ...affiliate, status: newStatus }
            : affiliate
        )
      );

      toast({
        title: "Sucesso",
        description: `Status do afiliado atualizado para ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating affiliate status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do afiliado",
        variant: "destructive",
      });
    }
  };

  const removeAffiliate = async (affiliateId: string) => {
    console.log('removeAffiliate called with:', affiliateId);
    
    if (!confirm('Tem certeza que deseja remover este afiliado? Esta ação não pode ser desfeita.')) {
      console.log('User cancelled removal');
      return;
    }

    console.log('Proceeding with affiliate removal...');
    try {
      const { error } = await supabase
        .from('affiliates')
        .delete()
        .eq('id', affiliateId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Affiliate removed successfully from database');
      setAffiliates(prev => prev.filter(affiliate => affiliate.id !== affiliateId));

      toast({
        title: "Sucesso",
        description: "Afiliado removido com sucesso",
      });

      // Recarregar dados para atualizar lista de usuários disponíveis
      console.log('Reloading data...');
      loadData();
    } catch (error) {
      console.error('Error removing affiliate:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover afiliado",
        variant: "destructive",
      });
    }
  };

  const confirmCommission = async (referralId: string) => {
    try {
      const { error } = await supabase
        .from('affiliate_referrals')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', referralId);

      if (error) throw error;

      setReferrals(prev => 
        prev.map(referral => 
          referral.id === referralId 
            ? { ...referral, status: 'confirmed', confirmed_at: new Date().toISOString() }
            : referral
        )
      );

      toast({
        title: "Sucesso",
        description: "Comissão confirmada com sucesso",
      });
    } catch (error) {
      console.error('Error confirming commission:', error);
      toast({
        title: "Erro",
        description: "Erro ao confirmar comissão",
        variant: "destructive",
      });
    }
  };

  const markAsPaid = async (referralIds: string[], affiliateId: string, paymentMethod: string, paymentReference: string, notes?: string) => {
    try {
      // Calculate total amount
      const totalAmount = referrals
        .filter(r => referralIds.includes(r.id))
        .reduce((sum, r) => sum + r.commission_amount, 0);

      // Create payment record
      const { error: paymentError } = await supabase
        .from('affiliate_payments')
        .insert({
          affiliate_id: affiliateId,
          amount: totalAmount,
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          notes: notes,
          referral_ids: referralIds
        });

      if (paymentError) throw paymentError;

      // Mark referrals as paid
      const { error: referralError } = await supabase
        .from('affiliate_referrals')
        .update({
          paid_at: new Date().toISOString(),
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          payment_notes: notes
        })
        .in('id', referralIds);

      if (referralError) throw referralError;

      // Update local state
      setReferrals(prev => 
        prev.map(referral => 
          referralIds.includes(referral.id)
            ? { 
                ...referral, 
                status: 'paid',
                paid_at: new Date().toISOString(),
                payment_method: paymentMethod,
                payment_reference: paymentReference,
                payment_notes: notes
              }
            : referral
        )
      );

      toast({
        title: "Sucesso",
        description: `Pagamento de R$ ${totalAmount.toFixed(2)} registrado com sucesso`,
      });
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar pagamento",
        variant: "destructive",
      });
    }
  };

  const addAffiliate = async (userId: string) => {
    try {
      // Buscar nome do usuário para gerar código
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();

      // Gerar código de afiliado
      const { data: affiliateCode, error: codeError } = await supabase
        .rpc('generate_affiliate_code', { 
          user_name: userProfile?.name || undefined 
        });

      if (codeError) throw codeError;

      // Criar registro de afiliado
      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: userId,
          affiliate_code: affiliateCode,
          commission_rate: 0.05,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Afiliado adicionado com sucesso",
      });

      // Recarregar dados
      loadData();
    } catch (error) {
      console.error('Error adding affiliate:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar afiliado",
        variant: "destructive",
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copiado!",
      description: "Código do afiliado copiado para a área de transferência",
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter(a => a.status === 'active').length;
  const totalEarnings = affiliates.reduce((sum, a) => sum + (a.total_earnings || 0), 0);
  const totalReferrals = affiliates.reduce((sum, a) => sum + (a.total_referrals || 0), 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
        </div>

        {/* Métricas Loading */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        {/* Add Affiliate Card Loading */}
        <CardSkeleton />

        {/* Affiliates Table Loading */}
        <div className="border rounded-lg p-6">
          <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse"></div>
          <TableSkeleton rows={3} columns={8} />
        </div>

        {/* Referrals Table Loading */}
        <div className="border rounded-lg p-6">
          <div className="h-6 bg-muted rounded w-40 mb-4 animate-pulse"></div>
          <TableSkeleton rows={3} columns={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Afiliados</h1>
        <Button onClick={loadData} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Afiliados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAffiliates}</div>
            <p className="text-xs text-muted-foreground">
              {activeAffiliates} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Referrals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5%</div>
            <p className="text-xs text-muted-foreground">
              Taxa padrão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Adicionar Novo Afiliado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Adicionar Novo Afiliado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione um usuário para dar permissão de afiliado:
            </p>
            {allUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Todos os usuários registrados já são afiliados ou não há usuários cadastrados.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allUsers.slice(0, 6).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{user.name || 'Sem nome'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addAffiliate(user.id)}
                      >
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
                {allUsers.length > 6 && (
                  <p className="text-sm text-muted-foreground">
                    E mais {allUsers.length - 6} usuários disponíveis...
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Afiliados */}
      <Card>
        <CardHeader>
          <CardTitle>Afiliados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome/Email</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Referrals</TableHead>
                <TableHead>Ganhos</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliates.map((affiliate) => (
                <TableRow key={affiliate.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{affiliate.profiles?.name || 'Sem nome'}</div>
                      <div className="text-sm text-muted-foreground">{affiliate.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {affiliate.affiliate_code}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCode(affiliate.affiliate_code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                      {affiliate.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{(affiliate.commission_rate * 100).toFixed(1)}%</TableCell>
                  <TableCell>{affiliate.total_referrals}</TableCell>
                  <TableCell>R$ {affiliate.total_earnings.toFixed(2)}</TableCell>
                  <TableCell>
                    {new Date(affiliate.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {affiliate.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateAffiliateStatus(affiliate.id, 'inactive')}
                        >
                          Desativar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateAffiliateStatus(affiliate.id, 'active')}
                        >
                          Ativar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeAffiliate(affiliate.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Referrals Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Referrals Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confirmado em</TableHead>
                <TableHead>Pago em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell>
                    {new Date(referral.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>R$ {referral.commission_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      referral.status === 'confirmed' ? 'default' : 
                      referral.status === 'paid' ? 'secondary' : 
                      'outline'
                    }>
                      {referral.status === 'paid' ? 'Pago' : 
                       referral.status === 'confirmed' ? 'Confirmado' : 
                       'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {referral.confirmed_at 
                      ? new Date(referral.confirmed_at).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {referral.paid_at 
                      ? new Date(referral.paid_at).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {referral.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => confirmCommission(referral.id)}
                        >
                          Confirmar
                        </Button>
                      )}
                      {referral.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const paymentMethod = prompt('Método de pagamento (ex: PIX, Transferência):');
                            const paymentReference = prompt('Referência do pagamento (ex: ID transação):');
                            if (paymentMethod && paymentReference) {
                              markAsPaid([referral.id], referral.affiliate_id, paymentMethod, paymentReference);
                            }
                          }}
                        >
                          Marcar como Pago
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}