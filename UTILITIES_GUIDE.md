# Utilities Guide

Complete guide to the advanced utilities system in AI-AUDIT.

## Table of Contents

- [Overview](#overview)
- [Logging System](#logging-system)
- [Performance Monitoring](#performance-monitoring)
- [Environment Configuration](#environment-configuration)
- [API Client](#api-client)
- [Contract Validator](#contract-validator)
- [Integration Examples](#integration-examples)

---

## Overview

The AI-AUDIT project includes a comprehensive utilities system providing:

- **Structured Logging**: Multi-level logging with context and metadata
- **Performance Monitoring**: Execution time tracking and metrics collection
- **Environment Management**: Environment-based configuration and feature flags
- **API Client**: Centralized HTTP client with interceptors and retry logic
- **Contract Validation**: Solidity contract validation and security checks

All utilities are available through a centralized export:

```typescript
import {
  logger,
  perfMonitor,
  env,
  apiClient,
  ContractValidator
} from '@/lib/utils';
```

---

## Logging System

### Overview

The logger provides structured, multi-level logging with export capabilities.

### Log Levels

- `DEBUG`: Detailed debugging information
- `INFO`: General informational messages
- `WARN`: Warning messages
- `ERROR`: Error messages
- `CRITICAL`: Critical errors requiring immediate attention

### Basic Usage

```typescript
import { logger } from '@/lib/utils';

// Debug logging
logger.debug('Processing started', 'ComponentName', { userId: 123 });

// Info logging
logger.info('User logged in', 'Authentication', { username: 'john' });

// Warning logging
logger.warn('API rate limit approaching', 'API', { remaining: 10 });

// Error logging
logger.error('Failed to save data', error, 'Database', { table: 'users' });

// Critical logging
logger.critical('System failure', error, 'System', { severity: 'high' });
```

### Advanced Features

#### Get Recent Logs

```typescript
// Get last 50 logs
const recentLogs = logger.getRecent(50);

// Get logs by level
const errors = logger.getByLevel('ERROR');

// Get logs by context
const apiLogs = logger.getByContext('API');
```

#### Export Logs

```typescript
// Export as JSON
const jsonLogs = logger.exportJSON();

// Export as CSV
const csvLogs = logger.exportCSV();

// Download logs
logger.download('json'); // Downloads logs.json
logger.download('csv');  // Downloads logs.csv
```

#### Statistics

```typescript
const stats = logger.getStats();
console.log(stats);
// {
//   total: 1250,
//   byLevel: { DEBUG: 500, INFO: 400, WARN: 200, ERROR: 100, CRITICAL: 50 },
//   byContext: { API: 300, Database: 200, ... },
//   recentErrors: [...]
// }
```

#### Clear Logs

```typescript
// Clear all logs
logger.clear();

// Clear logs by level
logger.clearByLevel('DEBUG');
```

### Best Practices

1. **Always provide context**: Use the `context` parameter to identify the source
2. **Include relevant metadata**: Add useful data to help debugging
3. **Use appropriate log levels**: Don't log everything as ERROR
4. **Export logs regularly**: Download logs for analysis
5. **Clear old logs**: Prevent memory buildup in long-running sessions

---

## Performance Monitoring

### Overview

The performance monitor tracks execution times and provides metrics for optimization.

### Basic Usage

```typescript
import { perfMonitor } from '@/lib/utils';

// Manual timing
perfMonitor.start('operation-name', 'Context');
// ... your operation ...
const duration = perfMonitor.end('operation-name', 'Context', { success: true });
console.log(`Operation took ${duration}ms`);
```

### Async Operations

```typescript
// Measure async function
const result = await perfMonitor.measure(
  'api-call',
  async () => {
    return await fetchData();
  },
  'API',
  { endpoint: '/users' }
);
```

### Sync Operations

```typescript
// Measure sync function
const result = perfMonitor.measureSync(
  'calculation',
  () => {
    return expensiveCalculation();
  },
  'Math'
);
```

### Method Decorator

```typescript
import { measurePerformance } from '@/lib/utils';

class MyService {
  @measurePerformance('custom-name')
  async processData(data: any) {
    // Automatically measured
    return transformedData;
  }
}
```

### Statistics

```typescript
// Get stats for specific metric
const stats = perfMonitor.getStats('api-call');
console.log(stats);
// {
//   totalMeasurements: 100,
//   averageDuration: 245.5,
//   minDuration: 120.3,
//   maxDuration: 890.2,
//   lastDuration: 250.1,
//   slowest: [...],
//   fastest: [...]
// }

// Get all metric names
const metrics = perfMonitor.getMetricNames();

// Get summary
console.log(perfMonitor.getSummary());
```

### Memory Usage

```typescript
const memory = perfMonitor.getMemoryUsage();
if (memory) {
  console.log(`Memory used: ${memory.used / 1024 / 1024} MB`);
  console.log(`Memory total: ${memory.total / 1024 / 1024} MB`);
  console.log(`Memory limit: ${memory.limit / 1024 / 1024} MB`);
}
```

### Clear Metrics

```typescript
// Clear specific metric
perfMonitor.clearMetric('api-call');

// Clear all metrics
perfMonitor.clearAll();
```

### Best Practices

1. **Use consistent names**: Name metrics consistently for easier tracking
2. **Add context**: Always provide context for better organization
3. **Include metadata**: Add relevant data about the operation
4. **Monitor critical paths**: Focus on user-facing and expensive operations
5. **Review regularly**: Check stats to identify bottlenecks

---

## Environment Configuration

### Overview

Centralized environment management with validation and feature flags.

### Basic Usage

```typescript
import { env, isDev, isProd, isStaging } from '@/lib/utils';

// Get environment
console.log(env.env); // 'development' | 'staging' | 'production' | 'test'

// Get API URL
console.log(env.apiBaseUrl);

// Check environment
if (isDev) {
  console.log('Development mode');
}

if (isProd) {
  enableProductionFeatures();
}
```

### Feature Flags

```typescript
import { isFeatureEnabled } from '@/lib/utils';

// Check if feature is enabled
if (isFeatureEnabled('debugMode')) {
  showDebugInfo();
}

if (isFeatureEnabled('analytics')) {
  trackEvent();
}

if (isFeatureEnabled('errorReporting')) {
  reportError();
}

if (isFeatureEnabled('performanceMonitoring')) {
  startMonitoring();
}
```

### Environment Variables

```typescript
import { getEnvVar, getEnvNumber, getEnvBoolean } from '@/lib/utils';

// Get string variable
const apiKey = getEnvVar('VITE_API_KEY', 'default-key', true); // required

// Get number variable
const timeout = getEnvNumber('VITE_TIMEOUT', 5000);

// Get boolean variable
const enableCache = getEnvBoolean('VITE_ENABLE_CACHE', true);
```

### Validation

```typescript
import { envManager } from '@/lib/utils';

const validation = envManager.validate();

if (!validation.isValid) {
  console.error('Environment errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Environment warnings:', validation.warnings);
}
```

### Configuration

Environment variables should be defined in `.env` files:

```bash
# .env
VITE_ENV=development
VITE_API_BASE_URL=http://localhost:3001
VITE_ENABLE_CACHE=true
VITE_TIMEOUT=120000
```

### Best Practices

1. **Use environment-specific configs**: Different settings for dev/staging/prod
2. **Validate on startup**: Check environment validity early
3. **Use feature flags**: Control features per environment
4. **Never commit secrets**: Use `.env.local` for sensitive data
5. **Document variables**: Maintain `.env.example` with all variables

---

## API Client

### Overview

Centralized HTTP client with interceptors, retry logic, and error handling.

### Basic Usage

```typescript
import { apiClient } from '@/lib/utils';

// GET request
const response = await apiClient.get('/api/users');
console.log(response.data);

// POST request
const newUser = await apiClient.post('/api/users', {
  name: 'John',
  email: 'john@example.com'
});

// PUT request
const updated = await apiClient.put('/api/users/123', {
  name: 'Jane'
});

// DELETE request
await apiClient.delete('/api/users/123');

// PATCH request
const patched = await apiClient.patch('/api/users/123', {
  email: 'newemail@example.com'
});
```

### Request Configuration

```typescript
import { apiClient } from '@/lib/utils';

// With custom configuration
const response = await apiClient.get('/api/users', {
  timeout: 60000,           // Custom timeout (default: 120000ms)
  retry: true,              // Enable retry (default: true)
  maxRetries: 5,            // Max retry attempts (default: 3)
  skipErrorHandler: false,  // Skip error handler (default: false)
  measure: true,            // Measure performance (default: true)
  headers: {
    'Custom-Header': 'value'
  }
});
```

### Interceptors

#### Request Interceptor

```typescript
import { apiClient } from '@/lib/utils';

// Add custom request interceptor
apiClient.addRequestInterceptor((config) => {
  // Add custom headers
  const headers = new Headers(config.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return {
    ...config,
    headers: headers as any
  };
});
```

#### Response Interceptor

```typescript
import { apiClient } from '@/lib/utils';

// Add custom response interceptor
apiClient.addResponseInterceptor(async (response) => {
  // Log all responses
  console.log('Response:', response.status);

  // Transform response
  return response;
});
```

### Convenience Methods

```typescript
import { get, post, put, del, patch } from '@/lib/utils';

// Use convenience functions
const users = await get('/api/users');
const created = await post('/api/users', userData);
const updated = await put('/api/users/123', userData);
await del('/api/users/123');
const patched = await patch('/api/users/123', { email: 'new@email.com' });
```

### Error Handling

The API client automatically:
- Retries failed requests with exponential backoff
- Handles timeouts
- Logs all errors
- Provides user-friendly error messages

```typescript
try {
  const data = await apiClient.get('/api/data');
} catch (error) {
  // Error is automatically logged
  console.error('Request failed:', error.message);
}
```

### Best Practices

1. **Use interceptors for common logic**: Auth, logging, etc.
2. **Configure timeouts**: Set appropriate timeouts for different operations
3. **Enable retry for network calls**: Helps with transient failures
4. **Measure performance**: Track API response times
5. **Handle errors gracefully**: Provide fallbacks for failed requests

---

## Contract Validator

### Overview

Comprehensive Solidity contract validation and security checks.

### Basic Validation

```typescript
import { ContractValidator } from '@/lib/utils';

const contractCode = `
pragma solidity ^0.8.0;

contract MyContract {
  function transfer(address to, uint256 amount) public {
    // ...
  }
}
`;

// Validate contract
const result = ContractValidator.validate(contractCode);

if (result.isValid) {
  console.log('Contract is valid');
} else {
  console.error('Errors:', result.errors);
}

console.log('Warnings:', result.warnings);
console.log('Metadata:', result.metadata);
// {
//   pragmaVersion: '^0.8.0',
//   contractNames: ['MyContract'],
//   hasConstructor: false,
//   hasFallback: false,
//   hasReceive: false,
//   imports: [],
//   lineCount: 8,
//   characterCount: 150
// }
```

### Security Checks

```typescript
import { ContractValidator } from '@/lib/utils';

// Perform security checks
const securityChecks = ContractValidator.checkSecurity(contractCode);

securityChecks.forEach(check => {
  if (!check.passed) {
    console.log(`${check.severity}: ${check.issues.join(', ')}`);
  }
});

// Security checks include:
// - Unrestricted external calls
// - tx.origin usage
// - Floating pragma
// - Missing event emissions
// - Dangerous delegatecall
```

### Contract Size Check

```typescript
import { ContractValidator } from '@/lib/utils';

const sizeCheck = ContractValidator.checkContractSize(contractCode);

console.log(`Estimated size: ${sizeCheck.estimatedSize} bytes`);
console.log(`Within limit: ${sizeCheck.withinLimit}`);

if (sizeCheck.warning) {
  console.warn(sizeCheck.warning);
}
```

### Complete Validation

```typescript
import { ContractValidator } from '@/lib/utils';

// Perform all validations at once
const complete = ContractValidator.validateComplete(contractCode);

console.log('Summary:', complete.summary);
// {
//   isValid: true,
//   totalIssues: 3,
//   highSeverityIssues: 1,
//   canDeploy: true
// }

console.log('Validation:', complete.validation);
console.log('Security Checks:', complete.securityChecks);
console.log('Size Check:', complete.sizeCheck);
```

### Security Check Details

#### Unrestricted External Calls

Detects potentially dangerous `.call()`, `.delegatecall()`, `.send()` usage:

```solidity
// ❌ Detected
someAddress.call{value: amount}("");

// ✅ Better
(bool success, ) = someAddress.call{value: amount}("");
require(success, "Transfer failed");
```

#### tx.origin Usage

Detects `tx.origin` which should be avoided:

```solidity
// ❌ Detected
require(tx.origin == owner);

// ✅ Better
require(msg.sender == owner);
```

#### Floating Pragma

Detects pragma with `^` or `>` operators:

```solidity
// ❌ Detected
pragma solidity ^0.8.0;

// ✅ Better
pragma solidity 0.8.20;
```

#### Missing Events

Detects state-changing functions without event emissions:

```solidity
// ❌ Detected
function updateValue(uint256 newValue) public {
  value = newValue;
}

// ✅ Better
event ValueUpdated(uint256 newValue);

function updateValue(uint256 newValue) public {
  value = newValue;
  emit ValueUpdated(newValue);
}
```

#### Dangerous Delegatecall

Detects `delegatecall` usage which requires careful handling:

```solidity
// ❌ Detected without proper checks
target.delegatecall(data);

// ✅ Better with validation
require(isTrustedContract(target), "Untrusted target");
target.delegatecall(data);
```

### Best Practices

1. **Validate before deployment**: Always run validation before deploying
2. **Fix HIGH severity issues**: Address critical security issues first
3. **Consider warnings**: Review and address warnings when possible
4. **Check contract size**: Ensure contract fits within 24KB limit
5. **Use locked pragma**: Avoid floating pragma versions in production

---

## Integration Examples

### Full Example: API Call with Logging and Performance Monitoring

```typescript
import { apiClient, logger, perfMonitor } from '@/lib/utils';

async function fetchUserData(userId: string) {
  logger.info('Fetching user data', 'UserService', { userId });

  perfMonitor.start('fetchUserData', 'UserService', { userId });

  try {
    const response = await apiClient.get(`/api/users/${userId}`, {
      timeout: 30000,
      retry: true,
      maxRetries: 3
    });

    const duration = perfMonitor.end('fetchUserData', 'UserService', {
      success: true,
      dataSize: JSON.stringify(response.data).length
    });

    logger.info(`User data fetched in ${duration}ms`, 'UserService', {
      userId,
      duration
    });

    return response.data;
  } catch (error) {
    perfMonitor.end('fetchUserData', 'UserService', { error: true });

    logger.error('Failed to fetch user data', error as Error, 'UserService', {
      userId
    });

    throw error;
  }
}
```

### Full Example: Contract Audit with Validation

```typescript
import {
  ContractValidator,
  logger,
  perfMonitor
} from '@/lib/utils';

async function auditContract(code: string) {
  logger.info('Starting contract audit', 'AuditService');

  perfMonitor.start('contractAudit', 'AuditService');

  try {
    // Comprehensive validation
    const validation = ContractValidator.validateComplete(code);

    logger.info('Validation complete', 'AuditService', {
      isValid: validation.summary.isValid,
      totalIssues: validation.summary.totalIssues,
      canDeploy: validation.summary.canDeploy
    });

    // Check if contract is valid
    if (!validation.validation.isValid) {
      const errors = validation.validation.errors.map(e => e.message);
      throw new Error(`Invalid contract: ${errors.join(', ')}`);
    }

    // Check for critical security issues
    const criticalIssues = validation.securityChecks.filter(
      check => check.severity === 'HIGH' && !check.passed
    );

    if (criticalIssues.length > 0) {
      logger.warn('Critical security issues found', 'AuditService', {
        count: criticalIssues.length
      });
    }

    // Check contract size
    if (!validation.sizeCheck.withinLimit) {
      throw new Error(validation.sizeCheck.warning);
    }

    const duration = perfMonitor.end('contractAudit', 'AuditService', {
      success: true
    });

    logger.info(`Contract audit completed in ${duration}ms`, 'AuditService');

    return validation;
  } catch (error) {
    perfMonitor.end('contractAudit', 'AuditService', { error: true });

    logger.error('Contract audit failed', error as Error, 'AuditService');

    throw error;
  }
}
```

### Full Example: Environment-Based Configuration

```typescript
import {
  env,
  isDev,
  isProd,
  isFeatureEnabled,
  logger,
  apiClient
} from '@/lib/utils';

// Configure based on environment
if (isDev) {
  logger.info('Running in development mode', 'App');

  // Enable debug logging in development
  if (isFeatureEnabled('debugMode')) {
    console.log('Debug mode enabled');
  }
}

if (isProd) {
  logger.info('Running in production mode', 'App');

  // Enable analytics in production
  if (isFeatureEnabled('analytics')) {
    initializeAnalytics();
  }

  // Enable error reporting in production
  if (isFeatureEnabled('errorReporting')) {
    initializeErrorReporting();
  }
}

// Configure API client based on environment
const apiBaseUrl = env.apiBaseUrl;
console.log(`API Base URL: ${apiBaseUrl}`);

// Add authorization for production
if (isProd) {
  apiClient.addRequestInterceptor((config) => {
    const headers = new Headers(config.headers);
    headers.set('Authorization', `Bearer ${getAuthToken()}`);
    return { ...config, headers: headers as any };
  });
}
```

---

## Summary

The utilities system provides:

✅ **Structured Logging** - Track application behavior with detailed logs
✅ **Performance Monitoring** - Identify and optimize bottlenecks
✅ **Environment Management** - Configure application per environment
✅ **API Client** - Centralized, reliable HTTP communication
✅ **Contract Validation** - Comprehensive Solidity security checks

All utilities are production-ready and actively used throughout the application.

For more examples, see the integration in:
- `src/lib/claude/index.ts` - Claude API with logging and performance
- `src/lib/cache/index.ts` - Cache operations with logging
- `src/lib/versionManager.ts` - Version management with logging
- `src/lib/audit/index.ts` - Audit process with validation

---

**Need Help?**

Check the source code in `src/lib/utils/` for implementation details and additional features.
