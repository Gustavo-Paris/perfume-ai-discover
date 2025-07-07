import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const email = searchParams.get('email');
  const type = searchParams.get('type') || 'all';

  useEffect(() => {
    if (email) {
      handleUnsubscribe();
    } else {
      setStatus('error');
    }
  }, [email]);

  const handleUnsubscribe = async () => {
    try {
      const { error } = await supabase
        .from('privacy_consents')
        .upsert({
          user_id: null,
          consent_type: 'email_unsubscribe',
          consented: false,
          metadata: { email, unsubscribe_type: type }
        });

      if (error) throw error;
      setStatus('success');
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'success' ? (
              <CheckCircle className="h-16 w-16 text-green-600" />
            ) : (
              <Mail className="h-16 w-16 text-blue-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'success' ? 'Descadastro Realizado' : 'Processando...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <p className="text-muted-foreground">
              Processando seu descadastro...
            </p>
          )}
          
          {status === 'success' && (
            <>
              <p className="text-muted-foreground">
                Você foi removido da nossa lista de emails com sucesso.
              </p>
              <p className="text-sm text-muted-foreground">
                Lamentamos vê-lo partir. Você ainda pode gerenciar suas preferências 
                através da sua conta.
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <p className="text-red-600">
                Ocorreu um erro ao processar seu descadastro.
              </p>
              <Button onClick={() => window.location.reload()}>
                Tentar Novamente
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;