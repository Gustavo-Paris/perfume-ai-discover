import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Eye, Award, Plus, Minus, Shield, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { debugError } from '@/utils/removeDebugLogsProduction';
import { useSecurityAudit } from '@/hooks/useSecurityAudit';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  points: number | null;
  tier: string | null;
  created_at: string | null;
  isAdmin?: boolean;
  lastOrder?: {
    created_at: string;
    total_amount: number;
  } | null;
}

interface PointsTransaction {
  id: string;
  delta: number;
  balance_after: number;
  source: string;
  description: string | null;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pointsAdjustment, setPointsAdjustment] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const { logSecurityEvent } = useSecurityAudit();

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get admin roles
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      const adminUserIds = new Set(adminRoles?.map(role => role.user_id) || []);

      // Get last order for each user
      const usersWithOrders = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: orderData } = await supabase
            .from('orders')
            .select('created_at, total_amount')
            .eq('user_id', profile.id)
            .eq('payment_status', 'paid')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...profile,
            isAdmin: adminUserIds.has(profile.id),
            lastOrder: orderData
          };
        })
      );

      setUsers(usersWithOrders);
    } catch (error) {
      debugError('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPointsHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPointsHistory(data || []);
    } catch (error) {
      console.error('Error fetching points history:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de pontos.",
        variant: "destructive",
      });
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedUser || pointsAdjustment === 0) return;

    try {
      const { error } = await supabase.rpc('add_points_transaction', {
        user_uuid: selectedUser.id,
        points_delta: pointsAdjustment,
        transaction_source: 'admin_adjustment',
        transaction_description: adjustmentReason || 'Ajuste manual do administrador'
      });

      if (error) throw error;

      toast({
        title: "Pontos ajustados",
        description: `${Math.abs(pointsAdjustment)} pontos ${pointsAdjustment > 0 ? 'adicionados' : 'removidos'} com sucesso.`,
      });

      setIsAdjustDialogOpen(false);
      setPointsAdjustment(0);
      setAdjustmentReason('');
      fetchUsers();
      
      if (selectedUser) {
        fetchPointsHistory(selectedUser.id);
      }
    } catch (error) {
      console.error('Error adjusting points:', error);
      toast({
        title: "Erro",
        description: "Erro ao ajustar pontos.",
        variant: "destructive",
      });
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      
      if (isCurrentlyAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;

        // Log audit event
        await logSecurityEvent({
          event_type: 'role_removed',
          description: `Permissão de admin removida de ${targetUser?.email}`,
          risk_level: 'high',
          metadata: {
            target_user_id: userId,
            target_user_email: targetUser?.email,
            role: 'admin',
            action: 'removed'
          }
        });

        toast({
          title: "Permissão removida",
          description: "Usuário não é mais administrador.",
        });
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin'
          });

        if (error) throw error;

        // Log audit event
        await logSecurityEvent({
          event_type: 'role_granted',
          description: `Permissão de admin concedida a ${targetUser?.email}`,
          risk_level: 'critical',
          metadata: {
            target_user_id: userId,
            target_user_email: targetUser?.email,
            role: 'admin',
            action: 'granted'
          }
        });

        toast({
          title: "Permissão concedida",
          description: "Usuário agora é administrador.",
        });
      }

      fetchUsers();
    } catch (error) {
      console.error('Error toggling admin role:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar permissões de administrador.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail.trim()) return;

    try {
      // Check if user exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newAdminEmail.trim())
        .single();

      if (profileError) {
        toast({
          title: "Usuário não encontrado",
          description: "Não existe usuário cadastrado com este email.",
          variant: "destructive",
        });
        return;
      }

      // Add admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: profileData.id,
          role: 'admin'
        });

      if (error) throw error;

      // Log audit event
      await logSecurityEvent({
        event_type: 'role_granted',
        description: `Novo administrador criado: ${newAdminEmail.trim()}`,
        risk_level: 'critical',
        metadata: {
          target_user_id: profileData.id,
          target_user_email: newAdminEmail.trim(),
          role: 'admin',
          action: 'granted',
          method: 'direct_creation'
        }
      });

      toast({
        title: "Admin criado",
        description: "Usuário promovido para administrador com sucesso.",
      });

      setIsAdminDialogOpen(false);
      setNewAdminEmail('');
      fetchUsers();
    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar administrador.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários e programa de fidelidade
          </p>
        </div>
        <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Criar Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Promover Usuário para Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email do usuário</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAdminDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAdmin}>
                  Promover para Admin
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Usuários</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Último Pedido</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      {user.points?.toLocaleString() || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.tier || 'Silver'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.isAdmin ? "default" : "outline"} className="gap-1">
                        {user.isAdmin && <Shield className="h-3 w-3" />}
                        {user.isAdmin ? 'Admin' : 'Cliente'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleAdmin(user.id, user.isAdmin || false)}
                        className="h-6 px-2"
                      >
                        {user.isAdmin ? 'Remover' : 'Promover'}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.lastOrder ? (
                      <div className="text-sm">
                        <div>{format(new Date(user.lastOrder.created_at), 'dd/MM/yy', { locale: ptBR })}</div>
                        <div className="text-muted-foreground">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(user.lastOrder.total_amount)}
                        </div>
                      </div>
                    ) : (
                      'Nenhum pedido'
                    )}
                  </TableCell>
                  <TableCell>
                    {user.created_at ? format(new Date(user.created_at), 'dd/MM/yy', { locale: ptBR }) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedUser(user);
                            fetchPointsHistory(user.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[400px] sm:w-[540px]">
                        <SheetHeader>
                          <SheetTitle>Detalhes do Usuário</SheetTitle>
                        </SheetHeader>
                        <div className="space-y-6 mt-6">
                          <div className="space-y-2">
                            <h3 className="font-semibold">Informações Pessoais</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Nome:</span>
                                <p className="font-medium">{user.name || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Email:</span>
                                <p className="font-medium">{user.email}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Pontos:</span>
                                <p className="font-medium flex items-center gap-1">
                                  <Award className="h-4 w-4 text-yellow-500" />
                                  {user.points?.toLocaleString() || 0}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Tier:</span>
                                <Badge variant="secondary" className="mt-1">{user.tier || 'Silver'}</Badge>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="font-semibold">Histórico de Pontos</h3>
                              <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button size="sm">Ajustar Pontos</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Ajustar Pontos</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="points">Pontos (use números negativos para remover)</Label>
                                      <Input
                                        id="points"
                                        type="number"
                                        value={pointsAdjustment}
                                        onChange={(e) => setPointsAdjustment(parseInt(e.target.value) || 0)}
                                        placeholder="Ex: 100 ou -50"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="reason">Motivo do ajuste</Label>
                                      <Input
                                        id="reason"
                                        value={adjustmentReason}
                                        onChange={(e) => setAdjustmentReason(e.target.value)}
                                        placeholder="Descrição do ajuste"
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
                                        Cancelar
                                      </Button>
                                      <Button onClick={handleAdjustPoints}>
                                        Confirmar Ajuste
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                            
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {pointsHistory.map((transaction) => (
                                <div key={transaction.id} className="flex justify-between items-center p-2 border rounded-lg">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      {transaction.delta > 0 ? (
                                        <Plus className="h-3 w-3 text-green-500" />
                                      ) : (
                                        <Minus className="h-3 w-3 text-red-500" />
                                      )}
                                      <span className={`font-medium ${transaction.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {transaction.delta > 0 ? '+' : ''}{transaction.delta}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {transaction.description || transaction.source}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(transaction.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">
                                      Saldo: {transaction.balance_after}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;