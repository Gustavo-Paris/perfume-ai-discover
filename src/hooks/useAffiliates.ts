import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  commission_rate: number;
  status: string;
  total_earnings: number;
  total_referrals: number;
  created_at: string;
  updated_at: string;
}

export interface AffiliateReferral {
  id: string;
  affiliate_id: string;
  referred_user_id: string | null;
  order_id: string | null;
  commission_amount: number;
  status: string;
  created_at: string;
  confirmed_at: string | null;
}

export const useAffiliates = () => {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar dados do afiliado
  const loadAffiliateData = useCallback(async () => {
    if (!user) {
      console.log('useAffiliates: No user, clearing data');
      setAffiliate(null);
      setReferrals([]);
      setLoading(false);
      return;
    }

    console.log('useAffiliates: Loading data for user:', user.id);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('useAffiliates: Error loading affiliate:', error);
        throw error;
      }

      console.log('useAffiliates: Affiliate data:', data);
      setAffiliate(data);

      if (data) {
        // Carregar referrals
        const { data: referralData, error: referralError } = await supabase
          .from('affiliate_referrals')
          .select('*')
          .eq('affiliate_id', data.id)
          .order('created_at', { ascending: false });

        if (!referralError) {
          console.log('useAffiliates: Referrals loaded:', referralData);
          setReferrals(referralData || []);
        } else {
          console.error('useAffiliates: Error loading referrals:', referralError);
        }
      } else {
        console.log('useAffiliates: User is not an affiliate');
      }
    } catch (error) {
      console.error('useAffiliates: Error loading affiliate data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Aplicar para ser afiliado
  const applyToProgram = useCallback(async (
    userName?: string
  ): Promise<{ success: boolean; affiliate?: Affiliate; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      // Gerar código único
      const { data: affiliateCode, error: codeError } = await supabase
        .rpc('generate_affiliate_code', { user_name: userName });

      if (codeError) {
        throw new Error('Erro ao gerar código de afiliado');
      }

      // Criar registro
      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          affiliate_code: affiliateCode,
          commission_rate: 0.05, // 5% padrão
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setAffiliate(data);
      return { success: true, affiliate: data };
    } catch (error) {
      console.error('Error applying to affiliate program:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao se inscrever' 
      };
    }
  }, [user]);

  // Processar referência de afiliado
  const processAffiliateReferral = useCallback(async (
    affiliateCode: string,
    orderId: string,
    orderTotal: number
  ): Promise<boolean> => {
    try {
      // Buscar afiliado pelo código
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('affiliate_code', affiliateCode)
        .eq('status', 'active')
        .single();

      if (affiliateError || !affiliateData) {
        console.error('Affiliate not found:', affiliateCode);
        return false;
      }

      // Calcular comissão
      const commissionAmount = orderTotal * affiliateData.commission_rate;

      // Criar referral
      const { error: referralError } = await supabase
        .from('affiliate_referrals')
        .insert({
          affiliate_id: affiliateData.id,
          order_id: orderId,
          commission_amount: commissionAmount,
          status: 'pending'
        });

      if (referralError) {
        console.error('Error creating referral:', referralError);
        return false;
      }

      // Atualizar totais do afiliado
      const { error: updateError } = await supabase
        .from('affiliates')
        .update({
          total_referrals: affiliateData.total_referrals + 1,
          total_earnings: affiliateData.total_earnings + commissionAmount
        })
        .eq('id', affiliateData.id);

      if (updateError) {
        console.error('Error updating affiliate totals:', updateError);
      }

      return true;
    } catch (error) {
      console.error('Error processing affiliate referral:', error);
      return false;
    }
  }, []);

  // Confirmar comissão (quando pedido é pago)
  const confirmCommission = useCallback(async (
    orderId: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliate_referrals')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('order_id', orderId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error confirming commission:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error confirming commission:', error);
      return false;
    }
  }, []);

  // Gerar link de afiliado
  const generateAffiliateLink = useCallback((
    path: string = '',
    affiliateCode?: string
  ): string => {
    const baseUrl = window.location.origin;
    const code = affiliateCode || affiliate?.affiliate_code;
    
    if (!code) return baseUrl + path;
    
    const separator = path.includes('?') ? '&' : '?';
    return `${baseUrl}${path}${separator}ref=${code}`;
  }, [affiliate]);

  // Hook para detectar código de afiliado na URL
  const detectAffiliateCode = useCallback((): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      // Salvar no localStorage para persistir durante a sessão
      localStorage.setItem('affiliate_ref', refCode);
      return refCode;
    }
    
    // Verificar se já existe no localStorage
    return localStorage.getItem('affiliate_ref');
  }, []);

  // Limpar código de afiliado (após conversão)
  const clearAffiliateCode = useCallback(() => {
    localStorage.removeItem('affiliate_ref');
  }, []);

  useEffect(() => {
    loadAffiliateData();
  }, [loadAffiliateData]);

  return {
    affiliate,
    referrals,
    loading,
    applyToProgram,
    loadAffiliateData,
    processAffiliateReferral,
    confirmCommission,
    generateAffiliateLink,
    detectAffiliateCode,
    clearAffiliateCode
  };
};