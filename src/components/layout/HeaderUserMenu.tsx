
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, LogOut, Settings, UserCircle, Trash2, AlertTriangle, Shield, Users, 
  Package, Heart, CreditCard, FileText, Bell, HelpCircle, Star, MapPin 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useAffiliates } from '@/hooks/useAffiliates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface HeaderUserMenuProps {
  disabled?: boolean;
}

const HeaderUserMenu = ({ disabled = false }: HeaderUserMenuProps) => {
  const { user, signOut } = useAuth();
  const { affiliate } = useAffiliates();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        setIsAdmin(!!data);
      } catch (error) {
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Erro no logout",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const { data, error } = await supabase.functions.invoke('me-delete', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Conta excluída",
        description: "Sua conta e todos os dados foram permanentemente removidos.",
      });

      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erro na exclusão",
        description: "Não foi possível excluir a conta. Tente novamente ou entre em contato conosco.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (!user) {
    return (
      <Button 
        onClick={() => navigate('/auth')} 
        className={`btn-primary ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        size="sm"
        disabled={disabled}
      >
        Entrar
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`hover-scale ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            disabled={disabled}
          >
            <UserCircle className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        {!disabled && (
          <DropdownMenuContent align="end" className="w-64 z-50 bg-white shadow-lg">
            {/* User Info Header */}
            <DropdownMenuLabel className="font-normal p-4 bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-primary">
                  {user.user_metadata?.name || 'Usuário'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            {/* Main Account Actions */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="py-3 px-4">
                <Link to="/pedidos" className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-medium">Meus Pedidos</span>
                    <span className="text-xs text-muted-foreground">Acompanhe seus pedidos</span>
                  </div>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="py-3 px-4">
                <Link to="/wishlist" className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-red-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Lista de Desejos</span>
                    <span className="text-xs text-muted-foreground">Seus favoritos salvos</span>
                  </div>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="py-3 px-4">
                <Link to="/notificacoes" className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Notificações</span>
                    <span className="text-xs text-muted-foreground">Mensagens e alertas</span>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            {/* Finance & Programs */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="py-2 px-4">
                <Link to="/fidelidade" className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Fidelidade</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="py-2 px-4">
                <Link to="/notas-fiscais" className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Notas Fiscais</span>
                </Link>
              </DropdownMenuItem>
              
              {user && affiliate && affiliate.status === 'active' && (
                <DropdownMenuItem asChild className="py-2 px-4">
                  <Link to="/afiliados" className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Afiliados</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            {/* Support & Help */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="py-2 px-4">
                <Link to="/sac" className="flex items-center gap-3">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Suporte</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="py-2 px-4">
                <Link to="/configuracoes" className="flex items-center gap-3">
                  <Settings className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Configurações</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            {/* Admin Section */}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="py-2 px-4">
                    <Link to="/admin" className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-700">Administração</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
            
            <DropdownMenuSeparator />
            
            {/* Account Actions */}
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleSignOut} className="py-2 px-4">
                <LogOut className="mr-3 h-4 w-4 text-gray-600" />
                <span className="font-medium">Sair</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Excluir Conta Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                <strong>Esta ação não pode ser desfeita.</strong> Ao confirmar, todos os seus dados serão permanentemente removidos, incluindo:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Dados pessoais e endereços</li>
                <li>Histórico de pedidos e compras</li>
                <li>Pontos de fidelidade acumulados</li>
                <li>Sessões de curadoria e preferências</li>
                <li>Carrinho de compras</li>
              </ul>
              <p className="text-sm font-medium">
                Tem certeza de que deseja continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir Conta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default HeaderUserMenu;
