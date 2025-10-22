import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Simple TOTP verification implementation
function verifyTOTP(secret: string, token: string): boolean {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  
  // Decode base32 secret
  const decode = (str: string): Uint8Array => {
    const cleanStr = str.replace(/=+$/, '');
    const bytes: number[] = [];
    let bits = 0;
    let value = 0;

    for (let i = 0; i < cleanStr.length; i++) {
      const char = cleanStr[i];
      const idx = base32Chars.indexOf(char.toUpperCase());
      
      if (idx === -1) continue;
      
      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return new Uint8Array(bytes);
  };

  // HMAC-SHA1 implementation
  const hmacSha1 = async (key: Uint8Array, message: Uint8Array): Promise<Uint8Array> => {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
    return new Uint8Array(signature);
  };

  // Generate TOTP
  const generateTOTP = async (secret: string, timeStep: number): Promise<string> => {
    const key = decode(secret);
    const time = Math.floor(Date.now() / 1000 / 30); // 30 second time step
    const timeBuffer = new Uint8Array(8);
    
    // Convert time to bytes (big-endian)
    for (let i = 7; i >= 0; i--) {
      timeBuffer[i] = time & 0xff;
      time >>> 8;
    }

    const hmac = await hmacSha1(key, timeBuffer);
    
    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    );

    const otp = (code % 1000000).toString().padStart(6, '0');
    return otp;
  };

  // Verify token (check current time window and ±1 window for clock drift)
  const verify = async (): Promise<boolean> => {
    const currentTime = Math.floor(Date.now() / 1000 / 30);
    
    for (let i = -1; i <= 1; i++) {
      const timeStep = currentTime + i;
      const expectedToken = await generateTOTP(secret, timeStep);
      
      if (expectedToken === token) {
        return true;
      }
    }
    
    return false;
  };

  return verify();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { secret, token } = await req.json();

    if (!secret || !token) {
      throw new Error('Secret and token are required');
    }

    // Verify the TOTP token
    const isValid = await verifyTOTP(secret, token);

    return new Response(
      JSON.stringify({ valid: isValid }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to verify 2FA token',
        valid: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
