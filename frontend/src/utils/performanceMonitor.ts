// Performance monitoring utilities
export interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  type: 'query' | 'mutation' | 'render' | 'navigation' | 'cache' | 'network';
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  entries: PerformanceEntry[];
  averages: Record<string, number>;
  totals: Record<string, number>;
  counts: Record<string, number>;
}

// Performance monitor class
export class PerformanceMonitor {
  private static entries: PerformanceEntry[] = [];
  private static readonly MAX_ENTRIES = 1000;
  private static listeners: Array<(entry: PerformanceEntry) => void> = [];

  // Start performance measurement
  static startMeasurement(name: string, type: PerformanceEntry['type'], metadata?: Record<string, any>): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.addEntry({
        name,
        startTime,
        duration,
        type,
        metadata,
      });
    };
  }

  // Add performance entry
  static addEntry(entry: PerformanceEntry): void {
    this.entries.push(entry);
    
    // Keep only the most recent entries
    if (this.entries.length > this.MAX_ENTRIES) {
      this.entries = this.entries.slice(-this.MAX_ENTRIES);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        console.error('Error in performance monitor listener:', error);
      }
    });
  }

  // Get all entries
  static getEntries(): PerformanceEntry[] {
    return [...this.entries];
  }

  // Get entries by type
  static getEntriesByType(type: PerformanceEntry['type']): PerformanceEntry[] {
    return this.entries.filter(entry => entry.type === type);
  }

  // Get entries by name pattern
  static getEntriesByName(namePattern: string): PerformanceEntry[] {
    return this.entries.filter(entry => entry.name.includes(namePattern));
  }

  // Get performance metrics
  static getMetrics(): PerformanceMetrics {
    const averages: Record<string, number> = {};
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};

    // Group entries by type
    const entriesByType = this.entries.reduce((acc, entry) => {
      if (!acc[entry.type]) {
        acc[entry.type] = [];
      }
      acc[entry.type].push(entry);
      return acc;
    }, {} as Record<string, PerformanceEntry[]>);

    // Calculate metrics for each type
    Object.entries(entriesByType).forEach(([type, entries]) => {
      const durations = entries.map(entry => entry.duration);
      const total = durations.reduce((sum, duration) => sum + duration, 0);
      
      totals[type] = total;
      counts[type] = entries.length;
      averages[type] = entries.length > 0 ? total / entries.length : 0;
    });

    return {
      entries: this.entries,
      averages,
      totals,
      counts,
    };
  }

  // Get slow operations (above threshold)
  static getSlowOperations(threshold: number = 1000): PerformanceEntry[] {
    return this.entries.filter(entry => entry.duration > threshold);
  }

  // Get performance summary
  static getSummary(): {
    totalOperations: number;
    averageDuration: number;
    slowOperations: number;
    byType: Record<string, { count: number; average: number; total: number }>;
  } {
    const metrics = this.getMetrics();
    const slowOps = this.getSlowOperations();
    
    const totalDuration = Object.values(metrics.totals).reduce((sum, total) => sum + total, 0);
    const totalCount = Object.values(metrics.counts).reduce((sum, count) => sum + count, 0);

    const byType: Record<string, { count: number; average: number; total: number }> = {};
    Object.keys(metrics.counts).forEach(type => {
      byType[type] = {
        count: metrics.counts[type],
        average: metrics.averages[type],
        total: metrics.totals[type],
      };
    });

    return {
      totalOperations: totalCount,
      averageDuration: totalCount > 0 ? totalDuration / totalCount : 0,
      slowOperations: slowOps.length,
      byType,
    };
  }

  // Clear all entries
  static clear(): void {
    this.entries = [];
  }

  // Add listener for new entries
  static addListener(listener: (entry: PerformanceEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Export performance data
  static exportData(): string {
    const data = {
      entries: this.entries,
      metrics: this.getMetrics(),
      summary: this.getSummary(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    return JSON.stringify(data, null, 2);
  }

  // Monitor Core Web Vitals
  static monitorWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          this.addEntry({
            name: 'LCP',
            startTime: lastEntry.startTime,
            duration: lastEntry.startTime,
            type: 'render',
            metadata: {
              element: lastEntry.element?.tagName,
              url: lastEntry.url,
            },
          });
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('Failed to observe LCP:', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.addEntry({
              name: 'FID',
              startTime: entry.startTime,
              duration: entry.processingStart - entry.startTime,
              type: 'render',
              metadata: {
                inputType: (entry as any).name,
              },
            });
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('Failed to observe FID:', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (!(entry as any).hadRecentInput) {
              this.addEntry({
                name: 'CLS',
                startTime: entry.startTime,
                duration: (entry as any).value,
                type: 'render',
                metadata: {
                  value: (entry as any).value,
                  sources: (entry as any).sources?.map((source: any) => ({
                    element: source.node?.tagName,
                  })),
                },
              });
            }
          });
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Failed to observe CLS:', error);
      }
    }
  }

  // Monitor navigation timing
  static monitorNavigation(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      
      navigationEntries.forEach(entry => {
        // DNS lookup time
        if (entry.domainLookupEnd > entry.domainLookupStart) {
          this.addEntry({
            name: 'DNS Lookup',
            startTime: entry.domainLookupStart,
            duration: entry.domainLookupEnd - entry.domainLookupStart,
            type: 'navigation',
          });
        }

        // TCP connection time
        if (entry.connectEnd > entry.connectStart) {
          this.addEntry({
            name: 'TCP Connection',
            startTime: entry.connectStart,
            duration: entry.connectEnd - entry.connectStart,
            type: 'navigation',
          });
        }

        // Request/Response time
        if (entry.responseEnd > entry.requestStart) {
          this.addEntry({
            name: 'Request/Response',
            startTime: entry.requestStart,
            duration: entry.responseEnd - entry.requestStart,
            type: 'navigation',
          });
        }

        // DOM processing time
        if (entry.domComplete > entry.domLoading) {
          this.addEntry({
            name: 'DOM Processing',
            startTime: entry.domLoading,
            duration: entry.domComplete - entry.domLoading,
            type: 'navigation',
          });
        }

        // Page load time
        if (entry.loadEventEnd > entry.navigationStart) {
          this.addEntry({
            name: 'Page Load',
            startTime: entry.navigationStart,
            duration: entry.loadEventEnd - entry.navigationStart,
            type: 'navigation',
          });
        }
      });
    }
  }

  // Monitor resource loading
  static monitorResources(): void {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            this.addEntry({
              name: `Resource: ${resourceEntry.name.split('/').pop() || 'unknown'}`,
              startTime: resourceEntry.startTime,
              duration: resourceEntry.duration,
              type: 'network',
              metadata: {
                url: resourceEntry.name,
                initiatorType: resourceEntry.initiatorType,
                transferSize: resourceEntry.transferSize,
                encodedBodySize: resourceEntry.encodedBodySize,
                decodedBodySize: resourceEntry.decodedBodySize,
              },
            });
          });
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Failed to observe resources:', error);
      }
    }
  }

  // Initialize all monitoring
  static initialize(): void {
    this.monitorWebVitals();
    this.monitorNavigation();
    this.monitorResources();

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.addEntry({
              name: 'Long Task',
              startTime: entry.startTime,
              duration: entry.duration,
              type: 'render',
              metadata: {
                attribution: (entry as any).attribution,
              },
            });
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Failed to observe long tasks:', error);
      }
    }
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>(PerformanceMonitor.getMetrics());
  const [summary, setSummary] = React.useState(PerformanceMonitor.getSummary());

  React.useEffect(() => {
    // Update metrics periodically
    const updateMetrics = () => {
      setMetrics(PerformanceMonitor.getMetrics());
      setSummary(PerformanceMonitor.getSummary());
    };

    const interval = setInterval(updateMetrics, 5000); // Every 5 seconds

    // Listen for new entries
    const unsubscribe = PerformanceMonitor.addListener(() => {
      updateMetrics();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const startMeasurement = React.useCallback((name: string, type: PerformanceEntry['type'], metadata?: Record<string, any>) => {
    return PerformanceMonitor.startMeasurement(name, type, metadata);
  }, []);

  const exportData = React.useCallback(() => {
    const data = PerformanceMonitor.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const clearData = React.useCallback(() => {
    PerformanceMonitor.clear();
    setMetrics(PerformanceMonitor.getMetrics());
    setSummary(PerformanceMonitor.getSummary());
  }, []);

  return {
    metrics,
    summary,
    startMeasurement,
    exportData,
    clearData,
    getSlowOperations: PerformanceMonitor.getSlowOperations,
  };
};

// Performance measurement decorator
export const measurePerformance = (name: string, type: PerformanceEntry['type'] = 'render') => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const endMeasurement = PerformanceMonitor.startMeasurement(
        `${target.constructor.name}.${propertyKey}`,
        type,
        { name, args: args.length }
      );

      try {
        const result = originalMethod.apply(this, args);
        
        if (result instanceof Promise) {
          return result.finally(() => {
            endMeasurement();
          });
        } else {
          endMeasurement();
          return result;
        }
      } catch (error) {
        endMeasurement();
        throw error;
      }
    };

    return descriptor;
  };
};

// Initialize performance monitoring when module loads
if (typeof window !== 'undefined') {
  PerformanceMonitor.initialize();
}

// Export React import for the hook
import React from 'react';