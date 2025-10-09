import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorSettings {
  id: string;
  user_id: string;
  enabled: boolean;
  backup_codes: string[];
}

export const useTwoFactor = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateSecret = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Generate a random base32 secret (16 characters)
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const secret = Array.from(
        { length: 16 },
        () => charset[Math.floor(Math.random() * charset.length)]
      ).join('');

      // Generate 8 backup codes
      const backupCodes = Array.from(
        { length: 8 },
        () => Math.random().toString(36).substring(2, 10).toUpperCase()
      );

      // Insert or update 2FA settings
      const { error } = await supabase
        .from('user_2fa_settings')
        .upsert({
          user_id: user.id,
          secret,
          backup_codes: backupCodes,
          enabled: false, // Not enabled until verified
        });

      if (error) throw error;

      return { secret, backupCodes };
    } catch (error: any) {
      toast({
        title: 'Erro ao gerar configuração 2FA',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async (token: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get current settings
      const { data: settings, error: fetchError } = await supabase
        .from('user_2fa_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Verify token using edge function
      const { data, error: verifyError } = await supabase.functions.invoke('verify-2fa', {
        body: { secret: settings.secret, token },
      });

      if (verifyError) throw verifyError;
      if (!data.valid) throw new Error('Código inválido');

      // Enable 2FA
      const { error: updateError } = await supabase
        .from('user_2fa_settings')
        .update({ enabled: true })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Autenticação de dois fatores ativada!',
        description: 'Sua conta está agora mais segura.',
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Erro ao verificar código',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('user_2fa_settings')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: '2FA desativado',
        description: 'Autenticação de dois fatores foi desativada.',
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Erro ao desativar 2FA',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getSettings = async (): Promise<TwoFactorSettings | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_2fa_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching 2FA settings:', error);
      return null;
    }
  };

  const verifyLogin = async (token: string, secret: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-2fa', {
        body: { secret, token },
      });

      if (error) throw error;
      return data.valid;
    } catch (error: any) {
      toast({
        title: 'Erro ao verificar código',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const verifyBackupCode = async (code: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: settings, error: fetchError } = await supabase
        .from('user_2fa_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const codeIndex = settings.backup_codes.indexOf(code.toUpperCase());
      if (codeIndex === -1) {
        throw new Error('Código de backup inválido');
      }

      // Remove used backup code
      const newBackupCodes = settings.backup_codes.filter((_, i) => i !== codeIndex);
      
      const { error: updateError } = await supabase
        .from('user_2fa_settings')
        .update({ backup_codes: newBackupCodes })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return true;
    } catch (error: any) {
      toast({
        title: 'Erro ao verificar código de backup',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    generateSecret,
    verifyAndEnable,
    disable,
    getSettings,
    verifyLogin,
    verifyBackupCode,
  };
};
