import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface AnalyticsConfig {
  gaMeasurementId: string | null;
  sentryDsn: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const rawSentryDsn = Deno.env.get("SENTRY_DSN");
    const rawGaMeasurementId = Deno.env.get("GA_MEASUREMENT_ID");
    
    // Validate Sentry DSN format
    const isValidSentryDsn = (dsn: string): boolean => {
      const sentryDsnPattern = /^https:\/\/[a-f0-9]+@[a-f0-9]+\.ingest\.sentry\.io\/\d+$/;
      return sentryDsnPattern.test(dsn);
    };

    const config: AnalyticsConfig = {
      gaMeasurementId: rawGaMeasurementId || null,
      sentryDsn: rawSentryDsn && isValidSentryDsn(rawSentryDsn) ? rawSentryDsn : null,
    };

    // Log validation results (helpful for debugging)
    if (rawSentryDsn && !isValidSentryDsn(rawSentryDsn)) {
      console.warn("Invalid Sentry DSN format detected, not returning to client");
    }

    return new Response(JSON.stringify(config), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in public-analytics-config:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
