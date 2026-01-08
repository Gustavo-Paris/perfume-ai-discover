/**
 * Structured logging helper for Edge Functions
 * Reduces noise in production while maintaining useful debugging in development
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  data?: Record<string, unknown>;
}

// Check if we're in production
const isProduction = Deno.env.get('ENVIRONMENT') === 'production' ||
                     Deno.env.get('DENO_DEPLOYMENT_ID') !== undefined;

/**
 * Create a logger instance for an edge function
 */
export function createLogger(functionName: string) {
  const requestId = crypto.randomUUID().slice(0, 8);

  const formatLog = (entry: LogEntry): string => {
    if (isProduction) {
      // In production, output structured JSON for better log aggregation
      return JSON.stringify({
        fn: functionName,
        rid: entry.requestId || requestId,
        level: entry.level,
        msg: entry.message,
        ts: entry.timestamp,
        ...(entry.data && Object.keys(entry.data).length > 0 ? { data: entry.data } : {})
      });
    }
    // In development, use human-readable format
    const dataStr = entry.data ? ` - ${JSON.stringify(entry.data)}` : '';
    return `[${entry.timestamp}] [${functionName}] [${entry.level.toUpperCase()}] ${entry.message}${dataStr}`;
  };

  const log = (level: LogLevel, message: string, data?: Record<string, unknown>) => {
    // In production, only log warn and error levels unless explicitly important
    if (isProduction && level === 'debug') return;
    if (isProduction && level === 'info' && !data?.important) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId,
      data
    };

    const formatted = formatLog(entry);

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  };

  return {
    requestId,

    /** Debug level - only logged in development */
    debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data),

    /** Info level - only logged in development unless marked as important */
    info: (message: string, data?: Record<string, unknown>) => log('info', message, data),

    /** Warning level - always logged */
    warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),

    /** Error level - always logged */
    error: (message: string, data?: Record<string, unknown>) => log('error', message, data),

    /** Important info - logged even in production */
    important: (message: string, data?: Record<string, unknown>) => log('info', message, { ...data, important: true }),

    /** Log start of function execution */
    start: () => log('info', `Function started`, { important: true }),

    /** Log successful completion */
    success: (message: string, data?: Record<string, unknown>) => log('info', `✅ ${message}`, { ...data, important: true }),

    /** Log failure */
    failure: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => {
      const errorData = error instanceof Error
        ? { errorMessage: error.message, errorStack: error.stack }
        : { errorMessage: String(error) };
      log('error', `❌ ${message}`, { ...data, ...errorData });
    }
  };
}

/**
 * Sanitize sensitive data before logging
 * Remove or mask sensitive fields
 */
export function sanitizeForLog(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cpf', 'cnpj', 'credit_card'];
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    for (const key of Object.keys(sanitized)) {
      if (key.toLowerCase().includes(field)) {
        sanitized[key] = '[REDACTED]';
      }
    }
  }

  return sanitized;
}
