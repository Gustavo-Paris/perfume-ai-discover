
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const algoliaAppId = Deno.env.get('ALGOLIA_APP_ID');
    const algoliaAdminKey = Deno.env.get('ALGOLIA_ADMIN_KEY');

    if (!algoliaAppId || !algoliaAdminKey) {
      console.log('Algolia credentials not configured');
      return new Response(JSON.stringify({ message: 'Algolia not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get all perfumes from database
    const { data: perfumes, error } = await supabaseClient
      .from('perfumes')
      .select('id, name, brand, family, top_notes, heart_notes, base_notes, price_full, image_url');

    if (error) {
      throw error;
    }

    // Transform perfumes for Algolia - only include fields we need for search
    const algoliaObjects = perfumes.map(perfume => ({
      objectID: perfume.id,
      id: perfume.id,
      name: perfume.name,
      brand: perfume.brand,
      family: perfume.family,
      notes: [
        ...(perfume.top_notes || []),
        ...(perfume.heart_notes || []),
        ...(perfume.base_notes || [])
      ].join(', '),
      price_full: perfume.price_full,
      image_url: perfume.image_url,
    }));

    // Use direct HTTP request to Algolia instead of the SDK
    const algoliaUrl = `https://${algoliaAppId}-dsn.algolia.net/1/indexes/perfumes/batch`;
    
    const algoliaResponse = await fetch(algoliaUrl, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': algoliaAdminKey,
        'X-Algolia-Application-Id': algoliaAppId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            action: 'clear'
          },
          {
            action: 'addObject',
            body: algoliaObjects
          }
        ]
      })
    });

    if (!algoliaResponse.ok) {
      const errorText = await algoliaResponse.text();
      console.error('Algolia API error:', errorText);
      throw new Error(`Algolia API error: ${algoliaResponse.status} - ${errorText}`);
    }

    const algoliaResult = await algoliaResponse.json();
    console.log(`Synced ${algoliaObjects.length} perfumes to Algolia`, algoliaResult);

    return new Response(JSON.stringify({ 
      message: `Successfully synced ${algoliaObjects.length} perfumes to Algolia`,
      result: algoliaResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error syncing to Algolia:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
