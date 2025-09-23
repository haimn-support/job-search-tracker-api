/**
 * Environment configuration utility
 * Manages environment-specific settings and provides type-safe access
 */

export interface AppConfig {
  env: 'development' | 'staging' | 'production';
  apiUrl: string;
  appName: string;
  version: string;
  debug: boolean;
  enableDevtools: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  generateSourcemap: boolean;
}

class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    const env = (process.env.REACT_APP_ENV || 'development') as AppConfig['env'];
    
    return {
      env,
      apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
      appName: process.env.REACT_APP_APP_NAME || 'Interview Position Tracker',
      version: process.env.REACT_APP_VERSION || '1.0.0',
      debug: process.env.REACT_APP_DEBUG === 'true',
      enableDevtools: process.env.REACT_APP_ENABLE_DEVTOOLS === 'true',
      logLevel: (process.env.REACT_APP_LOG_LEVEL || 'info') as AppConfig['logLevel'],
      generateSourcemap: process.env.GENERATE_SOURCEMAP === 'true',
    };
  }

  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  public getAll(): AppConfig {
    return { ...this.config };
  }

  public isDevelopment(): boolean {
    return this.config.env === 'development';
  }

  public isStaging(): boolean {
    return this.config.env === 'staging';
  }

  public isProduction(): boolean {
    return this.config.env === 'production';
  }

  public getApiUrl(): string {
    return this.config.apiUrl;
  }

  public getAppName(): string {
    return this.config.appName;
  }

  public getVersion(): string {
    return this.config.version;
  }

  public shouldDebug(): boolean {
    return this.config.debug;
  }

  public shouldEnableDevtools(): boolean {
    return this.config.enableDevtools;
  }

  public getLogLevel(): AppConfig['logLevel'] {
    return this.config.logLevel;
  }

  public shouldGenerateSourcemap(): boolean {
    return this.config.generateSourcemap;
  }

  /**
   * Get environment-specific feature flags
   */
  public getFeatureFlags() {
    return {
      enableAnalytics: this.isProduction() || this.isStaging(),
      enableErrorReporting: this.isProduction(),
      enablePerformanceMonitoring: this.isProduction() || this.isStaging(),
      enableAccessibilityTesting: this.isDevelopment(),
      enableHotReload: this.isDevelopment(),
      enableSourceMaps: this.shouldGenerateSourcemap(),
    };
  }

  /**
   * Get environment-specific API configuration
   */
  public getApiConfig() {
    return {
      baseURL: this.getApiUrl(),
      timeout: this.isProduction() ? 10000 : 30000,
      retries: this.isProduction() ? 3 : 1,
      enableCaching: this.isProduction() || this.isStaging(),
    };
  }

  /**
   * Get environment-specific logging configuration
   */
  public getLoggingConfig() {
    return {
      level: this.getLogLevel(),
      enableConsole: this.isDevelopment() || this.isStaging(),
      enableRemoteLogging: this.isProduction(),
      enablePerformanceLogging: this.isProduction() || this.isStaging(),
    };
  }
}

// Create singleton instance
const configManager = new ConfigManager();

// Export convenience functions
export const config = configManager;
export const getConfig = () => configManager.getAll();
export const getEnv = () => configManager.get('env');
export const isDevelopment = () => configManager.isDevelopment();
export const isStaging = () => configManager.isStaging();
export const isProduction = () => configManager.isProduction();
export const getApiUrl = () => configManager.getApiUrl();
export const getAppName = () => configManager.getAppName();
export const getVersion = () => configManager.getVersion();
export const shouldDebug = () => configManager.shouldDebug();
export const shouldEnableDevtools = () => configManager.shouldEnableDevtools();
export const getLogLevel = () => configManager.getLogLevel();
export const shouldGenerateSourcemap = () => configManager.shouldGenerateSourcemap();
export const getFeatureFlags = () => configManager.getFeatureFlags();
export const getApiConfig = () => configManager.getApiConfig();
export const getLoggingConfig = () => configManager.getLoggingConfig();

export default configManager;
