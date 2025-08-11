import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRecovery } from '@/contexts/RecoveryContext';
import { supabase } from '@/integrations/supabase/client';
import { getPasswordStrength, checkPasswordPwned } from '@/utils/password';
import { Sentry } from '@/utils/sentry';
const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const { isRecoveryMode, setRecoveryMode } = useRecovery();
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, resetPassword, updatePassword, user, session } = useAuth();

  // Formulários
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [resetForm, setResetForm] = useState({ email: '' });
  const [newPasswordForm, setNewPasswordForm] = useState({ password: '', confirmPassword: '' });

  // Password strength and pwned checks
  const [signupStrength, setSignupStrength] = useState(() => getPasswordStrength(''));
  const [signupPwned, setSignupPwned] = useState<{ checked: boolean; pwned: boolean; count: number | null }>({ checked: false, pwned: false, count: null });
  const [newPassStrength, setNewPassStrength] = useState(() => getPasswordStrength(''));
  const [newPassPwned, setNewPassPwned] = useState<{ checked: boolean; pwned: boolean; count: number | null }>({ checked: false, pwned: false, count: null });

  // Detectar fluxo de recuperação de senha
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('🔄 Auth event:', event);
      if (event === 'PASSWORD_RECOVERY') {
        console.log('🔒 Entering recovery mode');
        setRecoveryMode(true);
        setActiveTab('new-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [setRecoveryMode]);

  // Redirecionar usuários autenticados (mas não durante recovery)
  useEffect(() => {
    console.log('🧭 Navigation check - user:', !!user, 'recoveryMode:', isRecoveryMode);
    if (user && !isRecoveryMode) {
      console.log('➡️ Redirecting to home');
      navigate('/');
    }
  }, [user, navigate, isRecoveryMode]);

  // Login com Google
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        toast({
          title: "Erro no login com Google",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: "Erro no login",
        description: "Não foi possível fazer login com Google",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  // Login com email/senha
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signIn(loginForm.email, loginForm.password);
      
      if (error) {
        toast({
          title: "Erro no login",
          description: error.message === 'Invalid login credentials' 
            ? 'Email ou senha incorretos' 
            : error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta!"
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: "Não foi possível fazer login",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  // Cadastro
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: "Erro no cadastro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    // Strength check
    const strength = getPasswordStrength(signupForm.password);
    if (strength.score < 50) {
      toast({
        title: "Senha fraca",
        description: "Use ao menos 8 caracteres com letras maiúsculas, minúsculas, números e símbolos.",
        variant: "destructive"
      });
      return;
    }

    // Pwned check
    const pwned = await checkPasswordPwned(signupForm.password);
    if (pwned.pwned) {
      Sentry.addBreadcrumb({ category: 'auth', level: 'warning', message: 'Pwned password blocked on signup' });
      toast({
        title: "Senha insegura",
        description: `Esta senha apareceu em ${pwned.count?.toLocaleString?.() ?? pwned.count} vazamentos. Escolha outra senha.`,
        variant: "destructive"
      });
      setSignupPwned({ checked: true, ...pwned });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signUp(signupForm.email, signupForm.password, signupForm.name);
      
      if (error) {
        Sentry.addBreadcrumb({ category: 'auth', level: 'error', message: `Signup error: ${error.message}` });
        toast({
          title: "Erro no cadastro",
          description: error.message === 'User already registered' 
            ? 'Este email já está cadastrado' 
            : error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta"
        });
        setSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
        setSignupStrength(getPasswordStrength(''));
        setSignupPwned({ checked: false, pwned: false, count: null });
      }
    } catch (error) {
      console.error('Signup error:', error);
      Sentry.addBreadcrumb({ category: 'auth', level: 'error', message: 'Unexpected signup error' });
      toast({
        title: "Erro no cadastro",
        description: "Não foi possível criar a conta",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  // Recuperação de senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(resetForm.email);
      
      if (error) {
        toast({
          title: "Erro ao solicitar nova senha",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha"
        });
        setResetForm({ email: '' });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: "Erro na recuperação",
        description: "Não foi possível enviar email de recuperação",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  // Atualizar senha
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPasswordForm.password !== newPasswordForm.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }
    
    if (newPasswordForm.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    // Strength check
    const strength = getPasswordStrength(newPasswordForm.password);
    if (strength.score < 50) {
      toast({
        title: "Senha fraca",
        description: "Use ao menos 8 caracteres com letras maiúsculas, minúsculas, números e símbolos.",
        variant: "destructive"
      });
      return;
    }

    // Pwned check
    const pwned = await checkPasswordPwned(newPasswordForm.password);
    if (pwned.pwned) {
      Sentry.addBreadcrumb({ category: 'auth', level: 'warning', message: 'Pwned password blocked on reset' });
      toast({
        title: "Senha insegura",
        description: `Esta senha apareceu em ${pwned.count?.toLocaleString?.() ?? pwned.count} vazamentos. Escolha outra senha.`,
        variant: "destructive"
      });
      setNewPassPwned({ checked: true, ...pwned });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPasswordForm.password
      });
      
      if (!error) {
        console.log('✅ Password updated successfully');
        toast({
          title: "Senha alterada!",
          description: "Sua senha foi atualizada com sucesso"
        });
        
        setNewPasswordForm({ password: '', confirmPassword: '' });
        setNewPassStrength(getPasswordStrength(''));
        setNewPassPwned({ checked: false, pwned: false, count: null });
        
        console.log('🚪 Signing out...');
        await supabase.auth.signOut();
        
        // Aguardar um pouco para garantir que o signOut seja processado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('🧹 Cleaning up...');
        window.history.replaceState(null, '', window.location.pathname);
        setRecoveryMode(false);
        
        console.log('➡️ Switching to login tab...');
        setActiveTab('login');
      } else {
        Sentry.addBreadcrumb({ category: 'auth', level: 'error', message: `Update password error: ${error.message}` });
        toast({
          title: "Erro ao alterar senha",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Update password error:', error);
      Sentry.addBreadcrumb({ category: 'auth', level: 'error', message: 'Unexpected update password error' });
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex justify-center">
            <h1 className="font-display font-bold text-2xl text-brand-gradient">
              Paris & Co
            </h1>
          </Link>
          <p className="text-sm text-gray-600 mt-1 font-display font-medium">Parfums</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${activeTab === 'new-password' ? 'grid-cols-1' : 'grid-cols-3'}`}>
            {activeTab !== 'new-password' && (
              <>
                <TabsTrigger value="login" className="font-display">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="font-display">Cadastrar</TabsTrigger>
                <TabsTrigger value="reset" className="font-display">Esqueci</TabsTrigger>
              </>
            )}
            {activeTab === 'new-password' && (
              <TabsTrigger value="new-password" className="font-display">Nova Senha</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="login">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="font-display text-navy">Entrar na sua conta</CardTitle>
                <CardDescription className="text-gray-600">
                  Entre com seu email e senha para acessar sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full font-display"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? 'Conectando...' : 'Entrar com Google'}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">ou continue com email</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="font-display text-gray-700">Email</Label>
                    <Input 
                      id="login-email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={loginForm.email} 
                      onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} 
                      required 
                      className="font-display" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="font-display text-gray-700">Senha</Label>
                    <Input 
                      id="login-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={loginForm.password} 
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} 
                      required 
                      className="font-display" 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-navy hover:bg-navy/90 text-white font-display font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="font-display text-navy">Criar conta</CardTitle>
                <CardDescription className="text-gray-600">
                  Cadastre-se para ter acesso completo à nossa loja
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full font-display"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? 'Conectando...' : 'Cadastrar com Google'}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">ou cadastre-se com email</span>
                  </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="font-display text-gray-700">Nome</Label>
                    <Input 
                      id="signup-name" 
                      type="text" 
                      placeholder="Seu nome" 
                      value={signupForm.name} 
                      onChange={e => setSignupForm({ ...signupForm, name: e.target.value })} 
                      required 
                      className="font-display" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="font-display text-gray-700">Email</Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={signupForm.email} 
                      onChange={e => setSignupForm({ ...signupForm, email: e.target.value })} 
                      required 
                      className="font-display" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="font-display text-gray-700">Senha</Label>
                    <Input 
                      id="signup-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={signupForm.password} 
                      onChange={e => {
                        setSignupForm({ ...signupForm, password: e.target.value });
                        setSignupStrength(getPasswordStrength(e.target.value));
                        setSignupPwned({ checked: false, pwned: false, count: null });
                      }} 
                      onBlur={async () => {
                        if (signupForm.password) {
                          const res = await checkPasswordPwned(signupForm.password);
                          setSignupPwned({ checked: true, ...res });
                        }
                      }}
                      required 
                      minLength={6} 
                      className="font-display" 
                    />
                    <div className="space-y-1">
                      <Progress value={signupStrength.score} />
                      <p className="text-xs text-muted-foreground">Força: {signupStrength.label}</p>
                      {signupPwned.checked && signupPwned.pwned && (
                        <p className="text-xs text-destructive">Esta senha apareceu em {signupPwned.count?.toLocaleString?.() ?? signupPwned.count} vazamentos. Escolha outra.</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="font-display text-gray-700">Confirmar Senha</Label>
                    <Input 
                      id="signup-confirm-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={signupForm.confirmPassword} 
                      onChange={e => setSignupForm({ ...signupForm, confirmPassword: e.target.value })} 
                      required 
                      minLength={6} 
                      className="font-display" 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-navy hover:bg-navy/90 text-white font-display font-medium" 
                    disabled={isLoading || signupStrength.score < 50 || (signupPwned.checked && signupPwned.pwned)}
                  >
                    {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reset">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="font-display text-navy">Recuperar Senha</CardTitle>
                <CardDescription className="text-gray-600">
                  Digite seu email para receber instruções de recuperação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="font-display text-gray-700">Email</Label>
                    <Input 
                      id="reset-email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={resetForm.email} 
                      onChange={e => setResetForm({ ...resetForm, email: e.target.value })} 
                      required 
                      className="font-display" 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-navy hover:bg-navy/90 text-white font-display font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Enviando...' : 'Enviar Email de Recuperação'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new-password">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="font-display text-navy">Nova Senha</CardTitle>
                <CardDescription className="text-gray-600">
                  Digite sua nova senha para finalizar a recuperação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="font-display text-gray-700">Nova Senha</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={newPasswordForm.password} 
                      onChange={e => {
                        setNewPasswordForm({ ...newPasswordForm, password: e.target.value });
                        setNewPassStrength(getPasswordStrength(e.target.value));
                        setNewPassPwned({ checked: false, pwned: false, count: null });
                      }} 
                      onBlur={async () => {
                        if (newPasswordForm.password) {
                          const res = await checkPasswordPwned(newPasswordForm.password);
                          setNewPassPwned({ checked: true, ...res });
                        }
                      }}
                      required 
                      minLength={6}
                      className="font-display" 
                    />
                    <div className="space-y-1">
                      <Progress value={newPassStrength.score} />
                      <p className="text-xs text-muted-foreground">Força: {newPassStrength.label}</p>
                      {newPassPwned.checked && newPassPwned.pwned && (
                        <p className="text-xs text-destructive">Esta senha apareceu em {newPassPwned.count?.toLocaleString?.() ?? newPassPwned.count} vazamentos. Escolha outra.</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password" className="font-display text-gray-700">Confirmar Nova Senha</Label>
                    <Input 
                      id="confirm-new-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={newPasswordForm.confirmPassword} 
                      onChange={e => setNewPasswordForm({ ...newPasswordForm, confirmPassword: e.target.value })} 
                      required 
                      minLength={6}
                      className="font-display" 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-navy hover:bg-navy/90 text-white font-display font-medium" 
                    disabled={isLoading || newPassStrength.score < 50 || (newPassPwned.checked && newPassPwned.pwned)}
                  >
                    {isLoading ? 'Atualizando...' : 'Alterar Senha'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-600 hover:text-navy font-display">
            ← Voltar para a loja
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;