// Browser-compatible crypto utilities
import { sha256 } from '../utils/browser-crypto';

// Security validation patterns and best practices
export class SecurityValidator {
  // Common security patterns to detect
  private static readonly SECURITY_PATTERNS = {
    // Reentrancy vulnerabilities
    reentrancy: [
      /\.call\s*\(/i,
      /\.send\s*\(/i,
      /\.transfer\s*\(/i,
      /external.*payable/i,
      /selfdestruct/i
    ],

    // Access control issues
    accessControl: [
      /onlyOwner/i,
      /require\s*\(\s*msg\.sender/i,
      /modifier\s+\w*only\w*/i,
      /tx\.origin/i
    ],

    // Integer overflow/underflow
    integerIssues: [
      /\+\+/,
      /--/,
      /\+\s*=/,
      /-\s*=/,
      /\*\s*=/,
      /\/\s*=/,
      /SafeMath/i
    ],

    // Random number generation
    randomness: [
      /block\.timestamp/i,
      /block\.number/i,
      /blockhash/i,
      /now\b/i,
      /rand/i
    ],

    // Gas optimization issues
    gasIssues: [
      /for\s*\(/,
      /while\s*\(/,
      /\.length/,
      /storage\s+/i,
      /memory\s+/i
    ],

    // External calls
    externalCalls: [
      /\.call/i,
      /\.delegatecall/i,
      /interface\s+\w+/i,
      /contract\s+\w+/i
    ]
  };

  // Critical security keywords that require special attention
  private static readonly CRITICAL_KEYWORDS = [
    'selfdestruct',
    'suicide',
    'delegatecall',
    'assembly',
    'tx.origin',
    'blockhash',
    'block.timestamp',
    'now',
    'msg.value',
    'transfer',
    'send',
    'call'
  ];

  // Validate contract for security best practices
  static validateContract(code: string): SecurityValidationResult {
    const issues: SecurityIssue[] = [];
    const suggestions: string[] = [];
    const warnings: string[] = [];

    // Check for common vulnerabilities
    issues.push(...this.detectReentrancy(code));
    issues.push(...this.detectAccessControlIssues(code));
    issues.push(...this.detectIntegerIssues(code));
    issues.push(...this.detectRandomnessIssues(code));
    issues.push(...this.detectGasIssues(code));
    issues.push(...this.detectExternalCallIssues(code));

    // Generate suggestions based on findings
    suggestions.push(...this.generateSuggestions(code, issues));

    // Generate warnings for critical patterns
    warnings.push(...this.generateWarnings(code));

    // Calculate security score
    const securityScore = this.calculateSecurityScore(code, issues);

    return {
      issues,
      suggestions,
      warnings,
      securityScore,
      riskLevel: this.calculateRiskLevel(securityScore, issues),
      complianceChecks: this.performComplianceChecks(code)
    };
  }

  private static detectReentrancy(code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Check for external calls before state changes
      if (/\.call\s*\(|\.send\s*\(|\.transfer\s*\(/i.test(line)) {
        const hasStateChange = this.checkForStateChangeAfter(lines, index);
        if (hasStateChange) {
          issues.push({
            type: 'reentrancy',
            severity: 'high',
            line: index + 1,
            description: 'Potential reentrancy vulnerability: external call before state change',
            recommendation: 'Use checks-effects-interactions pattern or reentrancy guard',
            pattern: line.trim()
          });
        }
      }
    });

    return issues;
  }

  private static detectAccessControlIssues(code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Check for tx.origin usage
      if (/tx\.origin/i.test(line)) {
        issues.push({
          type: 'access_control',
          severity: 'high',
          line: index + 1,
          description: 'Use of tx.origin for authorization is dangerous',
          recommendation: 'Use msg.sender instead of tx.origin',
          pattern: line.trim()
        });
      }

      // Check for missing access control
      if (/function\s+\w+.*public/i.test(line) && !/onlyOwner|require\s*\(/i.test(line)) {
        const functionName = line.match(/function\s+(\w+)/i)?.[1];
        if (functionName && this.isCriticalFunction(functionName)) {
          issues.push({
            type: 'access_control',
            severity: 'medium',
            line: index + 1,
            description: `Critical function '${functionName}' lacks access control`,
            recommendation: 'Add appropriate access control modifiers',
            pattern: line.trim()
          });
        }
      }
    });

    return issues;
  }

  private static detectIntegerIssues(code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');

    // Check if SafeMath is used
    const usesSafeMath = /SafeMath|using.*for.*uint/i.test(code);

    lines.forEach((line, index) => {
      // Check for arithmetic operations without SafeMath
      if (/[\+\-\*\/]\s*=|[\+\-\*\/](?!\s*[=])/g.test(line) && !usesSafeMath) {
        if (!/SafeMath/i.test(line) && /uint|int/i.test(code.substring(0, code.indexOf(line)))) {
          issues.push({
            type: 'integer_overflow',
            severity: 'medium',
            line: index + 1,
            description: 'Potential integer overflow/underflow without SafeMath',
            recommendation: 'Use SafeMath library for arithmetic operations',
            pattern: line.trim()
          });
        }
      }
    });

    return issues;
  }

  private static detectRandomnessIssues(code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Check for weak randomness sources
      if (/block\.timestamp|block\.number|blockhash|now\b/i.test(line)) {
        issues.push({
          type: 'weak_randomness',
          severity: 'medium',
          line: index + 1,
          description: 'Weak source of randomness detected',
          recommendation: 'Use secure random number generation (oracle or commit-reveal)',
          pattern: line.trim()
        });
      }
    });

    return issues;
  }

  private static detectGasIssues(code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Check for unbounded loops
      if (/for\s*\(.*\.length|while\s*\(/i.test(line)) {
        issues.push({
          type: 'gas_limit',
          severity: 'low',
          line: index + 1,
          description: 'Potential gas limit issue with unbounded loop',
          recommendation: 'Implement pagination or gas limit checks',
          pattern: line.trim()
        });
      }

      // Check for expensive storage operations in loops
      if (/storage\s+\w+.*\[/i.test(line)) {
        const previousLines = lines.slice(Math.max(0, index - 5), index);
        if (previousLines.some(l => /for\s*\(|while\s*\(/i.test(l))) {
          issues.push({
            type: 'gas_optimization',
            severity: 'low',
            line: index + 1,
            description: 'Storage operation inside loop is gas-expensive',
            recommendation: 'Use memory variables or batch operations',
            pattern: line.trim()
          });
        }
      }
    });

    return issues;
  }

  private static detectExternalCallIssues(code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Check for unchecked external calls
      if (/\.call\s*\((?!.*require|.*assert)/i.test(line)) {
        issues.push({
          type: 'unchecked_call',
          severity: 'medium',
          line: index + 1,
          description: 'Unchecked external call result',
          recommendation: 'Check return value of external calls',
          pattern: line.trim()
        });
      }

      // Check for delegatecall usage
      if (/\.delegatecall/i.test(line)) {
        issues.push({
          type: 'delegatecall',
          severity: 'high',
          line: index + 1,
          description: 'Delegatecall usage detected - ensure target contract is trusted',
          recommendation: 'Verify delegatecall target and implement proper checks',
          pattern: line.trim()
        });
      }
    });

    return issues;
  }

  private static generateSuggestions(code: string, issues: SecurityIssue[]): string[] {
    const suggestions: string[] = [];

    // General suggestions based on patterns
    if (!code.includes('ReentrancyGuard')) {
      suggestions.push('Consider implementing reentrancy guards for functions with external calls');
    }

    if (!code.includes('Ownable') && !code.includes('AccessControl')) {
      suggestions.push('Implement proper access control mechanisms');
    }

    if (!code.includes('SafeMath') && !code.includes('pragma solidity ^0.8')) {
      suggestions.push('Use SafeMath library or Solidity 0.8+ for automatic overflow checks');
    }

    if (code.includes('selfdestruct')) {
      suggestions.push('Carefully review selfdestruct usage - consider alternatives');
    }

    // Specific suggestions based on issues found
    const issueTypes = new Set(issues.map(issue => issue.type));

    if (issueTypes.has('reentrancy')) {
      suggestions.push('Implement checks-effects-interactions pattern');
      suggestions.push('Consider using OpenZeppelin ReentrancyGuard');
    }

    if (issueTypes.has('access_control')) {
      suggestions.push('Add role-based access control');
      suggestions.push('Use multi-signature wallets for critical operations');
    }

    if (issueTypes.has('gas_limit')) {
      suggestions.push('Implement pagination for large data operations');
      suggestions.push('Set reasonable gas limits for external calls');
    }

    return suggestions;
  }

  private static generateWarnings(code: string): string[] {
    const warnings: string[] = [];

    // Check for critical keywords
    this.CRITICAL_KEYWORDS.forEach(keyword => {
      if (new RegExp(keyword, 'i').test(code)) {
        warnings.push(`Critical keyword '${keyword}' detected - requires careful review`);
      }
    });

    // Check for inline assembly
    if (/assembly\s*\{/i.test(code)) {
      warnings.push('Inline assembly detected - ensure proper review by security experts');
    }

    // Check for experimental features
    if (/pragma\s+experimental/i.test(code)) {
      warnings.push('Experimental features detected - may have unknown security implications');
    }

    return warnings;
  }

  private static calculateSecurityScore(code: string, issues: SecurityIssue[]): number {
    let score = 100;

    // Deduct points based on issue severity
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Bonus points for security best practices
    if (code.includes('ReentrancyGuard')) score += 5;
    if (code.includes('Ownable') || code.includes('AccessControl')) score += 5;
    if (code.includes('SafeMath') || /pragma solidity \^0\.8/i.test(code)) score += 5;
    if (code.includes('require(') && code.includes('revert(')) score += 3;

    return Math.max(0, Math.min(100, score));
  }

  private static calculateRiskLevel(score: number, issues: SecurityIssue[]): 'Low' | 'Medium' | 'High' | 'Critical' {
    const highSeverityCount = issues.filter(i => i.severity === 'high').length;

    if (highSeverityCount > 0 || score < 40) return 'Critical';
    if (score < 60) return 'High';
    if (score < 80) return 'Medium';
    return 'Low';
  }

  private static performComplianceChecks(code: string): ComplianceCheck[] {
    const checks: ComplianceCheck[] = [];

    // EIP compliance checks
    checks.push({
      standard: 'EIP-165',
      compliant: /supportsInterface/i.test(code),
      description: 'Interface detection standard'
    });

    checks.push({
      standard: 'EIP-721',
      compliant: /ERC721|_tokenId|ownerOf/i.test(code),
      description: 'Non-Fungible Token standard'
    });

    checks.push({
      standard: 'EIP-20',
      compliant: /totalSupply|balanceOf|transfer|approve/i.test(code),
      description: 'Token standard'
    });

    // Security standards
    checks.push({
      standard: 'CEI Pattern',
      compliant: !this.violatesChecksEffectsInteractions(code),
      description: 'Checks-Effects-Interactions pattern'
    });

    checks.push({
      standard: 'Access Control',
      compliant: /onlyOwner|require.*msg\.sender|modifier.*only/i.test(code),
      description: 'Proper access control implementation'
    });

    return checks;
  }

  // Helper methods
  private static checkForStateChangeAfter(lines: string[], callIndex: number): boolean {
    const nextLines = lines.slice(callIndex + 1, callIndex + 10);
    return nextLines.some(line =>
      /=(?!=)/g.test(line) &&
      !/==|!=|<=|>=/g.test(line) &&
      !/\/\/|\/\*/g.test(line.trim().substring(0, 2))
    );
  }

  private static isCriticalFunction(functionName: string): boolean {
    const criticalPatterns = [
      /transfer/i,
      /withdraw/i,
      /mint/i,
      /burn/i,
      /destroy/i,
      /selfdestruct/i,
      /kill/i,
      /admin/i,
      /owner/i,
      /pause/i,
      /emergency/i
    ];

    return criticalPatterns.some(pattern => pattern.test(functionName));
  }

  private static violatesChecksEffectsInteractions(code: string): boolean {
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // If external call found
      if (/\.call\(|\.send\(|\.transfer\(/i.test(line)) {
        // Check if state changes occur after
        const subsequentLines = lines.slice(i + 1, i + 5);
        if (subsequentLines.some(l => /=(?!=)/.test(l) && !/==|!=/.test(l))) {
          return true;
        }
      }
    }

    return false;
  }
}

// Input validation for contract code
export class InputValidator {
  static validateContractCode(code: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic syntax validation
    if (!code || code.trim().length === 0) {
      errors.push('Contract code cannot be empty');
    }

    // Check for basic Solidity structure
    if (!/pragma\s+solidity/i.test(code)) {
      warnings.push('Missing pragma solidity directive');
    }

    if (!/contract\s+\w+/i.test(code)) {
      errors.push('No contract definition found');
    }

    // Check for suspicious patterns
    if (this.containsSuspiciousPatterns(code)) {
      errors.push('Potentially malicious code detected');
    }

    // Check file size limits
    if (code.length > 100000) { // 100KB limit
      warnings.push('Contract code is very large - consider optimization');
    }

    // Check for common mistakes
    if (/function.*payable.*onlyOwner/i.test(code)) {
      warnings.push('Payable function with access control detected - ensure this is intentional');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      contractType: this.detectContractType(code),
      complexity: this.calculateComplexity(code)
    };
  }

  private static containsSuspiciousPatterns(code: string): boolean {
    const suspiciousPatterns = [
      /eval\s*\(/i,
      /exec\s*\(/i,
      /system\s*\(/i,
      /shell_exec/i,
      /base64_decode/i,
      /chr\s*\(/i,
      /javascript:/i,
      /<script/i,
      /document\./i,
      /window\./i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(code));
  }

  private static detectContractType(code: string): ContractType {
    if (/ERC721|tokenId|ownerOf/i.test(code)) return 'NFT';
    if (/ERC20|totalSupply|balanceOf/i.test(code)) return 'Token';
    if (/multicall|delegatecall.*assembly/i.test(code)) return 'Proxy';
    if (/factory|clone|create2/i.test(code)) return 'Factory';
    if (/stake|reward|pool/i.test(code)) return 'DeFi';
    if (/vote|proposal|governance/i.test(code)) return 'Governance';
    if (/timelock|delay|queue/i.test(code)) return 'TimeLock';
    if (/oracle|price|feed/i.test(code)) return 'Oracle';
    return 'Contract';
  }

  private static calculateComplexity(code: string): ComplexityMetrics {
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const functions = (code.match(/function\s+\w+/gi) || []).length;
    const modifiers = (code.match(/modifier\s+\w+/gi) || []).length;
    const events = (code.match(/event\s+\w+/gi) || []).length;
    const conditionals = (code.match(/if\s*\(|for\s*\(|while\s*\(/gi) || []).length;
    const externalCalls = (code.match(/\.call\(|\.delegatecall\(|\.send\(|\.transfer\(/gi) || []).length;

    const cyclomaticComplexity = 1 + conditionals; // Simplified calculation
    const cognitiveComplexity = conditionals + (externalCalls * 2); // External calls add cognitive load

    return {
      linesOfCode: lines.length,
      functions,
      modifiers,
      events,
      conditionals,
      externalCalls,
      cyclomaticComplexity,
      cognitiveComplexity,
      complexityLevel: this.getComplexityLevel(cyclomaticComplexity, cognitiveComplexity)
    };
  }

  private static getComplexityLevel(cyclomatic: number, cognitive: number): 'Low' | 'Medium' | 'High' | 'Very High' {
    const avgComplexity = (cyclomatic + cognitive) / 2;

    if (avgComplexity <= 10) return 'Low';
    if (avgComplexity <= 20) return 'Medium';
    if (avgComplexity <= 40) return 'High';
    return 'Very High';
  }
}

// Generate security hash for contract integrity (browser-compatible)
export async function generateSecurityHash(code: string): Promise<string> {
  return await sha256(code);
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Types
export interface SecurityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  line: number;
  description: string;
  recommendation: string;
  pattern: string;
}

export interface SecurityValidationResult {
  issues: SecurityIssue[];
  suggestions: string[];
  warnings: string[];
  securityScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  complianceChecks: ComplianceCheck[];
}

export interface ComplianceCheck {
  standard: string;
  compliant: boolean;
  description: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  contractType: ContractType;
  complexity: ComplexityMetrics;
}

export interface ComplexityMetrics {
  linesOfCode: number;
  functions: number;
  modifiers: number;
  events: number;
  conditionals: number;
  externalCalls: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  complexityLevel: 'Low' | 'Medium' | 'High' | 'Very High';
}

export type ContractType =
  | 'Contract'
  | 'Token'
  | 'NFT'
  | 'Proxy'
  | 'Factory'
  | 'DeFi'
  | 'Governance'
  | 'TimeLock'
  | 'Oracle';