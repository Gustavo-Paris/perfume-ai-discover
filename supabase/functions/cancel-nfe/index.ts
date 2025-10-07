import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelNFeRequest {
  fiscal_note_id: string;
  justificativa: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verificar se é admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin') {
      throw new Error('Only admins can cancel fiscal notes');
    }

    const { fiscal_note_id, justificativa }: CancelNFeRequest = await req.json();

    // Validações
    if (!fiscal_note_id || !justificativa) {
      throw new Error('fiscal_note_id and justificativa are required');
    }

    if (justificativa.length < 15) {
      throw new Error('Justificativa must be at least 15 characters');
    }

    console.log(`🔄 Iniciando cancelamento da NFe ${fiscal_note_id}`);

    // Buscar nota fiscal
    const { data: fiscalNote, error: fetchError } = await supabase
      .from('fiscal_notes')
      .select('*')
      .eq('id', fiscal_note_id)
      .single();

    if (fetchError || !fiscalNote) {
      throw new Error('Fiscal note not found');
    }

    if (fiscalNote.status === 'cancelled') {
      throw new Error('Fiscal note is already cancelled');
    }

    if (fiscalNote.status !== 'authorized') {
      throw new Error('Only authorized fiscal notes can be cancelled');
    }

    if (!fiscalNote.focus_nfe_ref) {
      throw new Error('No Focus NFe reference found for this fiscal note');
    }

    // Buscar token do Focus NFe
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('focus_nfe_token, ambiente_nfe')
      .single();

    if (!companySettings?.focus_nfe_token) {
      throw new Error('Focus NFe token not configured');
    }

    const focusToken = companySettings.focus_nfe_token;
    const ambiente = companySettings.ambiente_nfe || 'homologacao';
    const baseUrl = ambiente === 'producao' 
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';

    console.log(`📡 Chamando API Focus NFe: ${baseUrl}/v2/nfes/${fiscalNote.focus_nfe_ref}/cancelamento`);

    // Chamar API Focus NFe para cancelamento
    const focusResponse = await fetch(
      `${baseUrl}/v2/nfes/${fiscalNote.focus_nfe_ref}/cancelamento`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(focusToken + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          justificativa: justificativa,
        }),
      }
    );

    const focusData = await focusResponse.json();
    console.log('📥 Resposta Focus NFe:', focusData);

    if (!focusResponse.ok) {
      throw new Error(
        focusData.mensagem || 
        focusData.erros?.[0]?.mensagem || 
        'Failed to cancel fiscal note with Focus NFe'
      );
    }

    // Atualizar status no banco
    const { error: updateError } = await supabase
      .from('fiscal_notes')
      .update({
        status: 'cancelled',
        erro_message: `Cancelada: ${justificativa}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fiscal_note_id);

    if (updateError) {
      console.error('❌ Erro ao atualizar banco:', updateError);
      throw updateError;
    }

    console.log(`✅ NFe ${fiscal_note_id} cancelada com sucesso`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Fiscal note cancelled successfully',
        data: focusData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Erro no cancelamento:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to cancel fiscal note',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
