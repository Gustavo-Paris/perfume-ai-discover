import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { reviewId, comment, rating } = await req.json();
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use AI to moderate the review content
    const moderationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a content moderator for a perfume e-commerce site. Analyze reviews for:
            1. Inappropriate language or offensive content
            2. Spam or promotional content
            3. Fake or unrealistic reviews
            4. Off-topic content not related to perfumes
            
            Respond with a JSON object containing:
            - "approved": boolean (true if content should be approved)
            - "reason": string (brief explanation if rejected)
            - "confidence": number (0-1, confidence in decision)
            - "tags": array of strings (content categories: "spam", "offensive", "fake", "irrelevant", "positive", "negative", "neutral")`
          },
          {
            role: 'user',
            content: `Review to moderate:
            Rating: ${rating}/5 stars
            Comment: "${comment}"`
          }
        ],
        temperature: 0.3,
      }),
    });

    const aiResponse = await moderationResponse.json();
    const moderation = JSON.parse(aiResponse.choices[0].message.content);

    // Update review status based on AI moderation
    const newStatus = moderation.approved ? 'approved' : 'rejected';
    
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        status: newStatus,
        moderation_result: moderation,
        moderated_at: new Date().toISOString()
      })
      .eq('id', reviewId);

    if (updateError) throw updateError;

    // Log security audit event
    try {
      const { data: review } = await supabase
        .from('reviews')
        .select('user_id, rating, perfume_id')
        .eq('id', reviewId)
        .single();
        
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: review?.user_id || null,
          event_type: 'admin_access',
          event_description: `Review ${moderation.approved ? 'aprovada' : 'rejeitada'} via moderação automática`,
          risk_level: 'medium',
          resource_type: 'review',
          resource_id: reviewId,
          metadata: {
            review_id: reviewId,
            approved: moderation.approved,
            moderation_reason: moderation.reason,
            moderation_confidence: moderation.confidence,
            rating: review?.rating,
            perfume_id: review?.perfume_id
          }
        });
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError);
    }

    // If approved, trigger notification to user
    if (moderation.approved) {
      const { data: review } = await supabase
        .from('reviews')
        .select('user_id, perfume_id, perfumes(name)')
        .eq('id', reviewId)
        .single();

      if (review) {
        const perfumeName = (review.perfumes as any)?.name || 'perfume';
        await supabase
          .from('notifications')
          .insert({
            user_id: review.user_id,
            type: 'review_approved',
            message: `Sua avaliação do perfume ${perfumeName} foi aprovada!`,
            metadata: {
              review_id: reviewId,
              perfume_id: review.perfume_id
            }
          });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      status: newStatus,
      moderation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in moderate-review function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});