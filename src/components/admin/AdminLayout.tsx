import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (!data) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar o painel administrativo.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin role:', error);
        navigate('/');
      }
    };

    checkAdminRole();
  }, [user, navigate]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-background relative">
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col lg:ml-60 relative z-10">
        <header className="h-14 flex items-center border-b bg-background px-4 lg:px-6 sticky top-0 z-50 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <div className="ml-auto">
            <span className="text-sm text-muted-foreground">
              Painel Administrativo
            </span>
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-6 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}