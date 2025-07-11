// Cookie management utilities for LGPD compliance
export const COOKIE_NAMES = {
  PRIVACY_CHAT: 'privacyChat',
  ANALYTICS_CONSENT: 'analyticsConsent',
} as const;

export const COOKIE_EXPIRY_DAYS = 30;

export interface CookieOptions {
  expires?: number; // days
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export const setCookie = (
  name: string, 
  value: string, 
  options: CookieOptions = {}
): void => {
  console.log('setCookie called with:', { name, value, options });
  
  // Primeiro tenta definir o cookie
  const simpleCookie = `${name}=${value}; path=/; SameSite=Lax`;
  document.cookie = simpleCookie;
  
  // Verifica se funcionou
  const testRead = document.cookie.split(';').find(c => c.trim().startsWith(`${name}=`));
  
  if (!testRead) {
    // Se cookies não funcionam, usa localStorage como fallback
    console.log('Cookies não funcionam, usando localStorage');
    try {
      localStorage.setItem(`cookie_${name}`, JSON.stringify({
        value,
        expires: Date.now() + (COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      }));
      console.log('Salvo no localStorage:', `cookie_${name}`);
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  } else {
    console.log('Cookie definido com sucesso');
  }
};

export const getCookie = (name: string): string | null => {
  // Primeiro tenta buscar no cookie
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const value = decodeURIComponent(c.substring(nameEQ.length, c.length));
      return value;
    }
  }
  
  // Se não encontrou no cookie, verifica localStorage
  try {
    const localStorageKey = `cookie_${name}`;
    const stored = localStorage.getItem(localStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Verifica se não expirou
      if (parsed.expires > Date.now()) {
        return parsed.value;
      } else {
        // Remove se expirou
        localStorage.removeItem(localStorageKey);
      }
    }
  } catch (error) {
    console.error('Erro ao ler localStorage:', error);
  }
  
  return null;
};

export const deleteCookie = (name: string, path: string = '/'): void => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
};

export const hasConsent = (consentType: keyof typeof COOKIE_NAMES): boolean => {
  const cookieName = COOKIE_NAMES[consentType];
  const consent = getCookie(cookieName);
  return consent === 'true';
};

export const giveConsent = (consentType: keyof typeof COOKIE_NAMES): void => {
  const cookieName = COOKIE_NAMES[consentType];
  setCookie(cookieName, 'true', { expires: COOKIE_EXPIRY_DAYS });
};

export const revokeConsent = (consentType: keyof typeof COOKIE_NAMES): void => {
  const cookieName = COOKIE_NAMES[consentType];
  deleteCookie(cookieName);
};

// IP address detection for logging
export const getClientIP = (): string | null => {
  // In a real application, this would need server-side detection
  // For client-side, we can't reliably get the real IP
  return null;
};

// User agent detection
export const getClientUserAgent = (): string => {
  return navigator.userAgent;
};

// Privacy-related validation
export const isValidConsentType = (type: string): type is keyof typeof COOKIE_NAMES => {
  return Object.keys(COOKIE_NAMES).includes(type as keyof typeof COOKIE_NAMES);
};