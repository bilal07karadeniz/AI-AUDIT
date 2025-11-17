/**
 * Error Utilities
 * Centralized error handling, logging, and user-friendly error messages
 */

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  API = 'API',
  STORAGE = 'STORAGE',
  PARSING = 'PARSING',
  AUTHENTICATION = 'AUTH',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  category: ErrorCategory;
  message: string;
  userMessage: string;
  originalError?: unknown;
  timestamp: string;
  context?: Record<string, any>;
}

export class ErrorHandler {
  private static errorLog: AppError[] = [];
  private static readonly MAX_LOG_SIZE = 100;

  /**
   * Create a standardized error object
   */
  static createError(
    category: ErrorCategory,
    message: string,
    userMessage: string,
    originalError?: unknown,
    context?: Record<string, any>
  ): AppError {
    const error: AppError = {
      category,
      message,
      userMessage,
      originalError,
      timestamp: new Date().toISOString(),
      context
    };

    this.logError(error);
    return error;
  }

  /**
   * Log error to internal buffer
   */
  private static logError(error: AppError): void {
    this.errorLog.push(error);

    // Keep log size manageable
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog.shift();
    }

    // Log to console based on category
    const consoleMessage = `[${error.category}] ${error.message}`;

    if (error.category === ErrorCategory.NETWORK || error.category === ErrorCategory.API) {
      console.error(consoleMessage, error.originalError);
    } else {
      console.warn(consoleMessage, error.originalError);
    }

    // In production, you might want to send errors to a logging service
    if (this.shouldReportToService(error)) {
      this.reportToService(error);
    }
  }

  /**
   * Get user-friendly error message based on error type
   */
  static getUserMessage(error: unknown): string {
    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      }

      // API errors
      if (error.message.includes('API') || error.message.includes('401')) {
        return 'There was a problem with the API. Please check your API key configuration.';
      }

      if (error.message.includes('429')) {
        return 'Too many requests. Please wait a moment and try again.';
      }

      if (error.message.includes('529') || error.message.includes('overloaded')) {
        return 'The AI service is currently busy. Please try again in a few moments.';
      }

      // Storage errors
      if (error.message.includes('localStorage') || error.message.includes('quota')) {
        return 'Storage limit reached. Some old data has been cleared automatically.';
      }

      // Parsing errors
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        return 'Received invalid data from the server. Please try again.';
      }

      // Contract validation errors
      if (error.message.includes('Solidity') || error.message.includes('contract')) {
        return 'Invalid Solidity contract. Please check your code and try again.';
      }

      // Default to error message if it's user-friendly
      if (error.message.length < 100 && !error.message.includes('undefined')) {
        return error.message;
      }
    }

    // Fallback
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Categorize error based on content
   */
  static categorizeError(error: unknown): ErrorCategory {
    if (!(error instanceof Error)) return ErrorCategory.UNKNOWN;

    const message = error.message.toLowerCase();

    if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
      return ErrorCategory.NETWORK;
    }

    if (message.includes('api') || message.includes('401') || message.includes('403') || message.includes('429')) {
      return ErrorCategory.API;
    }

    if (message.includes('localstorage') || message.includes('quota') || message.includes('storage')) {
      return ErrorCategory.STORAGE;
    }

    if (message.includes('json') || message.includes('parse') || message.includes('invalid')) {
      return ErrorCategory.PARSING;
    }

    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return ErrorCategory.AUTHENTICATION;
    }

    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ErrorCategory.VALIDATION;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Handle error with automatic categorization
   */
  static handle(error: unknown, context?: Record<string, any>): AppError {
    const category = this.categorizeError(error);
    const userMessage = this.getUserMessage(error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    return this.createError(category, message, userMessage, error, context);
  }

  /**
   * Get recent error log
   */
  static getErrorLog(limit: number = 20): AppError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  static clearLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  static getStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    recentErrors: number;
  } {
    const byCategory = {} as Record<ErrorCategory, number>;

    Object.values(ErrorCategory).forEach(category => {
      byCategory[category] = 0;
    });

    this.errorLog.forEach(error => {
      byCategory[error.category]++;
    });

    // Count errors in last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentErrors = this.errorLog.filter(error =>
      new Date(error.timestamp).getTime() > fiveMinutesAgo
    ).length;

    return {
      total: this.errorLog.length,
      byCategory,
      recentErrors
    };
  }

  /**
   * Check if error should be reported to external service
   */
  private static shouldReportToService(error: AppError): boolean {
    // Report critical errors
    if (error.category === ErrorCategory.API || error.category === ErrorCategory.NETWORK) {
      return true;
    }

    // Don't report validation errors
    if (error.category === ErrorCategory.VALIDATION) {
      return false;
    }

    // Report unknown errors
    if (error.category === ErrorCategory.UNKNOWN) {
      return true;
    }

    return false;
  }

  /**
   * Report error to external logging service
   * Placeholder for integration with Sentry, LogRocket, etc.
   */
  private static reportToService(error: AppError): void {
    // TODO: Integrate with error tracking service
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error.originalError, {
    //     tags: { category: error.category },
    //     extra: error.context
    //   });
    // }
  }
}

