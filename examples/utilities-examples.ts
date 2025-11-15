/**
 * Comprehensive Examples: Using AI-AUDIT Utilities
 *
 * This file demonstrates practical usage of all utility modules.
 * Copy and adapt these examples for your own use cases.
 */

import {
  logger,
  perfMonitor,
  env,
  apiClient,
  ContractValidator,
  ErrorHandler,
  RetryHandler,
  Validator
} from '../src/lib/utils';

// ============================================================================
// LOGGING EXAMPLES
// ============================================================================

/**
 * Example 1: Basic Logging
 */
function exampleBasicLogging() {
  // Debug logging (development only)
  logger.debug('User interaction detected', 'UI', {
    component: 'AuditForm',
    action: 'submit'
  });

  // Info logging
  logger.info('Contract uploaded successfully', 'Upload', {
    fileName: 'MyToken.sol',
    size: 1024
  });

  // Warning logging
  logger.warn('API rate limit approaching', 'API', {
    remaining: 10,
    limit: 100
  });

  // Error logging
  try {
    throw new Error('Database connection failed');
  } catch (error) {
    logger.error('Database error', error as Error, 'Database', {
      operation: 'connect',
      retries: 3
    });
  }

  // Critical logging
  logger.critical('System failure detected', new Error('Out of memory'), 'System', {
    severity: 'high',
    requiresImmediate: true
  });
}

/**
 * Example 2: Log Management
 */
function exampleLogManagement() {
  // Get recent logs
  const recentLogs = logger.getRecent(50);
  console.log(`Last 50 logs:`, recentLogs);

  // Get logs by level
  const errors = logger.getByLevel('ERROR');
  console.log(`Total errors: ${errors.length}`);

  // Get logs by context
  const apiLogs = logger.getByContext('API');
  console.log(`API logs: ${apiLogs.length}`);

  // Get statistics
  const stats = logger.getStats();
  console.log('Log Statistics:', stats);
  // {
  //   total: 1250,
  //   byLevel: { DEBUG: 500, INFO: 400, WARN: 200, ERROR: 100, CRITICAL: 50 },
  //   byContext: { API: 300, Database: 200, UI: 150 },
  //   recentErrors: [...]
  // }
}

/**
 * Example 3: Log Export
 */
function exampleLogExport() {
  // Export as JSON
  const jsonLogs = logger.exportJSON();
  console.log('JSON Export:', jsonLogs.substring(0, 100));

  // Export as CSV
  const csvLogs = logger.exportCSV();
  console.log('CSV Export:', csvLogs.substring(0, 100));

  // Download logs (triggers browser download)
  logger.download('json'); // Downloads logs.json
  logger.download('csv');  // Downloads logs.csv
}

// ============================================================================
// PERFORMANCE MONITORING EXAMPLES
// ============================================================================

/**
 * Example 4: Manual Performance Tracking
 */
function exampleManualPerformance() {
  // Start timing
  perfMonitor.start('data-processing', 'DataService', { itemCount: 1000 });

  // ... your processing logic ...
  processData();

  // End timing and get duration
  const duration = perfMonitor.end('data-processing', 'DataService', {
    success: true,
    processed: 1000
  });

  console.log(`Processing took ${duration}ms`);
}

/**
 * Example 5: Async Function Measurement
 */
async function exampleAsyncMeasurement() {
  const result = await perfMonitor.measure(
    'api-fetch',
    async () => {
      const response = await fetch('/api/data');
      return response.json();
    },
    'API',
    { endpoint: '/api/data' }
  );

  console.log('Fetched data:', result);
}

/**
 * Example 6: Sync Function Measurement
 */
function exampleSyncMeasurement() {
  const result = perfMonitor.measureSync(
    'calculation',
    () => {
      return expensiveCalculation(1000000);
    },
    'Math',
    { iterations: 1000000 }
  );

  console.log('Calculation result:', result);
}

/**
 * Example 7: Performance Statistics
 */
