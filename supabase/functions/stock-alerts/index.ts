import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface StockAlertResponse {
  success: boolean;
  alertCount: number;
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

    console.log('Checking for low stock alerts...');

    // Call the stock alert function
    const { data: alertCount, error } = await supabase
      .rpc('check_low_stock_alerts');

    if (error) {
      console.error('Error checking stock alerts:', error);
      throw error;
    }

    console.log(`Created ${alertCount} new stock alerts`);

    const response: StockAlertResponse = {
      success: true,
      alertCount: alertCount || 0,
      message: `Created ${alertCount || 0} new stock alerts`,
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
    console.error('Error in stock-alerts function:', error);
    
    const errorResponse = {
      success: false,
      alertCount: 0,
      message: error.message || 'Failed to check stock alerts',
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