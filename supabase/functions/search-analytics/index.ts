import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { query, user_id, results_count, filters, clicked_result_id } = await req.json();

    // Log search query
    const { error: queryError } = await supabase
      .from('search_queries')
      .insert({
        user_id,
        query,
        results_count: results_count || 0,
        clicked_result_id,
        session_id: req.headers.get('x-session-id'),
        user_agent: req.headers.get('user-agent'),
        ip_address: req.headers.get('x-forwarded-for')
      });

    if (queryError) console.error('Query log error:', queryError);

    // Update popular searches
    const { error: popularError } = await supabase
      .from('popular_searches')
      .upsert({
        query: query.toLowerCase().trim(),
        search_count: 1,
        last_searched: new Date().toISOString()
      }, {
        onConflict: 'query',
        ignoreDuplicates: false
      });

    if (popularError) {
      // If upsert failed, try to increment existing
      await supabase.rpc('increment_search_count', { search_query: query.toLowerCase().trim() });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search analytics error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});