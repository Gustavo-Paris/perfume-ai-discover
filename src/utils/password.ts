import { supabase } from '@/integrations/supabase/client';

export const sha1Hex = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
};

export type PasswordStrength = {
  score: number; // 0-100
  label: 'Fraca' | 'Média' | 'Forte';
};

export const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password) return { score: 0, label: 'Fraca' };
  let score = 0;

  const length = password.length;
  if (length >= 12) score += 40;
  else if (length >= 8) score += 25;
  else if (length >= 6) score += 10;

  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  score = Math.min(100, score);

  let label: PasswordStrength['label'] = 'Fraca';
  if (score >= 70) label = 'Forte';
  else if (score >= 40) label = 'Média';

  return { score, label };
};

export const checkPasswordPwned = async (password: string): Promise<{ pwned: boolean; count: number | null }> => {
  try {
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const { data, error } = await supabase.functions.invoke('password-pwned-check', {
      body: { prefix },
    });

    if (error) {
      console.warn('password-pwned-check invocation error:', error);
      return { pwned: false, count: null };
    }

    const match = (data?.suffixes as Array<{ suffix: string; count: number }> | undefined)?.find(
      (s) => s.suffix.toUpperCase() === suffix.toUpperCase()
    );

    if (match) return { pwned: true, count: match.count };
    return { pwned: false, count: null };
  } catch (e) {
    console.warn('checkPasswordPwned failed:', e);
    return { pwned: false, count: null };
  }
};
