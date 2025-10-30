import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

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
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] ========== NFE GENERATION START ==========`);
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { order_id }: GenerateNFERequest = await req.json();
    console.log(`[${requestId}] Request body:`, { order_id });
    
    if (!order_id) {
      console.error(`[${requestId}] Missing order_id in request`);
      throw new Error('order_id is required');
    }

    console.log(`[${requestId}] Generating NFE for order:`, order_id);
    console.log(`[${requestId}] Environment:`, isProduction ? 'PRODUCTION' : 'HOMOLOGATION');
    console.log(`[${requestId}] Focus NFe URL:`, focusNfeUrl);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados do pedido
    console.log(`[${requestId}] Fetching order details`);
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
      .maybeSingle();

    if (orderError) {
      console.error(`[${requestId}] Order fetch error:`, orderError);
      throw new Error('Erro ao buscar dados do pedido: ' + orderError.message);
    }
    
    if (!order) {
      console.error(`[${requestId}] Order not found`);
      throw new Error('Pedido não encontrado');
    }

    console.log(`[${requestId}] Order found:`, { 
      order_number: order.order_number,
      items_count: order.order_items?.length || 0,
      total_amount: order.total_amount
    });

    // Verificar se já existe NF-e para este pedido
    const { data: existingNote } = await supabase
      .from('fiscal_notes')
      .select('*')
      .eq('order_id', order_id)
      .maybeSingle();

    if (existingNote) {
      console.log('NF-e já existe para este pedido');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'NF-e já existe para este pedido',
          existing_note: existingNote 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Buscar configurações da empresa
    const { data: company, error: companyError } = await supabase
      .from('company_info')
      .select('*')
      .maybeSingle();

    if (companyError) {
      console.error('Erro ao buscar empresa:', companyError);
      throw new Error('Erro ao buscar configurações da empresa: ' + companyError.message);
    }
    
    if (!company) {
      throw new Error('Configurações da empresa não encontradas - configure primeiro em Admin > Sistema > Dados da Empresa');
    }

    // Get appropriate token based on environment
    // Priority: Environment-specific token > Company token (from DB) > Generic token
    const focusToken = isProduction 
      ? (Deno.env.get('FOCUS_NFE_TOKEN') || company.focus_nfe_token)
      : (Deno.env.get('FOCUS_NFE_HOMOLOG_TOKEN') || company.focus_nfe_token || Deno.env.get('FOCUS_NFE_TOKEN'));
    
    console.log('Debug token info:', {
      isProduction,
      environment: isProduction ? 'PRODUCTION' : 'HOMOLOGATION',
      hasCompanyToken: !!company.focus_nfe_token,
      hasEnvToken: !!(isProduction ? Deno.env.get('FOCUS_NFE_TOKEN') : Deno.env.get('FOCUS_NFE_HOMOLOG_TOKEN')),
      tokenSource: focusToken 
        ? (isProduction ? Deno.env.get('FOCUS_NFE_TOKEN') : Deno.env.get('FOCUS_NFE_HOMOLOG_TOKEN')) 
          ? 'environment'
          : 'database'
        : 'none',
      hasToken: !!focusToken
    });
    
    if (!focusToken) {
      throw new Error(`Token Focus NFe não configurado. Configure em Admin > Empresa ou adicione ${isProduction ? 'FOCUS_NFE_TOKEN' : 'FOCUS_NFE_HOMOLOG_TOKEN'} nas variáveis de ambiente.`);
    }

    // Gerar número da nota
    const { data: noteNumber } = await supabase.rpc('generate_fiscal_note_number');

    // Criar dados da NF-e
    const addressData = order.address_data;
    
    // VALIDAÇÃO OBRIGATÓRIA: CPF/CNPJ do destinatário
    if (!addressData.cpf_cnpj || addressData.cpf_cnpj.trim() === '') {
      console.error('CPF/CNPJ não informado no endereço');
      throw new Error('CPF ou CNPJ do destinatário é obrigatório para emissão de Nota Fiscal. Por favor, atualize o endereço de entrega com o CPF ou CNPJ.');
    }

    // Validar CPF/CNPJ usando função do banco
    const { data: isValid, error: validationError } = await supabase
      .rpc('validate_cpf_cnpj', { doc: addressData.cpf_cnpj });

    if (validationError) {
      console.error('Erro ao validar CPF/CNPJ:', validationError);
      throw new Error('Erro ao validar CPF/CNPJ: ' + validationError.message);
    }

    if (!isValid) {
      console.error('CPF/CNPJ inválido:', addressData.cpf_cnpj);
      const cpfCnpjClean = addressData.cpf_cnpj.replace(/\D/g, '');
      const docType = cpfCnpjClean.length === 11 ? 'CPF' : cpfCnpjClean.length === 14 ? 'CNPJ' : 'documento';
      throw new Error(`${docType} inválido: ${addressData.cpf_cnpj}. Por favor, verifique o número e tente novamente.`);
    }

    console.log('CPF/CNPJ validado com sucesso:', addressData.cpf_cnpj);
    
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
        cpf_cnpj: addressData.cpf_cnpj.replace(/\D/g, ''),
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
        const fiscalData = item.perfume?.fiscal_data?.[0];
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
    console.log('Enviando para Focus NFe URL:', focusNfeUrl);
    const focusResponse = await fetch(focusNfeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(focusToken + ':')}`
      },
      body: JSON.stringify(nfeData)
    });

    if (!focusResponse.ok) {
      console.error('Focus NFe response not ok:', focusResponse.status, focusResponse.statusText);
      const errorText = await focusResponse.text();
      console.error('Focus NFe error body:', errorText);
      throw new Error(`Focus NFe API error: ${focusResponse.status} - ${errorText}`);
    }

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
    const noteItems = order.order_items.map((item: any, index: number) => {
      const fiscalData = item.perfume?.fiscal_data?.[0];
      return {
        fiscal_note_id: fiscalNote.id,
        order_item_id: item.id,
        numero_item: index + 1,
        codigo_produto: item.perfume.id,
        descricao: `${item.perfume.brand} - ${item.perfume.name} ${item.size_ml}ml`,
        ncm: fiscalData?.ncm || '3303.00.10',
        cfop: fiscalData?.cfop || '5102',
        unidade_comercial: 'UN',
        quantidade: item.quantity,
        valor_unitario: parseFloat(item.unit_price),
        valor_total: parseFloat(item.total_price),
        valor_icms: 0,
        valor_pis: 0,
        valor_cofins: 0,
        valor_ipi: 0
      };
    });

    const { error: itemsError } = await supabase
      .from('fiscal_note_items')
      .insert(noteItems);

    if (itemsError) {
      console.error('Erro ao salver itens da nota:', itemsError);
    }

    // Enviar email automaticamente com retry
    if (focusResult.status === 'autorizado' && focusResult.caminho_danfe) {
      console.log(`[${requestId}] Attempting to send NFe email to:`, addressData.email);
      
      let emailSent = false;
      let lastError = null;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries && !emailSent; attempt++) {
        try {
          console.log(`[${requestId}] Email attempt ${attempt}/${maxRetries}`);
          
          const emailResponse = await supabase.functions.invoke('send-email', {
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
          
          if (emailResponse.error) {
            throw emailResponse.error;
          }
          
          emailSent = true;
          console.log(`[${requestId}] ✅ NFe email sent successfully on attempt ${attempt}`);
          
        } catch (emailError) {
          lastError = emailError;
          console.error(`[${requestId}] ❌ Email attempt ${attempt} failed:`, emailError);
          
          // Exponential backoff: wait before retry
          if (attempt < maxRetries) {
            const waitMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.log(`[${requestId}] Waiting ${waitMs}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitMs));
          }
        }
      }
      
      // Log final email status
      if (!emailSent) {
        console.error(`[${requestId}] ❌ Failed to send email after ${maxRetries} attempts. Last error:`, lastError);
        
        // Create notification for admin about email failure
        try {
          const { data: adminRoles } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin');
          
          if (adminRoles && adminRoles.length > 0) {
            await supabase
              .from('notifications')
              .insert(adminRoles.map(admin => ({
                type: 'system',
                message: `Falha ao enviar email de NFe para ${addressData.email} (Pedido ${order.order_number})`,
                user_id: admin.user_id,
                metadata: {
                  order_id: order_id,
                  order_number: order.order_number,
                  nfe_number: noteNumber,
                  recipient_email: addressData.email,
                  error: lastError instanceof Error ? lastError.message : String(lastError)
                }
              })));
          }
        } catch (notifError) {
          console.error(`[${requestId}] Failed to create notification:`, notifError);
        }
      }
    } else if (focusResult.status !== 'autorizado') {
      console.log(`[${requestId}] ⏳ NFe not yet authorized (status: ${focusResult.status}), email will not be sent`);
    }
    console.log(`[${requestId}] ✅ NFe generated successfully:`, {
      nfe_number: noteNumber,
      nfe_key: focusResult.chave_nfe || 'pending',
      status: focusResult.status,
      has_pdf: !!focusResult.caminho_danfe,
      has_xml: !!focusResult.caminho_xml_nota_fiscal
    });
    
    // Log security audit event
    try {
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: order.user_id || null,
          event_type: 'sensitive_data_access',
          event_description: `NF-e gerada: #${noteNumber} para pedido ${order.order_number}`,
          risk_level: 'medium',
          resource_type: 'fiscal_note',
          resource_id: fiscalNote.id,
          metadata: {
            order_id: order_id,
            order_number: order.order_number,
            nfe_number: noteNumber,
            nfe_key: focusResult.chave_nfe,
            nfe_status: focusResult.status,
            valor_total: order.total_amount,
            environment: isProduction ? 'production' : 'homologation'
          }
        });
    } catch (auditError) {
      console.warn(`[${requestId}] Failed to log audit event:`, auditError);
    }
    
    console.log(`[${requestId}] ========== NFE GENERATION END ==========`);

    return new Response(
      JSON.stringify({
        success: true,
        request_id: requestId,
        fiscal_note: fiscalNote,
        focus_response: focusResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const orderId = (error as any)?.order_id || 'unknown';
    
    console.error(`[${requestId}] ❌ FATAL ERROR generating NFe:`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      order_id: orderId
    });
    
    // Create notifications for all admins about NFe failure
    try {
      console.log(`[${requestId}] Creating admin notifications for NFe failure`);
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: adminRoles, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (adminError) {
        console.error(`[${requestId}] Failed to fetch admin users:`, adminError);
      } else if (adminRoles && adminRoles.length > 0) {
        // Try to get order_number if we have orderId
        let orderNumber = null;
        if (orderId !== 'unknown') {
          const { data: orderData } = await supabase
            .from('orders')
            .select('order_number')
            .eq('id', orderId)
            .maybeSingle();
          orderNumber = orderData?.order_number;
        }
        
        const notifications = adminRoles.map(admin => ({
          type: 'system',
          message: `Falha na geração de NFe para pedido ${orderNumber || orderId}`,
          user_id: admin.user_id,
          metadata: {
            order_id: orderId,
            order_number: orderNumber,
            error: errorMessage,
            request_id: requestId,
            retry_available: true
          }
        }));
        
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);
        
        if (notifError) {
          console.error(`[${requestId}] Failed to create admin notifications:`, notifError);
        } else {
          console.log(`[${requestId}] ✅ Created ${notifications.length} admin notification(s)`);
        }
      }
    } catch (notifError) {
      console.error(`[${requestId}] Error creating notifications:`, notifError);
    }
    
    console.log(`[${requestId}] ========== NFE GENERATION END (ERROR) ==========`);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        request_id: requestId,
        error: errorMessage,
        details: 'Verifique os logs da função para mais detalhes' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});