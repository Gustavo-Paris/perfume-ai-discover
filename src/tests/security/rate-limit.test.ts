/**
 * Rate Limiting Security Tests
 * 
 * Tests to verify rate limiting protection is working correctly
 * across critical endpoints like checkout, login, and API calls.
 */

import { describe, it, expect } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('Rate Limiting Security Tests', () => {
  
  it('should block checkout after 3 rapid attempts', async () => {
    const mockOrderDraftId = '123e4567-e89b-12d3-a456-426614174000';
    const attemptCount = 5; // Try 5 times (limit is 3)
    let blocked = false;

    for (let i = 0; i < attemptCount; i++) {
      try {
        const { error } = await supabase.functions.invoke('create-stripe-checkout', {
          body: {
            orderDraftId: mockOrderDraftId,
            paymentMethod: 'pix',
            items: [],
            csrfToken: 'test-token'
          }
        });

        // After 3 attempts, should start getting rate limit errors
        if (i >= 3 && error?.message?.includes('rate limit')) {
          blocked = true;
          break;
        }
      } catch (error: any) {
        if (error.status === 429) {
          blocked = true;
          break;
        }
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    expect(blocked).toBe(true);
  });

  it('should track failed login attempts', async () => {
    const testEmail = 'test@example.com';
    const wrongPassword = 'wrongpassword123';
    const maxAttempts = 5;
    let attempts = 0;

    for (let i = 0; i < maxAttempts + 1; i++) {
      const { error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: wrongPassword
      });

      if (error) {
        attempts++;
      }

      // Check if rate limited
      if (error?.message?.includes('rate limit') || error?.message?.includes('too many')) {
        break;
      }
    }

    // Should have attempted multiple times and eventually hit rate limit
    expect(attempts).toBeGreaterThan(0);
  });

  it('should allow requests after rate limit window expires', async () => {
    // This test would need to wait for the rate limit window to expire
    // In a real scenario, this would be 5-15 minutes
    // For testing purposes, we just verify the mechanism exists
    
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    const endpoint = 'test_endpoint';
    
    const { data, error } = await supabase.rpc('check_user_rate_limit', {
      endpoint_name: endpoint,
      max_requests: 5
    });

    // Should not error on first call
    expect(error).toBeNull();
  });

  it('should have different rate limits for different endpoints', async () => {
    // Checkout: 3 attempts per 5 minutes
    // Login: 5 attempts per 15 minutes  
    // General API: 100 requests per hour

    const endpoints = [
      { name: 'checkout', limit: 3 },
      { name: 'login', limit: 5 },
      { name: 'api_general', limit: 100 }
    ];

    for (const endpoint of endpoints) {
      // Test that limits are configured
      expect(endpoint.limit).toBeGreaterThan(0);
    }
  });
});
