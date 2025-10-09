import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, User, Bell, Shield, Trash2, AlertTriangle, 
  Eye, EyeOff, Lock, Mail, Phone, MapPin, CreditCard, AlertCircle
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
import { getPasswordStrength, checkPasswordPwned, type PasswordStrength } from '@/utils/password';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCSRFToken } from '@/hooks/useCSRFToken';
import { profileUpdateSchema } from '@/utils/validationSchemas';

const Configuracoes = () => {
  const { user, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [promotionalEmails, setPromotionalEmails] = useState(true);
  
  // Profile update state
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || ''
  });

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, label: 'Muito Fraca' });
  const [passwordPwned, setPasswordPwned] = useState<{ checked: boolean; pwned: boolean; count: number | null }>({ 
    checked: false, 
    pwned: false, 
    count: null 
  });

  // CSRF Protection
  const { token: csrfToken, validateToken } = useCSRFToken();

  // Check password strength on change
  useEffect(() => {
    if (passwordForm.new) {
      const strength = getPasswordStrength(passwordForm.new);
      setPasswordStrength(strength);
      
      // Reset pwned check when password changes
      setPasswordPwned({ checked: false, pwned: false, count: null });
    } else {
      setPasswordStrength({ score: 0, label: 'Muito Fraca' });
      setPasswordPwned({ checked: false, pwned: false, count: null });
    }
  }, [passwordForm.new]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate with Zod
      const validatedData = profileUpdateSchema.parse(profileForm);
      setIsSavingProfile(true);

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name: validatedData.name
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso"
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        toast({
          title: "Dados inválidos",
          description: error.errors?.[0]?.message || "Verifique os dados e tente novamente.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível salvar as alterações. Tente novamente.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // CSRF token validation
    if (!validateToken(csrfToken)) {
      toast({
        title: "Erro de Segurança",
        description: "Token de segurança inválido. Recarregue a página.",
        variant: "destructive"
      });
      return;
    }
    
    // Validation
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos de senha",
        variant: "destructive"
      });
      return;
    }
    
    if (passwordForm.new !== passwordForm.confirm) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais",
        variant: "destructive"
      });
      return;
    }
    
    // Strength check
    if (passwordStrength.score < 60) {
      toast({
        title: "Senha muito fraca",
        description: "Use pelo menos 8 caracteres com letras maiúsculas, minúsculas, números e símbolos especiais.",
        variant: "destructive"
      });
      return;
    }
    
    // Pwned check
    setIsChangingPassword(true);
    const pwned = await checkPasswordPwned(passwordForm.new);
    setPasswordPwned({ checked: true, ...pwned });
    
    if (pwned.pwned) {
      toast({
        title: "Senha insegura",
        description: `Esta senha apareceu em ${pwned.count?.toLocaleString() ?? pwned.count} vazamentos de dados. Escolha outra senha.`,
        variant: "destructive"
      });
      setIsChangingPassword(false);
      return;
    }
    
    // Verify current password by attempting to sign in
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordForm.current
      });
      
      if (signInError) {
        toast({
          title: "Senha atual incorreta",
          description: "A senha atual não está correta",
          variant: "destructive"
        });
        setIsChangingPassword(false);
        return;
      }
      
      // Update password
      const { error } = await updatePassword(passwordForm.new);
      
      if (error) {
        toast({
          title: "Erro ao alterar senha",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Senha alterada!",
          description: "Sua senha foi atualizada com sucesso"
        });
        setPasswordForm({ current: '', new: '', confirm: '' });
        setPasswordStrength({ score: 0, label: 'Muito Fraca' });
        setPasswordPwned({ checked: false, pwned: false, count: null });
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "Erro inesperado",
        description: "Não foi possível alterar a senha. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
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
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input 
                          id="name" 
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          placeholder="Seu nome completo"
                          disabled={isSavingProfile}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          placeholder="seu@email.com"
                          disabled={isSavingProfile}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="btn-primary" disabled={isSavingProfile}>
                      {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Senha Atual</Label>
                      <Input 
                        id="current-password" 
                        type="password" 
                        placeholder="••••••••"
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                        disabled={isChangingPassword}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="new-password">Nova Senha</Label>
                        <Input 
                          id="new-password" 
                          type="password" 
                          placeholder="••••••••"
                          value={passwordForm.new}
                          onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                          disabled={isChangingPassword}
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                        <Input 
                          id="confirm-password" 
                          type="password" 
                          placeholder="••••••••"
                          value={passwordForm.confirm}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                          disabled={isChangingPassword}
                        />
                      </div>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {passwordForm.new && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Força da senha:</span>
                          <span className={`font-medium ${
                            passwordStrength.score >= 80 ? 'text-green-600' :
                            passwordStrength.score >= 60 ? 'text-blue-600' :
                            passwordStrength.score >= 40 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <Progress 
                          value={passwordStrength.score} 
                          className={`h-2 ${
                            passwordStrength.score >= 80 ? '[&>div]:bg-green-600' :
                            passwordStrength.score >= 60 ? '[&>div]:bg-blue-600' :
                            passwordStrength.score >= 40 ? '[&>div]:bg-yellow-600' :
                            '[&>div]:bg-red-600'
                          }`}
                        />
                        {passwordStrength.score < 60 && (
                          <p className="text-xs text-muted-foreground">
                            Use pelo menos 8 caracteres com maiúsculas, minúsculas, números e símbolos
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Pwned Warning */}
                    {passwordPwned.checked && passwordPwned.pwned && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          ⚠️ Esta senha apareceu em {passwordPwned.count?.toLocaleString() ?? passwordPwned.count} vazamentos de dados conhecidos.
                          Escolha uma senha diferente para sua segurança.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      type="submit" 
                      variant="outline"
                      disabled={isChangingPassword || passwordStrength.score < 60}
                    >
                      {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                    </Button>
                  </form>
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
                  
                  <Button className="btn-primary">Salvar Preferências</Button>
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
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Seus Dados</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Você pode solicitar uma cópia de todos os seus dados ou solicitar a exclusão permanente.
                    </p>
                    <div className="space-x-2">
                      <Button variant="outline">
                        Baixar Meus Dados
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-2">Política de Privacidade</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Consulte nossa política de privacidade para entender como tratamos seus dados.
                    </p>
                    <Button variant="link" className="p-0" onClick={() => navigate('/privacidade')}>
                      Ler Política de Privacidade
                    </Button>
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
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Zona Perigosa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-destructive">Excluir Conta</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta ação é permanente e não pode ser desfeita. Todos os seus dados, pedidos e histórico serão removidos.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Minha Conta
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá excluir permanentemente sua conta
                            e remover todos os seus dados de nossos servidores.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? 'Excluindo...' : 'Sim, excluir minha conta'}
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
