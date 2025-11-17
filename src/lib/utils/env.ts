/**
 * Environment Configuration Utilities
 * Centralized environment variable management and validation
 */

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test'
}

export interface EnvConfig {
  env: Environment;
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
  isTest: boolean;
  features: {
    debugMode: boolean;
    analytics: boolean;
    errorReporting: boolean;
    performanceMonitoring: boolean;
  };
}

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * Load and validate environment configuration
   */
  private loadConfig(): EnvConfig {
    const envStr = import.meta.env.VITE_ENV || import.meta.env.MODE || 'development';
    const env = this.parseEnvironment(envStr);

    const apiBaseUrl = this.getApiBaseUrl();

    const isDevelopment = env === Environment.DEVELOPMENT;
    const isProduction = env === Environment.PRODUCTION;
    const isStaging = env === Environment.STAGING;
    const isTest = env === Environment.TEST;

    return {
      env,
      apiBaseUrl,
      isDevelopment,
      isProduction,
      isStaging,
      isTest,
      features: {
        debugMode: isDevelopment || isStaging,
        analytics: isProduction || isStaging,
        errorReporting: isProduction || isStaging,
        performanceMonitoring: !isTest
      }
    };
  }

  /**
   * Parse environment string
   */
  private parseEnvironment(envStr: string): Environment {
    const normalized = envStr.toLowerCase().trim();

    switch (normalized) {
      case 'production':
      case 'prod':
        return Environment.PRODUCTION;
      case 'staging':
      case 'stage':
        return Environment.STAGING;
      case 'test':
      case 'testing':
        return Environment.TEST;
      case 'development':
      case 'dev':
      default:
        return Environment.DEVELOPMENT;
    }
  }

  /**
   * Get API base URL based on environment
   */
  private getApiBaseUrl(): string {
    // Check explicit env variable first
    const explicitUrl = import.meta.env.VITE_API_BASE_URL;
    if (explicitUrl) {
      return explicitUrl;
    }

    // Fall back to environment-specific defaults
    switch (this.config?.env || Environment.DEVELOPMENT) {
      case Environment.PRODUCTION:
        return 'https://api.solidaudit.io';
      case Environment.STAGING:
        return 'https://staging-api.solidaudit.io';
      case Environment.TEST:
        return 'http://localhost:3001';
      case Environment.DEVELOPMENT:
      default:
        return 'http://localhost:3001';
    }
  }

  /**
   * Get environment name
   */
  getEnvironment(): Environment {
    return this.config.env;
  }

  /**
   * Get full configuration
   */
  getConfig(): Readonly<EnvConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Get API base URL
   */
  getApiUrl(): string {
    return this.config.apiBaseUrl;
  }

  /**
   * Check if development
   */
  isDevelopment(): boolean {
    return this.config.isDevelopment;
  }

  /**
   * Check if production
   */
  isProduction(): boolean {
    return this.config.isProduction;
  }

  /**
   * Check if staging
   */
  isStaging(): boolean {
    return this.config.isStaging;
  }

  /**
   * Check if test
   */
  isTest(): boolean {
    return this.config.isTest;
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: keyof EnvConfig['features']): boolean {
    return this.config.features[feature];
  }

  /**
   * Get environment variable with validation
   */
  getEnvVar(key: string, defaultValue?: string, required: boolean = false): string | undefined {
    const value = (import.meta.env as any)[key];

    if (required && !value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }

    return value || defaultValue;
  }

  /**
   * Get environment variable as number
   */
  getEnvNumber(key: string, defaultValue?: number, required: boolean = false): number | undefined {
    const value = this.getEnvVar(key, undefined, required);

    if (value === undefined) {
      return defaultValue;
    }

    const num = Number(value);
    if (isNaN(num)) {
      console.warn(`Environment variable ${key} is not a valid number: ${value}`);
      return defaultValue;
    }

    return num;
  }

  /**
   * Get environment variable as boolean
   */
  getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = this.getEnvVar(key);

    if (value === undefined) {
      return defaultValue;
    }

    const normalized = value.toLowerCase().trim();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  /**
   * Validate environment configuration
   */
  validate(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check API URL
    if (!this.config.apiBaseUrl) {
      errors.push('API base URL is not configured');
    } else if (!this.isValidUrl(this.config.apiBaseUrl)) {
      errors.push(`Invalid API base URL: ${this.config.apiBaseUrl}`);
    }

    // Production-specific checks
    if (this.config.isProduction) {
      if (this.config.apiBaseUrl.includes('localhost')) {
        errors.push('Production environment should not use localhost');
      }

      if (!this.config.apiBaseUrl.startsWith('https://')) {
        warnings.push('Production API should use HTTPS');
      }
    }

    // Development warnings
    if (this.config.isDevelopment) {
      if (this.config.features.errorReporting) {
        warnings.push('Error reporting is enabled in development');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if URL is valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Log environment configuration
   */
  logConfig(): void {
    console.group('🔧 Environment Configuration');
    console.log('Environment:', this.config.env);
    console.log('API Base URL:', this.config.apiBaseUrl);
    console.log('Features:', this.config.features);
    console.groupEnd();

    const validation = this.validate();
    if (validation.errors.length > 0) {
      console.group('❌ Configuration Errors');
      validation.errors.forEach(error => console.error(error));
      console.groupEnd();
    }

    if (validation.warnings.length > 0) {
      console.group('⚠️ Configuration Warnings');
      validation.warnings.forEach(warning => console.warn(warning));
      console.groupEnd();
    }
  }
}

// Singleton instance
export const envManager = EnvironmentManager.getInstance();

// Convenience exports
export const env = envManager.getConfig();
export const isDev = envManager.isDevelopment();
export const isProd = envManager.isProduction();
export const isStaging = envManager.isStaging();
export const isTest = envManager.isTest();
export const apiUrl = envManager.getApiUrl();

// Export getters
export const getEnvVar = (key: string, defaultValue?: string, required?: boolean) =>
  envManager.getEnvVar(key, defaultValue, required);

export const getEnvNumber = (key: string, defaultValue?: number, required?: boolean) =>
  envManager.getEnvNumber(key, defaultValue, required);

export const getEnvBoolean = (key: string, defaultValue?: boolean) =>
  envManager.getEnvBoolean(key, defaultValue);

export const isFeatureEnabled = (feature: keyof EnvConfig['features']) =>
  envManager.isFeatureEnabled(feature);

// Validate on load
if (isDev) {
  envManager.logConfig();
}
