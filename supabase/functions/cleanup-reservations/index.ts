import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface ReservationCleanupResponse {
  success: boolean;
  deletedCount: number;
  message: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting cleanup of expired reservations...');

    // Call the cleanup function
    const { data: deletedCount, error } = await supabase
      .rpc('cleanup_expired_reservations');

    if (error) {
      console.error('Error cleaning up reservations:', error);
      throw error;
    }

    console.log(`Cleaned up ${deletedCount} expired reservations`);

    const response: ReservationCleanupResponse = {
      success: true,
      deletedCount: deletedCount || 0,
      message: `Successfully cleaned up ${deletedCount || 0} expired reservations`,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in cleanup-reservations function:', error);
    
    const errorResponse = {
      success: false,
      deletedCount: 0,
      message: error.message || 'Failed to cleanup expired reservations',
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);