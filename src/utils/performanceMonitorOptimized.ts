// Advanced performance monitoring for production
import React from 'react';
import { debugLog, debugWarn, performanceLog } from './removeDebugLogsProduction';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: any;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep only last 1000 metrics
  
  // Track operation performance
  public trackOperation<T>(operation: string, fn: () => T, metadata?: any): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      
      // Handle async operations
      if (result instanceof Promise) {
        return result.then((res) => {
          this.logMetric(operation, startTime, metadata);
          return res;
        }).catch((err) => {
          this.logMetric(`${operation}_ERROR`, startTime, { ...metadata, error: err.message });
          throw err;
        }) as T;
      }
      
      this.logMetric(operation, startTime, metadata);
      return result;
    } catch (error: any) {
      this.logMetric(`${operation}_ERROR`, startTime, { ...metadata, error: error.message });
      throw error;
    }
  }
  
  private logMetric(operation: string, startTime: number, metadata?: any) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      metadata
    };
    
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    // Log performance issues
    performanceLog(operation, startTime);
    
    // Alert on critical performance issues
    if (duration > 5000) { // 5s+
      debugWarn(`CRITICAL SLOW OPERATION: ${operation} took ${duration.toFixed(2)}ms`);
    } else if (duration > 2000) { // 2s+
      debugWarn(`SLOW OPERATION: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }
  
  // Get performance statistics
  public getStats() {
    if (this.metrics.length === 0) return null;
    
    const durations = this.metrics.map(m => m.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);
    
    return {
      totalOperations: this.metrics.length,
      averageDuration: avg,
      maxDuration: max,
      minDuration: min,
      slowOperations: this.metrics.filter(m => m.duration > 1000).length
    };
  }
  
  // Clear metrics
  public clear() {
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// HOC for monitoring React components
export function withPerformanceTracking<T extends {}>(
  Component: React.ComponentType<T>,
  componentName?: string
) {
  const name = componentName || Component.displayName || Component.name || 'UnknownComponent';
  
  return function PerformanceTrackedComponent(props: T) {
    const startTime = React.useRef(performance.now());
    
    React.useEffect(() => {
      const renderTime = performance.now() - startTime.current;
      performanceLog(`${name}_render`, startTime.current);
      
      return () => {
        const unmountTime = performance.now();
        debugLog(`${name} unmounted after ${unmountTime - startTime.current}ms`);
      };
    }, []);
    
    return React.createElement(Component, props);
  };
}

// Hook for tracking custom operations
export function usePerformanceTracking() {
  return {
    track: performanceMonitor.trackOperation.bind(performanceMonitor),
    getStats: performanceMonitor.getStats.bind(performanceMonitor),
    clear: performanceMonitor.clear.bind(performanceMonitor)
  };
}

// Utility for monitoring API calls
export async function trackApiCall<T>(
  endpoint: string, 
  apiCall: () => Promise<T>
): Promise<T> {
  return performanceMonitor.trackOperation(
    `API_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`,
    apiCall,
    { endpoint }
  );
}
