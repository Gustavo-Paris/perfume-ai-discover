import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, User, Bell, Shield, Trash2, AlertTriangle, 
  Eye, EyeOff, Lock, Mail, Phone, MapPin, CreditCard 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const Configuracoes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [promotionalEmails, setPromotionalEmails] = useState(true);

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
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
            Configurações da Conta
          </h1>
          <p className="text-gray-600">
            Gerencie suas informações pessoais, preferências e configurações de segurança
          </p>
        </motion.div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Conta
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacidade
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Zona Perigosa
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input 
                        id="name" 
                        defaultValue={user?.user_metadata?.name || ''} 
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        defaultValue={user?.email || ''} 
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input 
                        id="cpf" 
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                  <Button className="btn-primary">
                    Salvar Alterações
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <Input 
                      id="current-password" 
                      type="password" 
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-password">Nova Senha</Label>
                      <Input 
                        id="new-password" 
                        type="password" 
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <Button variant="outline">
                    Alterar Senha
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Preferências de Notificação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Email de Pedidos</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba atualizações sobre seus pedidos por email
                      </p>
                    </div>
                    <Switch 
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">SMS de Entrega</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba SMS quando seu pedido sair para entrega
                      </p>
                    </div>
                    <Switch 
                      checked={smsNotifications}
                      onCheckedChange={setSmsNotifications}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Emails Promocionais</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba ofertas especiais e novidades por email
                      </p>
                    </div>
                    <Switch 
                      checked={promotionalEmails}
                      onCheckedChange={setPromotionalEmails}
                    />
                  </div>
                  
                  <Button className="btn-primary">
                    Salvar Preferências
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacidade e Dados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Controle de Dados</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Eye className="mr-2 h-4 w-4" />
                        Baixar Meus Dados
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <EyeOff className="mr-2 h-4 w-4" />
                        Gerenciar Cookies
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Políticas</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <a href="/privacidade" className="text-primary hover:underline">
                          Política de Privacidade
                        </a>
                      </p>
                      <p>
                        <a href="/termos" className="text-primary hover:underline">
                          Termos de Uso
                        </a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Zona Perigosa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">Excluir Conta Permanentemente</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Uma vez excluída, sua conta não poderá ser recuperada. Todos os seus dados, 
                      pedidos, pontos e configurações serão permanentemente removidos.
                    </p>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir Minha Conta
                        </Button>
                      </AlertDialogTrigger>
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
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Configuracoes;