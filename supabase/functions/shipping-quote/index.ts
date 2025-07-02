
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cep, items } = await req.json()

    if (!cep || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'CEP e itens são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN')
    if (!melhorEnvioToken) {
      throw new Error('MELHOR_ENVIO_TOKEN not configured')
    }

    // Calculate total weight and dimensions
    let totalWeight = 0
    let totalValue = 0
    
    items.forEach(item => {
      // Estimate weight based on perfume size (ml to grams conversion)
      const itemWeight = item.size_ml * 0.8 // 1ml of perfume ≈ 0.8g
      totalWeight += itemWeight * item.quantity
      totalValue += item.unit_price * item.quantity
    })

    // Minimum weight and dimensions for perfume packaging
    const weight = Math.max(totalWeight, 100) // minimum 100g
    const length = 15 // cm
    const height = 10 // cm  
    const width = 10 // cm

    const quotePayload = {
      from: {
        postal_code: "01310-100" // São Paulo - SP (sandbox origin)
      },
      to: {
        postal_code: cep
      },
      products: [{
        id: "perfume-package",
        width: width,
        height: height,
        length: length,
        weight: weight / 1000, // convert to kg
        insurance_value: totalValue,
        quantity: 1
      }]
    }

    const response = await fetch('https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${melhorEnvioToken}`,
        'User-Agent': 'parisco.dev/0.1 (gustavo.b.paris@gmail.com)'
      },
      body: JSON.stringify(quotePayload)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Melhor Envio API Error:', errorData)
      throw new Error(`Melhor Envio API error: ${response.status}`)
    }

    const quotes = await response.json()
    
    // Transform quotes to our format
    const formattedQuotes = quotes
      .filter(quote => quote.error === null || quote.error === undefined)
      .map(quote => ({
        service: quote.name,
        company: quote.company.name,
        price: parseFloat(quote.price),
        deadline: parseInt(quote.delivery_time),
        service_id: quote.id,
        company_id: quote.company.id
      }))

    return new Response(
      JSON.stringify(formattedQuotes),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in shipping-quote:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
