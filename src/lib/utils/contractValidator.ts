/**
 * Contract Validation Utilities
 * Comprehensive validation for Solidity smart contracts
 */

import { Validator, ValidationError } from './errors';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  metadata: {
    pragmaVersion?: string;
    contractNames: string[];
    hasConstructor: boolean;
    hasFallback: boolean;
    hasReceive: boolean;
    imports: string[];
    lineCount: number;
    characterCount: number;
  };
}

export interface SecurityCheckResult {
  passed: boolean;
  issues: string[];
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class ContractValidator {
  /**
   * Validate Solidity contract code
   */
  static validate(code: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Basic validation
    try {
      Validator.solidityContract(code);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(error);
      }
    }

    // Extract metadata
    const metadata = this.extractMetadata(code);

    // Additional validations
    if (metadata.contractNames.length === 0) {
      errors.push(new ValidationError(
        'No contract, library, or interface declarations found',
        'code'
      ));
    }

    if (metadata.lineCount > 1000) {
      warnings.push('Contract is very large (> 1000 lines). Consider splitting into multiple files.');
    }

    if (!metadata.pragmaVersion) {
      warnings.push('No pragma directive found. Specify Solidity version for consistency.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata
    };
  }

  /**
   * Extract contract metadata
   */
  private static extractMetadata(code: string): ValidationResult['metadata'] {
    const pragmaMatch = code.match(/pragma\s+solidity\s+([^;]+);/);
    const pragmaVersion = pragmaMatch ? pragmaMatch[1].trim() : undefined;

    // Find contract declarations
    const contractRegex = /\b(contract|library|interface)\s+(\w+)/g;
    const contractNames: string[] = [];
    let match;

    while ((match = contractRegex.exec(code)) !== null) {
      contractNames.push(match[2]);
    }

    // Check for special functions
    const hasConstructor = /\bconstructor\s*\(/.test(code);
    const hasFallback = /\bfallback\s*\(/.test(code);
    const hasReceive = /\breceive\s*\(/.test(code);

    // Find imports
    const importRegex = /import\s+(?:{[^}]+}\s+from\s+)?["']([^"']+)["']/g;
    const imports: string[] = [];

    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }

    const lineCount = code.split('\n').length;
    const characterCount = code.length;

    return {
      pragmaVersion,
      contractNames,
      hasConstructor,
      hasFallback,
      hasReceive,
      imports,
      lineCount,
      characterCount
    };
  }

  /**
   * Check for common security anti-patterns
   */
  static checkSecurity(code: string): SecurityCheckResult[] {
    const checks: SecurityCheckResult[] = [];

    // Check 1: Unrestricted external calls
    const hasUnrestrictedCalls = this.checkUnrestrictedCalls(code);
    checks.push(hasUnrestrictedCalls);

    // Check 2: tx.origin usage
    const hasTxOrigin = this.checkTxOrigin(code);
    checks.push(hasTxOrigin);

    // Check 3: Floating pragma
    const hasFloatingPragma = this.checkFloatingPragma(code);
    checks.push(hasFloatingPragma);

    // Check 4: Missing event emissions
    const hasMissingEvents = this.checkMissingEvents(code);
    checks.push(hasMissingEvents);

    // Check 5: Dangerous delegatecall
    const hasDangerousDelegatecall = this.checkDelegatecall(code);
    checks.push(hasDangerousDelegatecall);

    return checks;
  }

  /**
   * Check for unrestricted external calls
   */
  private static checkUnrestrictedCalls(code: string): SecurityCheckResult {
    const issues: string[] = [];

    // Look for .call(), .delegatecall(), .send() without proper checks
    const callPattern = /(\w+)\.(?:call|delegatecall|send)\s*\(/g;
    let match;

    while ((match = callPattern.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      issues.push(`Potential unrestricted external call at line ${lineNumber}`);
    }

    return {
      passed: issues.length === 0,
      issues,
      severity: 'HIGH'
    };
  }

  /**
   * Check for tx.origin usage
   */
  private static checkTxOrigin(code: string): SecurityCheckResult {
    const issues: string[] = [];
    const txOriginPattern = /tx\.origin/g;
    let match;

    while ((match = txOriginPattern.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      issues.push(`Use of tx.origin at line ${lineNumber}. Use msg.sender instead.`);
    }

    return {
      passed: issues.length === 0,
      issues,
      severity: 'MEDIUM'
    };
  }

  /**
   * Check for floating pragma
   */
  private static checkFloatingPragma(code: string): SecurityCheckResult {
    const issues: string[] = [];
    const pragmaMatch = code.match(/pragma\s+solidity\s+([^;]+);/);

    if (pragmaMatch) {
      const version = pragmaMatch[1];

      // Check for ^ or > operators
      if (version.includes('^') || version.includes('>')) {
        issues.push(`Floating pragma detected: ${version}. Lock to specific version.`);
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      severity: 'LOW'
    };
  }

  /**
   * Check for missing event emissions
   */
  private static checkMissingEvents(code: string): SecurityCheckResult {
    const issues: string[] = [];

    // Look for state-changing functions without events
    const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s+(?:public|external)[^{]*{([^}]*)}/g;
    let match;

    while ((match = functionPattern.exec(code)) !== null) {
      const functionName = match[1];
      const functionBody = match[2];

      // Check if function modifies state
      const modifiesState = /=\s*[^=]/.test(functionBody) && !functionBody.includes('view') && !functionBody.includes('pure');

      // Check if function emits event
      const emitsEvent = /emit\s+\w+/.test(functionBody);

      if (modifiesState && !emitsEvent) {
        const lineNumber = code.substring(0, match.index).split('\n').length;
        issues.push(`Function ${functionName} at line ${lineNumber} modifies state but doesn't emit events.`);
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      severity: 'LOW'
    };
  }

  /**
   * Check for dangerous delegatecall usage
   */
  private static checkDelegatecall(code: string): SecurityCheckResult {
    const issues: string[] = [];
    const delegatecallPattern = /\.delegatecall\s*\(/g;
    let match;

    while ((match = delegatecallPattern.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      issues.push(`Delegatecall usage at line ${lineNumber}. Ensure target address is trusted.`);
    }

    return {
      passed: issues.length === 0,
      issues,
      severity: 'HIGH'
    };
  }

  /**
   * Check contract size (for deployment)
   */
  static checkContractSize(code: string): {
    estimatedSize: number;
    withinLimit: boolean;
    warning?: string;
  } {
    // Rough estimate: 1 character ≈ 1 byte of bytecode (conservative)
    const estimatedSize = code.length;
    const maxSize = 24576; // 24KB limit

    const result = {
      estimatedSize,
      withinLimit: estimatedSize < maxSize,
      warning: undefined as string | undefined
    };

    if (estimatedSize > maxSize) {
      result.warning = `Estimated contract size (${estimatedSize} bytes) exceeds the 24KB limit. Contract will not deploy.`;
    } else if (estimatedSize > maxSize * 0.9) {
      result.warning = `Contract size is approaching the 24KB limit (${((estimatedSize / maxSize) * 100).toFixed(1)}%).`;
    }

    return result;
  }

  /**
   * Comprehensive validation with all checks
   */
  static validateComplete(code: string): {
    validation: ValidationResult;
    securityChecks: SecurityCheckResult[];
    sizeCheck: ReturnType<typeof ContractValidator.checkContractSize>;
    summary: {
      isValid: boolean;
      totalIssues: number;
      highSeverityIssues: number;
      canDeploy: boolean;
    };
  } {
    const validation = this.validate(code);
    const securityChecks = this.checkSecurity(code);
    const sizeCheck = this.checkContractSize(code);

    const highSeverityIssues = securityChecks.filter(check => check.severity === 'HIGH' && !check.passed).length;
    const totalIssues = validation.errors.length + securityChecks.reduce((acc, check) => acc + check.issues.length, 0);

    return {
      validation,
      securityChecks,
      sizeCheck,
      summary: {
        isValid: validation.isValid && highSeverityIssues === 0,
        totalIssues,
        highSeverityIssues,
        canDeploy: sizeCheck.withinLimit && validation.isValid
      }
    };
  }
}
