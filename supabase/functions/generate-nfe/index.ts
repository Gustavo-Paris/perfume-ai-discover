import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Environment detection - use homologation for testing
const isProduction = Deno.env.get('FOCUS_NFE_ENVIRONMENT') === 'production';
const focusNfeUrl = isProduction 
  ? 'https://api.focusnfe.com.br/v2/nfe'
  : 'https://homologacao.focusnfe.com.br/v2/nfe';

interface GenerateNFERequest {
  order_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id }: GenerateNFERequest = await req.json();
    console.log('Generating NFE for order:', order_id);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados do pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          perfume:perfumes (
            *,
            fiscal_data:product_fiscal_data (*)
          )
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Pedido não encontrado');
    }

    // Verificar se já existe NF-e para este pedido
    const { data: existingNote } = await supabase
      .from('fiscal_notes')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (existingNote) {
      return new Response(
        JSON.stringify({ error: 'NF-e já existe para este pedido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Buscar configurações da empresa
    const { data: company, error: companyError } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (companyError || !company) {
      throw new Error('Configurações da empresa não encontradas');
    }

    // Get appropriate token based on environment
    const focusToken = isProduction 
      ? company.focus_nfe_token 
      : Deno.env.get('FOCUS_NFE_HOMOLOG_TOKEN');
    
    if (!focusToken) {
      throw new Error(`Token Focus NFe não configurado para ambiente ${isProduction ? 'produção' : 'homologação'}`);
    }

    // Gerar número da nota
    const { data: noteNumber } = await supabase.rpc('generate_fiscal_note_number');

    // Criar dados da NF-e
    const addressData = order.address_data;
    
    const nfeData = {
      cnpj_emitente: company.cnpj.replace(/\D/g, ''),
      natureza_operacao: "Venda de mercadoria",
      serie: 1,
      numero: noteNumber,
      data_emissao: new Date().toISOString().split('T')[0],
      tipo_documento: 1,
      presenca_comprador: 9, // Operação não presencial pela Internet
      modalidade_frete: 0, // Contratação do frete por conta do remetente (CIF)
      destino: {
        cpf_cnpj: addressData.cpf_cnpj?.replace(/\D/g, '') || '',
        nome: addressData.name || '',
        endereco: addressData.street || '',
        numero: addressData.number || 'S/N',
        complemento: addressData.complement || '',
        bairro: addressData.neighborhood || '',
        cep: addressData.zipcode?.replace(/\D/g, '') || '',
        cidade: addressData.city || '',
        uf: addressData.state || '',
        telefone: addressData.phone?.replace(/\D/g, '') || '',
        email: addressData.email || ''
      },
      itens: order.order_items.map((item: any, index: number) => {
        const fiscalData = item.perfume.fiscal_data[0];
        return {
          numero_item: index + 1,
          codigo_produto: item.perfume.id,
          descricao: `${item.perfume.brand} - ${item.perfume.name} ${item.size_ml}ml`,
          cfop: fiscalData?.cfop || '5102',
          unidade_comercial: 'UN',
          quantidade: item.quantity,
          valor_unitario: parseFloat(item.unit_price),
          valor_bruto: parseFloat(item.total_price),
          ncm: fiscalData?.ncm || '3303.00.10',
          origem: fiscalData?.origem_mercadoria || '0',
          icms: {
            situacao_tributaria: fiscalData?.icms_situacao_tributaria || '102',
            aliquota: fiscalData?.icms_aliquota || 0,
            valor: 0
          },
          pis: {
            situacao_tributaria: fiscalData?.pis_situacao_tributaria || '49',
            aliquota: fiscalData?.pis_aliquota || 0,
            valor: 0
          },
          cofins: {
            situacao_tributaria: fiscalData?.cofins_situacao_tributaria || '49',
            aliquota: fiscalData?.cofins_aliquota || 0,
            valor: 0
          }
        };
      })
    };

    console.log('Enviando dados para Focus NFe:', JSON.stringify(nfeData, null, 2));

    // Enviar para Focus NFe
    const focusResponse = await fetch(focusNfeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(focusToken + ':')}`
      },
      body: JSON.stringify(nfeData)
    });

    const focusResult = await focusResponse.json();
    console.log('Resposta Focus NFe:', focusResult);

    // Criar registro da nota fiscal no banco
    const { data: fiscalNote, error: noteError } = await supabase
      .from('fiscal_notes')
      .insert({
        order_id: order_id,
        numero: noteNumber,
        serie: 1,
        status: focusResult.status === 'autorizado' ? 'authorized' : 'pending',
        chave_acesso: focusResult.chave_nfe,
        protocolo_autorizacao: focusResult.protocolo,
        data_emissao: new Date().toISOString(),
        data_autorizacao: focusResult.status === 'autorizado' ? new Date().toISOString() : null,
        valor_total: parseFloat(order.total_amount),
        valor_produtos: parseFloat(order.subtotal),
        valor_icms: 0,
        valor_pis: 0,
        valor_cofins: 0,
        valor_ipi: 0,
        xml_content: focusResult.caminho_xml_nota_fiscal,
        pdf_url: focusResult.caminho_danfe,
        focus_nfe_ref: focusResult.ref,
        erro_message: focusResult.status !== 'autorizado' ? focusResult.mensagem_sefaz : null
      })
      .select()
      .single();

    if (noteError) {
      console.error('Erro ao salvar nota fiscal:', noteError);
      throw new Error('Erro ao salvar nota fiscal no banco de dados');
    }

    // Criar itens da nota fiscal
    const noteItems = order.order_items.map((item: any, index: number) => ({
      fiscal_note_id: fiscalNote.id,
      order_item_id: item.id,
      numero_item: index + 1,
      codigo_produto: item.perfume.id,
      descricao: `${item.perfume.brand} - ${item.perfume.name} ${item.size_ml}ml`,
      ncm: item.perfume.fiscal_data[0]?.ncm || '3303.00.10',
      cfop: item.perfume.fiscal_data[0]?.cfop || '5102',
      unidade_comercial: 'UN',
      quantidade: item.quantity,
      valor_unitario: parseFloat(item.unit_price),
      valor_total: parseFloat(item.total_price),
      valor_icms: 0,
      valor_pis: 0,
      valor_cofins: 0,
      valor_ipi: 0
    }));

    const { error: itemsError } = await supabase
      .from('fiscal_note_items')
      .insert(noteItems);

    if (itemsError) {
      console.error('Erro ao salver itens da nota:', itemsError);
    }

    // Se autorizada, enviar email com PDF
    if (focusResult.status === 'autorizado' && focusResult.caminho_danfe) {
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: addressData.email,
            template: 'nfe_generated',  
            data: {
              customerName: addressData.name,
              orderNumber: order.order_number,
              nfeNumber: noteNumber,
              nfeKey: focusResult.chave_nfe,
              pdfUrl: focusResult.caminho_danfe
            }
          }
        });
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        fiscal_note: fiscalNote,
        focus_response: focusResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Erro ao gerar NF-e:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});