
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN')
    if (!melhorEnvioToken) {
      throw new Error('MELHOR_ENVIO_TOKEN not configured')
    }

    // Get order details
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

    // Check if shipment already exists
    const { data: existingShipment } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (existingShipment && existingShipment.status !== 'pending') {
      return new Response(
        JSON.stringify({ 
          error: 'Etiqueta já foi processada para este pedido',
          shipment: existingShipment
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate package details
    let totalWeight = 0
    let totalValue = order.total_amount
    
    order.order_items.forEach(item => {
      const itemWeight = item.size_ml * 0.8 // 1ml ≈ 0.8g
      totalWeight += itemWeight * item.quantity
    })

    const weight = Math.max(totalWeight, 100) // minimum 100g
    const addressData = order.address_data

    // Map shipping service to Melhor Envio service IDs
    const getServiceId = (shippingService: string): number => {
      const serviceMap: { [key: string]: number } = {
        'PAC': 1,
        'SEDEX': 2,
        '.Package': 3,
        '.Com': 4
      }
      return serviceMap[shippingService] || 1 // Default to PAC
    }

    // Step 1: Add to cart - SIMPLIFIED FOR SANDBOX
    const cartPayload = {
      service: getServiceId(order.shipping_service || 'PAC'),
      from: {
        name: "Loja Teste",
        phone: "1199999999",
        email: "teste@teste.com",
        document: "11144477735",
        company_document: "11222333000181",
        state_register: "",
        postal_code: "01310100",
        address: "Rua Teste",
        number: "100",
        district: "Centro",
        city: "São Paulo",
        state_abbr: "SP",
        country_id: "BR"
      },
      to: {
        name: addressData.name || "Cliente Teste",
        phone: "1199999999",
        email: "cliente@teste.com",
        document: "11144477735", // Valid CPF format for testing
        postal_code: (addressData.cep || "89990000").replace(/\D/g, ''),
        address: addressData.street || "Rua Cliente",
        number: addressData.number || "1", 
        district: addressData.district || "Centro",
        city: addressData.city || "Cidade",
        state_abbr: addressData.state || "SC",
        country_id: "BR",
        complement: addressData.complement || ""
      },
      products: [{
        name: "Produto Teste",
        quantity: 1,
        unitary_value: Math.max(totalValue, 10), // Mínimo R$ 10 para sandbox
        weight: Math.max(weight / 1000, 0.1) // Mínimo 100g
      }],
      volumes: [{
        height: 10,
        width: 10,
        length: 15,
        weight: Math.max(weight / 1000, 0.1)
      }],
      options: {
        insurance_value: Math.max(totalValue, 10),
        receipt: false,
        own_hand: false,
        reverse: false,
        non_commercial: true // Para sandbox sem validação NFe
      }
    }

    console.log('Adding to cart:', JSON.stringify(cartPayload, null, 2))

    const cartResponse = await fetch('https://sandbox.melhorenvio.com.br/api/v2/me/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${melhorEnvioToken}`,
        'User-Agent': 'parisco.dev/0.1 (gustavo.b.paris@gmail.com)'
      },
      body: JSON.stringify(cartPayload)
    })

    if (!cartResponse.ok) {
      const errorData = await cartResponse.text()
      console.error('Cart API Error:', cartResponse.status, errorData)
      throw new Error(`Erro ao adicionar ao carrinho: ${cartResponse.status} - ${errorData}`)
    }

    const cartData = await cartResponse.json()
    console.log('Cart response:', cartData)

    const cartId = cartData.id
    if (!cartId) {
      throw new Error('ID do carrinho não retornado')
    }

    // Step 2: Checkout (purchase)
    const checkoutResponse = await fetch('https://sandbox.melhorenvio.com.br/api/v2/me/shipment/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${melhorEnvioToken}`,
        'User-Agent': 'parisco.dev/0.1 (gustavo.b.paris@gmail.com)'
      },
      body: JSON.stringify({
        orders: [cartId]
      })
    })

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text()
      console.error('Checkout API Error:', checkoutResponse.status, errorData)
      throw new Error(`Erro no checkout: ${checkoutResponse.status} - ${errorData}`)
    }

    const checkoutData = await checkoutResponse.json()
    console.log('Checkout response:', checkoutData)

    // Step 3: Generate label
    const printResponse = await fetch('https://sandbox.melhorenvio.com.br/api/v2/me/shipment/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${melhorEnvioToken}`,
        'User-Agent': 'parisco.dev/0.1 (gustavo.b.paris@gmail.com)'
      },
      body: JSON.stringify({
        orders: [cartId]
      })
    })

    if (!printResponse.ok) {
      const errorData = await printResponse.text()
      console.error('Print API Error:', printResponse.status, errorData)
      throw new Error(`Erro ao gerar etiqueta: ${printResponse.status} - ${errorData}`)
    }

    const printData = await printResponse.json()
    console.log('Print response:', printData)

    // Create or update shipment record
    const shipmentData = {
      order_id: orderId,
      melhor_envio_cart_id: cartId,
      melhor_envio_shipment_id: cartData.protocol || cartId,
      tracking_code: cartData.tracking || `ME${cartId}`,
      pdf_url: printData.url || null,
      status: 'label_printed',
      service_name: order.shipping_service,
      service_price: order.shipping_cost,
      estimated_delivery_days: order.shipping_deadline
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

    return new Response(
      JSON.stringify({
        success: true,
        shipment: shipmentResult.data,
        melhor_envio_data: {
          cart_id: cartId,
          tracking_code: cartData.tracking || `ME${cartId}`,
          pdf_url: printData.url
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in me-buy-label:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Verifique os logs para mais detalhes'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
