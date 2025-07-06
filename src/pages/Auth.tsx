import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const isRecovery = searchParams.get('type') === 'recovery';
  const {
    signIn,
    signUp,
    resetPassword,
    updatePassword
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [resetForm, setResetForm] = useState({
    email: ''
  });
  const [newPasswordForm, setNewPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  });
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const {
      error
    } = await signIn(loginForm.email, loginForm.password);
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!"
      });
      navigate('/');
    }
    setIsLoading(false);
  };
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
    if (signupForm.password.length < 6) {
      toast({
        title: "Erro no cadastro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    const {
      error
    } = await signUp(signupForm.email, signupForm.password, signupForm.name);
    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message === 'User already registered' ? 'Este email já está cadastrado' : error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta"
      });
    }
    setIsLoading(false);
  };
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const {
      error
    } = await resetPassword(resetForm.email);
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
    }
    setIsLoading(false);
  };
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
    setIsLoading(true);
    const {
      error
    } = await updatePassword(newPasswordForm.password);
    if (error) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Senha alterada com sucesso!",
        description: "Você já pode usar sua nova senha"
      });
      navigate('/');
    }
    setIsLoading(false);
  };
  return <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex justify-center">
            <h1 className="font-display font-bold text-2xl text-brand-gradient">
              Paris & Co
            </h1>
          </Link>
          <p className="text-sm text-gray-600 mt-1 font-display font-medium my-0 text-center">Parfums</p>
        </div>

        <Tabs defaultValue={isRecovery ? "new-password" : "login"} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="login" className="font-display">Entrar</TabsTrigger>
            <TabsTrigger value="signup" className="font-display">Cadastrar</TabsTrigger>
            <TabsTrigger value="reset" className="font-display">Esqueci</TabsTrigger>
            <TabsTrigger value="new-password" className="font-display" disabled={!isRecovery}>Nova Senha</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="font-display text-navy">Entrar na sua conta</CardTitle>
                <CardDescription className="text-gray-600">
                  Entre com seu email e senha para acessar sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="font-display text-gray-700">Email</Label>
                    <Input id="login-email" type="email" placeholder="seu@email.com" value={loginForm.email} onChange={e => setLoginForm({
                    ...loginForm,
                    email: e.target.value
                  })} required className="font-display" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="font-display text-gray-700">Senha</Label>
                    <Input id="login-password" type="password" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({
                    ...loginForm,
                    password: e.target.value
                  })} required className="font-display" />
                  </div>
                  <Button type="submit" className="w-full bg-navy hover:bg-navy/90 text-white font-display font-medium" disabled={isLoading}>
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
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="font-display text-gray-700">Nome</Label>
                    <Input id="signup-name" type="text" placeholder="Seu nome" value={signupForm.name} onChange={e => setSignupForm({
                    ...signupForm,
                    name: e.target.value
                  })} required className="font-display" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="font-display text-gray-700">Email</Label>
                    <Input id="signup-email" type="email" placeholder="seu@email.com" value={signupForm.email} onChange={e => setSignupForm({
                    ...signupForm,
                    email: e.target.value
                  })} required className="font-display" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="font-display text-gray-700">Senha</Label>
                    <Input id="signup-password" type="password" placeholder="••••••••" value={signupForm.password} onChange={e => setSignupForm({
                    ...signupForm,
                    password: e.target.value
                  })} required minLength={6} className="font-display" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="font-display text-gray-700">Confirmar Senha</Label>
                    <Input id="signup-confirm-password" type="password" placeholder="••••••••" value={signupForm.confirmPassword} onChange={e => setSignupForm({
                    ...signupForm,
                    confirmPassword: e.target.value
                  })} required minLength={6} className="font-display" />
                  </div>
                  <Button type="submit" className="w-full bg-navy hover:bg-navy/90 text-white font-display font-medium" disabled={isLoading}>
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
                      onChange={e => setResetForm({
                        ...resetForm,
                        email: e.target.value
                      })} 
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
                  Digite sua nova senha
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
                      onChange={e => setNewPasswordForm({
                        ...newPasswordForm,
                        password: e.target.value
                      })} 
                      required 
                      minLength={6}
                      className="font-display" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password" className="font-display text-gray-700">Confirmar Nova Senha</Label>
                    <Input 
                      id="confirm-new-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={newPasswordForm.confirmPassword} 
                      onChange={e => setNewPasswordForm({
                        ...newPasswordForm,
                        confirmPassword: e.target.value
                      })} 
                      required 
                      minLength={6}
                      className="font-display" 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-navy hover:bg-navy/90 text-white font-display font-medium" 
                    disabled={isLoading}
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
    </div>;
};
export default Auth;