function examplePerformanceStats() {
  // Get stats for specific metric
  const apiStats = perfMonitor.getStats('api-fetch');

  if (apiStats) {
    console.log('API Performance:');
    console.log(`- Average: ${apiStats.averageDuration.toFixed(2)}ms`);
    console.log(`- Min: ${apiStats.minDuration.toFixed(2)}ms`);
    console.log(`- Max: ${apiStats.maxDuration.toFixed(2)}ms`);
    console.log(`- Total calls: ${apiStats.totalMeasurements}`);
  }

  // Get all metrics
  const allMetrics = perfMonitor.getMetricNames();
  console.log('All tracked metrics:', allMetrics);

  // Get memory usage
  const memory = perfMonitor.getMemoryUsage();
  if (memory) {
    console.log(`Memory: ${(memory.used / 1024 / 1024).toFixed(2)} MB used`);
  }

  // Print summary
  perfMonitor.logSummary();
}

// ============================================================================
// ENVIRONMENT CONFIGURATION EXAMPLES
// ============================================================================

/**
 * Example 8: Environment Detection
 */
function exampleEnvironmentDetection() {
  console.log('Current environment:', env.env);
  console.log('API Base URL:', env.apiBaseUrl);

  if (env.isDevelopment) {
    console.log('Running in DEVELOPMENT mode');
    // Enable development features
    enableDevTools();
  }

  if (env.isProduction) {
    console.log('Running in PRODUCTION mode');
    // Enable production features
    enableAnalytics();
    enableErrorReporting();
  }

  if (env.isStaging) {
    console.log('Running in STAGING mode');
    // Enable staging features
  }
}

/**
 * Example 9: Feature Flags
 */
function exampleFeatureFlags() {
  // Check if debug mode is enabled
  if (env.features.debugMode) {
    console.log('Debug mode enabled');
    showDebugPanel();
  }

  // Check if analytics is enabled
  if (env.features.analytics) {
    trackPageView();
  }

  // Check if error reporting is enabled
  if (env.features.errorReporting) {
    initializeErrorReporting();
  }

  // Check if performance monitoring is enabled
  if (env.features.performanceMonitoring) {
    startPerformanceMonitoring();
  }
}

/**
 * Example 10: Environment Variables
 */
function exampleEnvironmentVariables() {
  // Get string variable
  const apiKey = env.isDevelopment
    ? 'dev-key'
    : process.env.VITE_API_KEY || 'default-key';

  // Custom environment variables
  const timeout = parseInt(process.env.VITE_TIMEOUT || '5000');
  const enableCache = process.env.VITE_ENABLE_CACHE === 'true';

  console.log('Configuration:', { apiKey, timeout, enableCache });
}

// ============================================================================
// API CLIENT EXAMPLES
// ============================================================================

/**
 * Example 11: Basic API Calls
 */
async function exampleBasicApiCalls() {
  try {
    // GET request
    const users = await apiClient.get('/api/users');
    console.log('Users:', users.data);

    // POST request
    const newUser = await apiClient.post('/api/users', {
      name: 'John Doe',
      email: 'john@example.com'
    });
    console.log('Created user:', newUser.data);

    // PUT request
    const updated = await apiClient.put('/api/users/123', {
      name: 'Jane Doe'
    });
    console.log('Updated user:', updated.data);

    // DELETE request
    await apiClient.delete('/api/users/123');
    console.log('User deleted');
  } catch (error) {
    console.error('API call failed:', error);
  }
}

/**
 * Example 12: API Client with Configuration
 */
async function exampleApiConfiguration() {
  const response = await apiClient.get('/api/data', {
    timeout: 60000,           // 1 minute timeout
    retry: true,              // Enable retry
    maxRetries: 5,            // Retry up to 5 times
    skipErrorHandler: false,  // Use error handler
    measure: true,            // Track performance
    headers: {
      'Authorization': 'Bearer token',
      'Custom-Header': 'value'
    }
  });

  console.log('Response:', response.data);
}

/**
 * Example 13: API Client Interceptors
 */
function exampleApiInterceptors() {
  // Add request interceptor
  apiClient.addRequestInterceptor((config) => {
    // Add authentication
    const headers = new Headers(config.headers);
    const token = localStorage.getItem('auth_token');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return {
      ...config,
      headers: headers as any
    };
  });

  // Add response interceptor
  apiClient.addResponseInterceptor(async (response) => {
    // Log slow responses
    const duration = Date.now() - new Date(response.headers.get('X-Request-Time') || Date.now()).getTime();

    if (duration > 3000) {
      logger.warn(`Slow API response: ${duration}ms`, 'API', {
        url: response.url,
        duration
      });
    }

    return response;
  });
}