/**
 * Retry utility for failed operations
 */
export class RetryHandler {
  /**
   * Retry an async operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      initialDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
      shouldRetry?: (error: unknown) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      shouldRetry = () => true
    } = options;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry if we've exhausted attempts
        if (attempt === maxAttempts) {
          break;
        }

        // Check if we should retry this error
        if (!shouldRetry(error)) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          initialDelay * Math.pow(backoffFactor, attempt - 1),
          maxDelay
        );

        console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const message = error.message.toLowerCase();

    // Retry network errors
    if (message.includes('fetch') || message.includes('network')) {
      return true;
    }

    // Retry rate limit errors
    if (message.includes('429') || message.includes('rate limit')) {
      return true;
    }

    // Retry service overload
    if (message.includes('529') || message.includes('overloaded')) {
      return true;
    }

    // Retry timeout errors
    if (message.includes('timeout')) {
      return true;
    }

    // Don't retry validation or auth errors
    if (message.includes('401') || message.includes('403') || message.includes('invalid')) {
      return false;
    }

    return false;
  }
}

/**
 * Validation utilities
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class Validator {
  /**
   * Validate required field
   */
  static required(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required`, fieldName, value);
    }
  }

  /**
   * Validate string length
   */
  static minLength(value: string, minLength: number, fieldName: string): void {
    if (value.length < minLength) {
      throw new ValidationError(
        `${fieldName} must be at least ${minLength} characters`,
        fieldName,
        value
      );
    }
  }

  /**
   * Validate maximum length
   */
  static maxLength(value: string, maxLength: number, fieldName: string): void {
    if (value.length > maxLength) {
      throw new ValidationError(
        `${fieldName} must not exceed ${maxLength} characters`,
        fieldName,
        value
      );
    }
  }

  /**
   * Validate API key format
   */
  static apiKey(value: string): void {
    this.required(value, 'API Key');

    if (!value.startsWith('sk-ant-')) {
      throw new ValidationError(
        'Invalid API key format. Claude API keys should start with "sk-ant-"',
        'apiKey',
        value
      );
    }

    if (value.length < 20) {
      throw new ValidationError(
        'API key appears to be incomplete',
        'apiKey',
        value
      );
    }
  }

  /**
   * Validate Solidity contract
   */
  static solidityContract(code: string): void {
    this.required(code, 'Contract code');
    this.minLength(code, 50, 'Contract code');

    // Check for Solidity pragma
    if (!code.includes('pragma solidity') && !code.includes('pragma experimental')) {
      throw new ValidationError(
        'Contract must include a Solidity pragma directive',
        'code',
        code
      );
    }

    // Check for contract/library/interface declaration
    const hasDeclaration = /\b(contract|library|interface)\s+\w+/.test(code);
    if (!hasDeclaration) {
      throw new ValidationError(
        'Contract must contain a contract, library, or interface declaration',
        'code',
        code
      );
    }
  }
}
