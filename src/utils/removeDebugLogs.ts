// Utilitário para remover logs de debug em produção
// Este arquivo deve ser executado durante o build

const isProduction = process.env.NODE_ENV === 'production';

export const debugLog = (message: string, data?: any) => {
  if (!isProduction) {
    console.log(message, data);
  }
};

export const debugError = (message: string, error?: any) => {
  if (!isProduction) {
    console.error(message, error);
  } else {
    // Em produção, apenas loggar erros críticos
    if (error?.status >= 500) {
      console.error(message, error);
    }
  }
};

export const debugWarn = (message: string, data?: any) => {
  if (!isProduction) {
    console.warn(message, data);
  }
};

// Logger estruturado para produção
export const productionLogger = {
  error: (message: string, context?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  },
  warn: (message: string, context?: any) => {
    console.warn(JSON.stringify({
      level: 'warn', 
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  },
  info: (message: string, context?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message, 
      context,
      timestamp: new Date().toISOString()
    }));
  }
};