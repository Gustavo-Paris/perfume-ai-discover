
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Melhor Envio API Base URL (Sandbox)
const MELHOR_ENVIO_API_URL = 'https://sandbox.melhorenvio.com.br/api/v2/me'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { orderId } = await req.json()

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get order details WITH address details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          perfumes (
            id,
            name,
            brand
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error('Pedido não encontrado')
    }

    // Get customer profile for additional data (optional)
    let profile = null;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', order.user_id)
        .single();
      profile = data;
    } catch (error) {
      console.log('Profile not found, using fallback data');
    }

    // Get company info for valid CNPJ/CPF (optional)
    let companyInfo = null;
    try {
      const { data } = await supabase
        .from('company_info')
        .select('*')
        .limit(1)
        .single();
      companyInfo = data;
    } catch (error) {
      console.log('Company info not found, using fallback data');
    }

    // Check if shipment already exists
    const { data: existingShipment } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .single()

    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_API_TOKEN')
    if (!melhorEnvioToken) {
      throw new Error('Token do Melhor Envio não configurado')
    }

    const apiHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${melhorEnvioToken}`,
    }

    console.log('Iniciando processo de criação de etiqueta via Melhor Envio API para pedido:', order.order_number)

    // Check if shipment already exists and has a cart_id
    if (existingShipment?.melhor_envio_cart_id) {
      try {
        // Try to get existing labels
        const labelsResponse = await fetch(`${MELHOR_ENVIO_API_URL}/shipment/print`, {
          method: 'POST',
          headers: apiHeaders,
          body: JSON.stringify({
            orders: [existingShipment.melhor_envio_cart_id]
          })
        })

        if (labelsResponse.ok) {
          const labelsData = await labelsResponse.json()
          const pdfUrl = labelsData.url || labelsData.pdf || labelsData

          if (pdfUrl) {
            // Update shipment with new PDF URL
            await supabase
              .from('shipments')
              .update({ pdf_url: pdfUrl })
              .eq('id', existingShipment.id)

            return new Response(
              JSON.stringify({
                success: true,
                shipment: { ...existingShipment, pdf_url: pdfUrl },
                melhor_envio_data: {
                  cart_id: existingShipment.melhor_envio_cart_id,
                  tracking_code: existingShipment.tracking_code,
                  pdf_url: pdfUrl
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log('Erro ao recuperar etiqueta existente, criando nova:', errorMessage)
      }
    }

    // Parse address data from order
    const addressData = order.address_data || {}
    
    // Step 1: Create a cart
    const cartPayload = {
      service: 1, // Correios PAC
      from: {
        name: companyInfo?.razao_social || "Perfumaria do Chapecó",
        phone: "(49) 99999-9999",
        email: "contato@perfumariadochapeco.com.br",
        document: companyInfo?.inscricao_estadual || "11144477735", // CPF da empresa
        company_document: companyInfo?.cnpj || "11222333000181", // CNPJ válido para sandbox
        state_register: companyInfo?.inscricao_estadual || "123456789",
        postal_code: "89814000",
        address: "Rua Florianópolis - D",
        number: "828",
        district: "Jardim Itália",
        city: "Chapecó",
        state_abbr: "SC",
        country_id: "BR"
      },
      to: {
        name: profile?.name || addressData.name || "Cliente",
        phone: addressData.phone || "(00) 00000-0000",
        email: profile?.email || "cliente@email.com",
        document: addressData.cpf || "12345678909", // CPF válido para sandbox (diferente do remetente)
        postal_code: addressData.cep?.replace(/\D/g, '') || "00000000",
        address: addressData.street || "Endereço não informado",
        number: addressData.number || "S/N",
        district: addressData.district || "Centro",
        city: addressData.city || "Cidade",
        state_abbr: addressData.state || "SC",
        country_id: "BR"
      },
      products: order.order_items?.map((item: any) => ({
        name: `${item.perfumes.brand} - ${item.perfumes.name} (${item.size_ml}ml)`,
        quantity: item.quantity,
        unitary_value: parseFloat(item.unit_price)
      })) || [],
      volumes: [{
        height: 10,
        width: 15,
        length: 20,
        weight: 0.3
      }],
      options: {
        insurance_value: parseFloat(order.subtotal || 0),
        receipt: false,
        own_hand: false
      }
    }

    console.log('Criando carrinho no Melhor Envio com payload:', JSON.stringify(cartPayload, null, 2))

    // Create cart
    const cartResponse = await fetch(`${MELHOR_ENVIO_API_URL}/cart`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify(cartPayload)
    })

    if (!cartResponse.ok) {
      const errorText = await cartResponse.text()
      console.error('Erro ao criar carrinho:', errorText)
      throw new Error(`Erro ao criar carrinho no Melhor Envio: ${cartResponse.status} - ${errorText}`)
    }

    const cartData = await cartResponse.json()
    console.log('Carrinho criado:', cartData)

    const cartId = cartData.id
    if (!cartId) {
      throw new Error('ID do carrinho não retornado pela API')
    }

    // Step 2: Purchase the cart
    console.log('Comprando carrinho:', cartId)
    const purchaseResponse = await fetch(`${MELHOR_ENVIO_API_URL}/shipment/checkout`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({
        orders: [cartId]
      })
    })

    if (!purchaseResponse.ok) {
      const errorText = await purchaseResponse.text()
      console.error('Erro ao comprar carrinho:', errorText)
      throw new Error(`Erro ao comprar carrinho: ${purchaseResponse.status} - ${errorText}`)
    }

    const purchaseData = await purchaseResponse.json()
    console.log('Carrinho comprado:', purchaseData)

    // Step 3: Generate labels
    console.log('Gerando etiquetas para carrinho:', cartId)
    const labelsResponse = await fetch(`${MELHOR_ENVIO_API_URL}/shipment/generate`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({
        orders: [cartId]
      })
    })

    if (!labelsResponse.ok) {
      const errorText = await labelsResponse.text()
      console.error('Erro ao gerar etiquetas:', errorText)
      throw new Error(`Erro ao gerar etiquetas: ${labelsResponse.status} - ${errorText}`)
    }

    const labelsData = await labelsResponse.json()
    console.log('Etiquetas geradas:', labelsData)

    // Step 4: Get PDF URL
    console.log('Obtendo URL do PDF das etiquetas')
    const printResponse = await fetch(`${MELHOR_ENVIO_API_URL}/shipment/print`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({
        orders: [cartId]
      })
    })

    if (!printResponse.ok) {
      const errorText = await printResponse.text()
      console.error('Erro ao obter PDF:', errorText)
      throw new Error(`Erro ao obter PDF: ${printResponse.status} - ${errorText}`)
    }

    const printData = await printResponse.json()
    console.log('Dados do PDF:', printData)

    const pdfUrl = printData.url || printData.pdf || printData
    const trackingCode = cartData.tracking || `ME${cartId}`

    // Create or update shipment record
    const shipmentData = {
      order_id: orderId,
      melhor_envio_cart_id: cartId,
      melhor_envio_shipment_id: cartId,
      tracking_code: trackingCode,
      pdf_url: pdfUrl,
      status: 'label_printed',
      service_name: 'PAC',
      service_price: order.shipping_cost,
      estimated_delivery_days: 5
    }

    let shipmentResult
    if (existingShipment) {
      const { data, error } = await supabase
        .from('shipments')
        .update(shipmentData)
        .eq('id', existingShipment.id)
        .select()
        .single()
      
      shipmentResult = { data, error }
    } else {
      const { data, error } = await supabase
        .from('shipments')
        .insert(shipmentData)
        .select()
        .single()
      
      shipmentResult = { data, error }
    }

    if (shipmentResult.error) {
      console.error('Database error:', shipmentResult.error)
      throw new Error('Erro ao salvar dados da remessa')
    }

    // Update order status
    await supabase
      .from('orders')
      .update({ status: 'processing' })
      .eq('id', orderId)

    console.log('Etiqueta criada com sucesso via Melhor Envio API:', trackingCode)

    return new Response(
      JSON.stringify({
        success: true,
        shipment: shipmentResult.data,
        melhor_envio_data: {
          cart_id: cartId,
          tracking_code: trackingCode,
          pdf_url: pdfUrl
        },
        message: 'Etiqueta criada com sucesso (Melhor Envio Sandbox)'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in me-buy-label:', error)
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Verifique os logs para mais detalhes'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
