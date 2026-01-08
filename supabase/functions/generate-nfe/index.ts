import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

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
  const logger = createLogger('generate-nfe');
  logger.start();

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { order_id }: GenerateNFERequest = await req.json();
    logger.debug("Request received", { order_id });

    if (!order_id) {
      logger.error("Missing order_id in request");
      throw new Error('order_id is required');
    }

    logger.important("Generating NFE", { order_id, environment: isProduction ? 'PRODUCTION' : 'HOMOLOGATION' });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados do pedido
    logger.debug("Fetching order details");
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
      logger.error("Order fetch error", { error: orderError.message });
      throw new Error('Erro ao buscar dados do pedido: ' + orderError.message);
    }

    if (!order) {
      logger.error("Order not found");
      throw new Error('Pedido não encontrado');
    }

    logger.debug("Order found", {
      order_number: order.order_number,
      items_count: order.order_items?.length || 0
    });

    // Verificar se já existe NF-e para este pedido
    const { data: existingNote } = await supabase
      .from('fiscal_notes')
      .select('*')
      .eq('order_id', order_id)
      .maybeSingle();

    if (existingNote) {
      logger.warn("NF-e já existe para este pedido");
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
      logger.error('Erro ao buscar empresa', { error: companyError.message });
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
    
    const tokenSource = focusToken 
      ? (isProduction ? Deno.env.get('FOCUS_NFE_TOKEN') : Deno.env.get('FOCUS_NFE_HOMOLOG_TOKEN')) 
        ? 'environment'
        : 'database'
      : 'none';

    logger.debug('Token info', {
      isProduction,
      tokenSource,
      hasToken: !!focusToken
    });
    
    if (!focusToken) {
      const errorMsg = isProduction 
        ? 'Token Focus NFe de PRODUÇÃO não configurado. Acesse focusnfe.com.br para obter um token válido.'
        : 'Token Focus NFe de HOMOLOGAÇÃO não configurado. Acesse https://homologacao.focusnfe.com.br/ para criar uma conta gratuita e obter um token de testes.';
      
      throw new Error(`${errorMsg} Configure em Admin > Empresa.`);
    }

    // Gerar número da nota
    const { data: noteNumber } = await supabase.rpc('generate_fiscal_note_number');

    // Criar dados da NF-e
    const addressData = order.address_data;
    
    // VALIDAÇÃO OBRIGATÓRIA: CPF/CNPJ do destinatário
    if (!addressData.cpf_cnpj || addressData.cpf_cnpj.trim() === '') {
      logger.error('CPF/CNPJ não informado no endereço');
      throw new Error('CPF ou CNPJ do destinatário é obrigatório para emissão de Nota Fiscal. Por favor, atualize o endereço de entrega com o CPF ou CNPJ.');
    }

    // Validar CPF/CNPJ usando função do banco
    const { data: isValid, error: validationError } = await supabase
      .rpc('validate_cpf_cnpj', { doc: addressData.cpf_cnpj });

    if (validationError) {
      logger.error('Erro ao validar CPF/CNPJ', { error: validationError.message });
      throw new Error('Erro ao validar CPF/CNPJ: ' + validationError.message);
    }

    if (!isValid) {
      logger.error('CPF/CNPJ inválido');
      const cpfCnpjClean = addressData.cpf_cnpj.replace(/\D/g, '');
      const docType = cpfCnpjClean.length === 11 ? 'CPF' : cpfCnpjClean.length === 14 ? 'CNPJ' : 'documento';
      throw new Error(`${docType} inválido: ${addressData.cpf_cnpj}. Por favor, verifique o número e tente novamente.`);
    }

    logger.debug('CPF/CNPJ validado com sucesso');
    
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

    logger.debug('Enviando dados para Focus NFe', { noteNumber: nfeData.numero });

    // Enviar para Focus NFe
    const focusResponse = await fetch(focusNfeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(focusToken + ':')}`
      },
      body: JSON.stringify(nfeData)
    });

    if (!focusResponse.ok) {
      const errorText = await focusResponse.text();
      logger.error('Focus NFe API error', { status: focusResponse.status, statusText: focusResponse.statusText, body: errorText });
      
      // Mensagens específicas para erros comuns
      let userFriendlyError = `Focus NFe API error: ${focusResponse.status} - ${errorText}`;
      
      if (focusResponse.status === 401) {
        if (isProduction) {
          userFriendlyError = '❌ Token de PRODUÇÃO inválido ou expirado. Verifique seu token em focusnfe.com.br';
        } else {
          userFriendlyError = '❌ Token de HOMOLOGAÇÃO inválido. ATENÇÃO: Você está usando ambiente de HOMOLOGAÇÃO. Obtenha um token de homologação em https://homologacao.focusnfe.com.br/ (não use token de produção em homologação!)';
        }
      } else if (focusResponse.status === 403) {
        userFriendlyError = '❌ Acesso negado. Verifique se o token tem permissões para emitir NF-e.';
      } else if (focusResponse.status === 422) {
        userFriendlyError = `❌ Dados inválidos para emissão da NF-e: ${errorText}`;
      }
      
      throw new Error(userFriendlyError);
    }

    const focusResult = await focusResponse.json();
    logger.debug('Focus NFe response', { status: focusResult.status, ref: focusResult.ref });

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
      logger.error('Failed to save fiscal note', { error: noteError.message });
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
      logger.warn('Failed to save fiscal note items', { error: itemsError.message });
    }

    // Enviar email automaticamente com retry
    if (focusResult.status === 'autorizado' && focusResult.caminho_danfe) {
      logger.debug('Attempting to send NFe email', { email: addressData.email });

      let emailSent = false;
      let lastError = null;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries && !emailSent; attempt++) {
        try {
          logger.debug('Email attempt', { attempt, maxRetries });

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
          logger.debug('NFe email sent successfully', { attempt });

        } catch (emailError) {
          lastError = emailError;
          logger.warn('Email attempt failed', { attempt, error: emailError instanceof Error ? emailError.message : String(emailError) });

          // Exponential backoff: wait before retry
          if (attempt < maxRetries) {
            const waitMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            await new Promise(resolve => setTimeout(resolve, waitMs));
          }
        }
      }

      // Log final email status
      if (!emailSent) {
        logger.error('Failed to send NFe email after retries', { maxRetries, error: lastError instanceof Error ? lastError.message : String(lastError) });
        
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
          logger.warn('Failed to create admin notification', { error: notifError instanceof Error ? notifError.message : String(notifError) });
        }
      }
    } else if (focusResult.status !== 'autorizado') {
      logger.debug('NFe not yet authorized, email not sent', { status: focusResult.status });
    }

    logger.success('NFe generated', {
      nfe_number: noteNumber,
      nfe_key: focusResult.chave_nfe || 'pending',
      status: focusResult.status
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
      logger.warn('Failed to log audit event', { error: auditError instanceof Error ? auditError.message : String(auditError) });
    }

    return new Response(
      JSON.stringify({
        success: true,
        request_id: logger.requestId,
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

    logger.failure('Failed to generate NFe', error, { order_id: orderId });

    // Create notifications for all admins about NFe failure
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: adminRoles, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminError) {
        logger.warn('Failed to fetch admin users', { error: adminError.message });
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
            request_id: logger.requestId,
            retry_available: true
          }
        }));

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          logger.warn('Failed to create admin notifications', { error: notifError.message });
        }
      }
    } catch (notifError) {
      logger.warn('Error creating notifications', { error: notifError instanceof Error ? notifError.message : String(notifError) });
    }

    return new Response(
      JSON.stringify({
        success: false,
        request_id: logger.requestId,
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