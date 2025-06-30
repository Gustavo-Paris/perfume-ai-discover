
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import algoliasearch from 'https://esm.sh/algoliasearch@4'

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

    const client = algoliasearch(algoliaAppId, algoliaAdminKey);
    const index = client.initIndex('perfumes');

    // Get all perfumes from database
    const { data: perfumes, error } = await supabaseClient
      .from('perfumes')
      .select('*');

    if (error) {
      throw error;
    }

    // Transform perfumes for Algolia
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
      price_5ml: perfume.price_5ml,
      image_url: perfume.image_url,
      gender: perfume.gender,
    }));

    // Save objects to Algolia
    await index.saveObjects(algoliaObjects);

    console.log(`Synced ${algoliaObjects.length} perfumes to Algolia`);

    return new Response(JSON.stringify({ 
      message: `Successfully synced ${algoliaObjects.length} perfumes to Algolia` 
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
