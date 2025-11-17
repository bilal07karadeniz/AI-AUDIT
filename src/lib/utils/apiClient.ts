/**
 * API Client Wrapper
 * Centralized HTTP client with interceptors, retry logic, and error handling
 */

import { API_CONFIG } from '../../config/api';
import { ErrorHandler, RetryHandler } from './errors';
import { logger } from './logger';
import { perfMonitor } from './performance';

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retry?: boolean;
  maxRetries?: number;
  skipErrorHandler?: boolean;
  measure?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export class ApiClient {
  private static instance: ApiClient;
  private baseURL: string;
  private defaultTimeout: number = 120000; // 2 minutes
  private requestInterceptors: ((config: RequestConfig) => RequestConfig | Promise<RequestConfig>)[] = [];
  private responseInterceptors: ((response: Response) => Response | Promise<Response>)[] = [];

  private constructor(baseURL?: string) {
    this.baseURL = baseURL || API_CONFIG.baseUrl;
  }

  static getInstance(baseURL?: string): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient(baseURL);
    }
    return ApiClient.instance;
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(
    interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  ): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(
    interceptor: (response: Response) => Response | Promise<Response>
  ): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let modifiedConfig = config;

    for (const interceptor of this.requestInterceptors) {
      modifiedConfig = await interceptor(modifiedConfig);
    }

    return modifiedConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let modifiedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      modifiedResponse = await interceptor(modifiedResponse);
    }

    return modifiedResponse;
  }

  /**
   * Make HTTP request
   */
  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const timeout = config.timeout || this.defaultTimeout;
    const shouldRetry = config.retry !== false;
    const maxRetries = config.maxRetries || 3;
    const measurePerformance = config.measure !== false;

    // Apply request interceptors
    const finalConfig = await this.applyRequestInterceptors(config);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestOptions: RequestInit = {
      ...finalConfig,
      signal: controller.signal
    };

    // Performance measurement
    const metricName = `api:${config.method || 'GET'}:${endpoint}`;
    if (measurePerformance) {
      perfMonitor.start(metricName, 'API');
    }

    try {
      logger.debug(`API Request: ${config.method || 'GET'} ${url}`, 'API', { config });

      const makeCall = async (): Promise<Response> => {
        const response = await fetch(url, requestOptions);
        return await this.applyResponseInterceptors(response);
      };

      const response = shouldRetry
        ? await RetryHandler.retry(makeCall, {
            maxAttempts: maxRetries,
            shouldRetry: RetryHandler.isRetryable
          })
        : await makeCall();

      clearTimeout(timeoutId);

      if (measurePerformance) {
        perfMonitor.end(metricName, 'API', { status: response.status });
      }

      logger.debug(
        `API Response: ${response.status} ${response.statusText}`,
        'API',
        { url, status: response.status }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: T;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as any;
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (measurePerformance) {
        perfMonitor.end(metricName, 'API', { error: true });
      }

      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${timeout}ms`);
        logger.error('API Request Timeout', timeoutError, 'API', { url, timeout });

        if (!config.skipErrorHandler) {
          ErrorHandler.handle(timeoutError, { url, timeout });
        }

        throw timeoutError;
      }

      // Handle other errors
      logger.error('API Request Failed', error as Error, 'API', { url });

      if (!config.skipErrorHandler) {
        ErrorHandler.handle(error, { url, method: config.method });
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'GET'
    });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'DELETE'
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  }
}

// Singleton instance
export const apiClient = ApiClient.getInstance();

// Add default request interceptor (example: add timestamp)
apiClient.addRequestInterceptor((config) => {
  const headers = new Headers(config.headers);
  headers.set('X-Request-Time', new Date().toISOString());

  return {
    ...config,
    headers: headers as any
  };
});

// Add default response interceptor (example: log slow requests)
apiClient.addResponseInterceptor((response) => {
  const requestTime = response.headers.get('X-Request-Time');
  if (requestTime) {
    const duration = Date.now() - new Date(requestTime).getTime();
    if (duration > 5000) {
      logger.warn(
        `Slow API request detected: ${duration}ms`,
        'Performance',
        { url: response.url, duration }
      );
    }
  }

  return response;
});

// Convenience methods
export const get = <T = any>(endpoint: string, config?: RequestConfig) =>
  apiClient.get<T>(endpoint, config);

export const post = <T = any>(endpoint: string, data?: any, config?: RequestConfig) =>
  apiClient.post<T>(endpoint, data, config);

export const put = <T = any>(endpoint: string, data?: any, config?: RequestConfig) =>
  apiClient.put<T>(endpoint, data, config);

export const del = <T = any>(endpoint: string, config?: RequestConfig) =>
  apiClient.delete<T>(endpoint, config);

export const patch = <T = any>(endpoint: string, data?: any, config?: RequestConfig) =>
  apiClient.patch<T>(endpoint, data, config);
