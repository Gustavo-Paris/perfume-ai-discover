
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

    if (existingShipment && existingShipment.pdf_url) {
      // Create new HTML label for existing shipment
      const mockLabelHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Etiqueta de Envio - ${existingShipment.tracking_code}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
    .label { border: 2px solid #000; padding: 20px; max-width: 400px; margin: 0 auto; }
    .header { text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 20px; }
    .field { margin: 10px 0; }
    .tracking { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
    @media print { body { margin: 0; } .label { border: none; } }
  </style>
</head>
<body>
  <div class="label">
    <div class="header">ETIQUETA DE ENVIO - MODO SANDBOX</div>
    <div class="tracking">${existingShipment.tracking_code}</div>
    <div class="field"><strong>Pedido:</strong> ${order.order_number}</div>
    <div class="field"><strong>Serviço:</strong> ${order.shipping_service || 'PAC'}</div>
    <div class="field"><strong>Prazo:</strong> ${order.shipping_deadline || 5} dias úteis</div>
    <div class="field"><strong>Destinatário:</strong><br>
      ${order.shipping_address || 'Endereço não disponível'}
    </div>
    <div class="field" style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
      Esta é uma etiqueta simulada para testes.<br>
      Pressione Ctrl+P para imprimir.
    </div>
  </div>
</body>
</html>`
      
      const updatedPdfUrl = `data:text/html;charset=utf-8,${encodeURIComponent(mockLabelHtml)}`
      
      // Update the existing shipment with working PDF URL
      await supabase
        .from('shipments')
        .update({ pdf_url: updatedPdfUrl })
        .eq('id', existingShipment.id)

      return new Response(
        JSON.stringify({
          success: true,
          shipment: { ...existingShipment, pdf_url: updatedPdfUrl },
          melhor_envio_data: {
            cart_id: existingShipment.melhor_envio_cart_id,
            tracking_code: existingShipment.tracking_code,
            pdf_url: updatedPdfUrl
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // MODO SANDBOX/MOCK - Simular criação de etiqueta
    console.log('Simulando criação de etiqueta para pedido:', order.order_number)

    // Generate mock data
    const mockCartId = `MOCK_${Date.now()}`
    const mockTrackingCode = `BR${order.order_number}${Math.random().toString(36).substring(2, 8).toUpperCase()}BR`
    
    // Create a simple HTML page as mock PDF
    const mockLabelHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Etiqueta de Envio - ${mockTrackingCode}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .label { border: 2px solid #000; padding: 20px; max-width: 400px; }
    .header { text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 20px; }
    .field { margin: 10px 0; }
    .tracking { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
    @media print { body { margin: 0; } .label { border: none; } }
  </style>
</head>
<body>
  <div class="label">
    <div class="header">ETIQUETA DE ENVIO - MODO SANDBOX</div>
    <div class="tracking">${mockTrackingCode}</div>
    <div class="field"><strong>Pedido:</strong> ${order.order_number}</div>
    <div class="field"><strong>Serviço:</strong> ${order.shipping_service || 'PAC'}</div>
    <div class="field"><strong>Prazo:</strong> ${order.shipping_deadline || 5} dias úteis</div>
    <div class="field"><strong>Destinatário:</strong><br>
      ${order.shipping_name}<br>
      ${order.shipping_address}<br>
      ${order.shipping_city} - ${order.shipping_state}<br>
      CEP: ${order.shipping_zipcode}
    </div>
    <div class="field" style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
      Esta é uma etiqueta simulada para testes.<br>
      Pressione Ctrl+P para imprimir.
    </div>
  </div>
</body>
</html>`
    
    const mockPdfUrl = `data:text/html;charset=utf-8,${encodeURIComponent(mockLabelHtml)}`

    // Create or update shipment record
    const shipmentData = {
      order_id: orderId,
      melhor_envio_cart_id: mockCartId,
      melhor_envio_shipment_id: mockCartId,
      tracking_code: mockTrackingCode,
      pdf_url: mockPdfUrl,
      status: 'label_printed',
      service_name: order.shipping_service || 'PAC',
      service_price: order.shipping_cost,
      estimated_delivery_days: order.shipping_deadline || 5
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

    console.log('Etiqueta simulada criada com sucesso:', mockTrackingCode)

    return new Response(
      JSON.stringify({
        success: true,
        shipment: shipmentResult.data,
        melhor_envio_data: {
          cart_id: mockCartId,
          tracking_code: mockTrackingCode,
          pdf_url: mockPdfUrl
        },
        mock: true,
        message: 'Etiqueta simulada criada (modo sandbox)'
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