// ============================================================================
// CONTRACT VALIDATOR EXAMPLES
// ============================================================================

/**
 * Example 14: Basic Contract Validation
 */
function exampleContractValidation() {
  const contractCode = `
    pragma solidity ^0.8.0;

    contract MyToken {
      mapping(address => uint256) public balances;

      function transfer(address to, uint256 amount) public {
        balances[msg.sender] -= amount;
        balances[to] += amount;
      }
    }
  `;

  const result = ContractValidator.validate(contractCode);

  console.log('Validation result:', {
    isValid: result.isValid,
    errorCount: result.errors.length,
    warningCount: result.warnings.length
  });

  if (!result.isValid) {
    console.error('Validation errors:', result.errors);
  }

  if (result.warnings.length > 0) {
    console.warn('Validation warnings:', result.warnings);
  }

  console.log('Contract metadata:', result.metadata);
}

/**
 * Example 15: Security Checks
 */
function exampleSecurityChecks() {
  const contractCode = `
    pragma solidity ^0.8.0;

    contract UnsafeContract {
      address owner;

      function withdraw() public {
        require(tx.origin == owner); // Unsafe!
        payable(msg.sender).call{value: address(this).balance}(""); // Unsafe!
      }
    }
  `;

  const securityChecks = ContractValidator.checkSecurity(contractCode);

  console.log('\nSecurity Check Results:');
  securityChecks.forEach(check => {
    if (!check.passed) {
      console.log(`\n${check.severity} Severity:`);
      check.issues.forEach(issue => console.log(`  - ${issue}`));
    }
  });
}

/**
 * Example 16: Complete Validation
 */
function exampleCompleteValidation() {
  const contractCode = `/* your contract code */`;

  const complete = ContractValidator.validateComplete(contractCode);

  console.log('Complete Validation Summary:');
  console.log('- Valid:', complete.summary.isValid);
  console.log('- Total issues:', complete.summary.totalIssues);
  console.log('- High severity:', complete.summary.highSeverityIssues);
  console.log('- Can deploy:', complete.summary.canDeploy);

  console.log('\nContract Size:');
  console.log('- Estimated:', complete.sizeCheck.estimatedSize, 'bytes');
  console.log('- Within limit:', complete.sizeCheck.withinLimit);

  if (complete.sizeCheck.warning) {
    console.warn('Size warning:', complete.sizeCheck.warning);
  }
}

// ============================================================================
// ERROR HANDLING EXAMPLES
// ============================================================================

/**
 * Example 17: Error Handler
 */
function exampleErrorHandler() {
  try {
    throw new Error('Something went wrong');
  } catch (error) {
    // Get user-friendly message
    const userMessage = ErrorHandler.getUserMessage(error);
    console.log('User message:', userMessage);

    // Categorize error
    const category = ErrorHandler.categorizeError(error);
    console.log('Error category:', category);

    // Handle error
    ErrorHandler.handle(error, { context: 'Example', data: { foo: 'bar' } });
  }
}

/**
 * Example 18: Retry Handler
 */
async function exampleRetryHandler() {
  const result = await RetryHandler.retry(
    async () => {
      const response = await fetch('/api/unstable-endpoint');
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    },
    {
      maxAttempts: 5,
      baseDelay: 1000,
      shouldRetry: RetryHandler.isRetryable
    }
  );

  console.log('Result after retries:', result);
}

/**
 * Example 19: Validation
 */
function exampleValidation() {
  const contractCode = `pragma solidity ^0.8.0; contract Test {}`;

  try {
    Validator.solidityContract(contractCode);
    console.log('Contract is valid');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Validation failed:', error.message);
    }
  }

  // Required field validation
  try {
    Validator.required('apiKey', process.env.API_KEY);
  } catch (error) {
    console.error('API key is required');
  }

  // String length validation
  try {
    Validator.minLength('name', 'Jo', 3);
  } catch (error) {
    console.error('Name must be at least 3 characters');
  }
}

