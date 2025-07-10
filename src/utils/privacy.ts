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
  const {
    expires = COOKIE_EXPIRY_DAYS,
    path = '/',
    secure = false, // Simplified for development
    sameSite = 'lax'
  } = options;

  const date = new Date();
  date.setTime(date.getTime() + (expires * 24 * 60 * 60 * 1000));
  
  // Simplified cookie string
  let cookieString = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=${path}; samesite=${sameSite}`;
  
  console.log('Setting cookie:', cookieString);
  document.cookie = cookieString;
  console.log('Cookie set, document.cookie now:', document.cookie);
};

export const getCookie = (name: string): string | null => {
  console.log('getCookie called for:', name);
  console.log('All cookies at read time:', document.cookie);
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  
  console.log('Cookie array:', ca);
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    console.log(`Checking cookie ${i}:`, c, 'starts with', nameEQ, '?', c.indexOf(nameEQ) === 0);
    if (c.indexOf(nameEQ) === 0) {
      const value = decodeURIComponent(c.substring(nameEQ.length, c.length));
      console.log('Found cookie value:', value);
      return value;
    }
  }
  console.log('Cookie not found');
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