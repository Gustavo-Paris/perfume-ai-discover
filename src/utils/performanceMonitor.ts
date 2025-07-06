// Performance monitoring utilities
export const performanceMonitor = {
  // Measure component render time
  measureRender: (componentName: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    const duration = end - start;
    
    if (duration > 16.67) { // More than one frame (60fps)
      console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  },

  // Measure query execution time
  measureQuery: async <T>(queryName: string, queryFn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    const result = await queryFn();
    const end = performance.now();
    const duration = end - start;
    
    if (duration > 1000) { // More than 1 second
      console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
    }
    
    // Log to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'query_performance', {
        query_name: queryName,
        duration: Math.round(duration),
        category: 'performance'
      });
    }
    
    return result;
  },

  // Memory usage monitoring
  checkMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize / 1024 / 1024; // MB
      const total = memory.totalJSHeapSize / 1024 / 1024; // MB
      const limit = memory.jsHeapSizeLimit / 1024 / 1024; // MB
      
      if (used / limit > 0.8) {
        console.warn(`High memory usage: ${used.toFixed(1)}MB / ${limit.toFixed(1)}MB`);
      }
      
      return { used, total, limit };
    }
    return null;
  },

  // Bundle size monitoring
  measureBundleLoad: (bundleName: string) => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes(bundleName)) {
          console.log(`Bundle ${bundleName} loaded in ${entry.duration.toFixed(2)}ms`);
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation', 'resource'] });
    
    return () => observer.disconnect();
  },

  // Core Web Vitals monitoring
  measureWebVitals: () => {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
      
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'web_vitals', {
          name: 'LCP',
          value: Math.round(lastEntry.startTime),
          category: 'performance'
        });
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        console.log('FID:', entry.processingStart - entry.startTime);
        
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'web_vitals', {
            name: 'FID',
            value: Math.round(entry.processingStart - entry.startTime),
            category: 'performance'
          });
        }
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let cumulativeLayoutShift = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          cumulativeLayoutShift += entry.value;
        }
      });
      
      console.log('CLS:', cumulativeLayoutShift);
      
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'web_vitals', {
          name: 'CLS',
          value: Math.round(cumulativeLayoutShift * 1000),
          category: 'performance'
        });
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.measureWebVitals();
  
  // Check memory usage every 30 seconds
  setInterval(() => {
    performanceMonitor.checkMemoryUsage();
  }, 30000);
}