// ============================================================================
// COMBINED EXAMPLES
// ============================================================================

/**
 * Example 20: Complete Audit Flow with All Utilities
 */
async function exampleCompleteAuditFlow(contractCode: string) {
  logger.info('Starting contract audit', 'AuditFlow');
  perfMonitor.start('complete-audit', 'AuditFlow');

  try {
    // 1. Validate contract
    logger.info('Validating contract', 'AuditFlow');
    const validation = ContractValidator.validateComplete(contractCode);

    if (!validation.summary.isValid) {
      throw new Error('Contract validation failed');
    }

    logger.info('Contract validation passed', 'AuditFlow', {
      totalIssues: validation.summary.totalIssues
    });

    // 2. Perform audit via API
    logger.info('Calling audit API', 'AuditFlow');

    const auditResult = await perfMonitor.measure(
      'api-audit',
      async () => {
        return await apiClient.post('/api/audit', {
          code: contractCode,
          metadata: validation.metadata
        });
      },
      'AuditFlow'
    );

    // 3. Process results
    logger.info('Audit completed successfully', 'AuditFlow', {
      score: auditResult.data.score,
      issues: auditResult.data.issues.length
    });

    const duration = perfMonitor.end('complete-audit', 'AuditFlow', {
      success: true
    });

    logger.info(`Complete audit took ${duration}ms`, 'AuditFlow');

    return auditResult.data;

  } catch (error) {
    perfMonitor.end('complete-audit', 'AuditFlow', { error: true });
    logger.error('Audit flow failed', error as Error, 'AuditFlow');

    // Handle error appropriately
    ErrorHandler.handle(error, { contractCode: contractCode.substring(0, 100) });

    throw error;
  }
}

/**
 * Example 21: Development vs Production Setup
 */
function exampleEnvironmentSetup() {
  if (env.isDevelopment) {
    // Development setup
    logger.setLevel('DEBUG' as any);

    logger.info('Development environment initialized', 'Setup', {
      features: env.features,
      apiUrl: env.apiBaseUrl
    });

    // Log all requests in development
    apiClient.addRequestInterceptor((config) => {
      logger.debug('API Request', 'API', {
        method: config.method,
        url: config.url
      });
      return config;
    });

  } else if (env.isProduction) {
    // Production setup
    logger.setLevel('WARN' as any);

    logger.info('Production environment initialized', 'Setup');

    // Only log errors in production
    apiClient.addResponseInterceptor((response) => {
      if (!response.ok) {
        logger.error('API Error', new Error(`${response.status}`), 'API', {
          url: response.url,
          status: response.status
        });
      }
      return response;
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS (for examples)
// ============================================================================

function processData() {
  // Simulated data processing
  for (let i = 0; i < 1000; i++) {
    Math.sqrt(i);
  }
}

function expensiveCalculation(iterations: number): number {
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

function enableDevTools() {
  console.log('Dev tools enabled');
}

function enableAnalytics() {
  console.log('Analytics enabled');
}

function enableErrorReporting() {
  console.log('Error reporting enabled');
}

function showDebugPanel() {
  console.log('Debug panel shown');
}

function trackPageView() {
  console.log('Page view tracked');
}

function initializeErrorReporting() {
  console.log('Error reporting initialized');
}

function startPerformanceMonitoring() {
  console.log('Performance monitoring started');
}

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export {
  exampleBasicLogging,
  exampleLogManagement,
  exampleLogExport,
  exampleManualPerformance,
  exampleAsyncMeasurement,
  exampleSyncMeasurement,
  examplePerformanceStats,
  exampleEnvironmentDetection,
  exampleFeatureFlags,
  exampleEnvironmentVariables,
  exampleBasicApiCalls,
  exampleApiConfiguration,
  exampleApiInterceptors,
  exampleContractValidation,
  exampleSecurityChecks,
  exampleCompleteValidation,
  exampleErrorHandler,
  exampleRetryHandler,
  exampleValidation,
  exampleCompleteAuditFlow,
  exampleEnvironmentSetup
};
