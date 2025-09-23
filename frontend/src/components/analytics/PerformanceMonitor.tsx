import React, { useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { performanceConfig } from '../../config/performance';
import { getConfig } from '../../config/environment';

interface PerformanceMonitorProps {
  onMetric?: (metric: any) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ onMetric }) => {
  useEffect(() => {
    const config = getConfig();
    
    const handleMetric = (metric: any) => {
      // Apply sampling
      if (Math.random() > performanceConfig.sampleRate) {
        return;
      }

      // Log to console in development
      if (config.debug) {
        console.log('Web Vital:', metric);
      }

      // Send to analytics service
      if (performanceConfig.enableWebVitals && onMetric) {
        onMetric(metric);
      }

      // You can also send to Google Analytics, Sentry, or other monitoring services
      // Example for Google Analytics:
      // gtag('event', metric.name, {
      //   event_category: 'Web Vitals',
      //   value: Math.round(metric.value),
      //   event_label: metric.id,
      //   non_interaction: true,
      // });
    };

    // Measure Core Web Vitals
    getCLS(handleMetric);
    getFID(handleMetric);
    getFCP(handleMetric);
    getLCP(handleMetric);
    getTTFB(handleMetric);

    // Additional performance monitoring
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          const loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
          const domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
          
          handleMetric({
            name: 'page-load-time',
            value: loadTime,
            id: 'page-load',
            delta: loadTime,
          });

          handleMetric({
            name: 'dom-content-loaded',
            value: domContentLoaded,
            id: 'dom-content-loaded',
            delta: domContentLoaded,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });

    return () => {
      observer.disconnect();
    };
  }, [onMetric]);

  return null;
};

export default PerformanceMonitor;
