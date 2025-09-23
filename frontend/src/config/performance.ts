/**
 * Performance Monitoring Configuration
 * Configures performance monitoring based on environment
 */

import { getConfig, getFeatureFlags } from '../config/environment';

export interface PerformanceConfig {
  enableWebVitals: boolean;
  enableResourceTiming: boolean;
  enableUserTiming: boolean;
  enableLongTask: boolean;
  sampleRate: number;
  reportInterval: number;
  maxRetries: number;
}

export const getPerformanceConfig = (): PerformanceConfig => {
  const config = getConfig();
  const featureFlags = getFeatureFlags();

  const baseConfig: PerformanceConfig = {
    enableWebVitals: featureFlags.enablePerformanceMonitoring,
    enableResourceTiming: featureFlags.enablePerformanceMonitoring,
    enableUserTiming: featureFlags.enablePerformanceMonitoring,
    enableLongTask: featureFlags.enablePerformanceMonitoring,
    sampleRate: config.env === 'production' ? 0.1 : 1.0,
    reportInterval: 30000, // 30 seconds
    maxRetries: 3,
  };

  // Environment-specific overrides
  switch (config.env) {
    case 'development':
      return {
        ...baseConfig,
        sampleRate: 1.0,
        reportInterval: 10000, // 10 seconds for faster feedback
      };
    
    case 'staging':
      return {
        ...baseConfig,
        sampleRate: 0.5,
        reportInterval: 20000, // 20 seconds
      };
    
    case 'production':
      return {
        ...baseConfig,
        sampleRate: 0.1,
        reportInterval: 60000, // 1 minute
      };
    
    default:
      return baseConfig;
  }
};

export const performanceConfig = getPerformanceConfig();
