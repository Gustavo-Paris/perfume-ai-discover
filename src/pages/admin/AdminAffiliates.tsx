import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Copy, ExternalLink, TrendingUp, Users, DollarSign } from 'lucide-react';

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
}

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // Carregar afiliados
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (affiliatesError) throw affiliatesError;

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

      // Carregar referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (referralsError) throw referralsError;

      setAffiliates(affiliatesWithProfiles);
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
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
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
                          variant="destructive"
                          onClick={() => updateAffiliateStatus(affiliate.id, 'inactive')}
                        >
                          Desativar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => updateAffiliateStatus(affiliate.id, 'active')}
                        >
                          Ativar
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
                    <Badge variant={referral.status === 'confirmed' ? 'default' : 'secondary'}>
                      {referral.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {referral.confirmed_at 
                      ? new Date(referral.confirmed_at).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {referral.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => confirmCommission(referral.id)}
                      >
                        Confirmar
                      </Button>
                    )}
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