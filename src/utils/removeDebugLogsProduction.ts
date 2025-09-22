// Production debug log cleanup utility
// Automatically removes debug logs from production builds

export const debugLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEBUG]', ...args);
  }
};

export const debugError = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('[DEBUG ERROR]', ...args);
  } else {
    // In production, only log critical errors to monitoring service
    console.error('[CRITICAL]', args[0]);
  }
};

export const debugWarn = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[DEBUG WARN]', ...args);
  }
};

// Performance monitoring for critical operations
export const performanceLog = (operation: string, startTime: number) => {
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PERF] ${operation}: ${duration.toFixed(2)}ms`);
  }
  
  // In production, only log slow operations
  if (duration > 1000) {
    console.warn(`[SLOW OPERATION] ${operation}: ${duration.toFixed(2)}ms`);
  }
};