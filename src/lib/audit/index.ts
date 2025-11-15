import type {
  ContractAudit,
  SecurityIssue,
  AuditMetadata,
  ContractAnalysis,
  AuditComparison,
  AnalysisProgress
} from '../../types';
import { CodeNormalizer, DeterministicHasher } from '../hash';
import { ClaudeAPI } from '../claude';
import { AuditCache } from '../cache';
import { SecurityValidator, InputValidator, generateSecurityHash } from '../security';
import { ContractValidator } from '../utils/contractValidator';
import { logger } from '../utils/logger';

export class AuditEngine {
  private claudeAPI: ClaudeAPI;
  private cache: AuditCache;

  constructor(apiKey: string) {
    this.claudeAPI = new ClaudeAPI(apiKey);
    this.cache = new AuditCache();
  }

  public async auditContract(
    code: string,
    metadata?: Partial<AuditMetadata>,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<ContractAudit> {
    if (onProgress) {
      onProgress({
        stage: 'Initialization',
        progress: 5,
        message: 'Starting contract analysis...'
      });
    }

    // Pre-validation checks
    await this.validateContract(code, onProgress);

    if (onProgress) {
      onProgress({
        stage: 'Code Analysis',
        progress: 10,
        message: 'Analyzing contract structure...'
      });
    }

    // Analyze and normalize the contract
    const analysis = CodeNormalizer.analyze(code);

    // Enhanced security pre-checks
    const preAuditChecks = this.performPreAuditChecks(analysis);

    if (onProgress) {
      onProgress({
        stage: 'Pre-audit Security Checks',
        progress: 12,
        message: `Found ${preAuditChecks.length} preliminary security concerns`
      });
    }

    if (onProgress) {
      onProgress({
        stage: 'Checking cache',
        progress: 15,
        message: 'Checking for cached results...'
      });
    }

    // Check cache first for deterministic results
    const cachedResult = this.cache.get(analysis.hash);
    if (cachedResult) {
      if (onProgress) {
        onProgress({
          stage: 'Cache hit',
          progress: 100,
          message: 'Retrieved from cache'
        });
      }
      return cachedResult;
    }

    const startTime = Date.now();

    // Perform Claude analysis
    const claudeResponse = await this.claudeAPI.analyzeContract(analysis, onProgress);

    const endTime = Date.now();
    const analysisTime = endTime - startTime;

    if (onProgress) {
      onProgress({
        stage: 'Finalizing Results',
        progress: 95,
        message: 'Computing enhanced security score...'
      });
    }

    // Enhanced scoring with multiple factors
    const scoreResult = this.calculateEnhancedSecurityScore(
      claudeResponse.issues,
      claudeResponse.gasOptimizations,
      analysis.complexity,
      preAuditChecks
    );

    // Get enhanced security validation
    const securityValidation = SecurityValidator.validateContract(analysis.normalizedCode);

    // Build complete audit result
    const auditMetadata: AuditMetadata = {
      contractName: metadata?.contractName || 'Unknown Contract',
      compiler: metadata?.compiler || 'Unknown',
      linesOfCode: analysis.normalizedCode.split('\n').length,
      functions: analysis.functions,
      complexity: analysis.complexity,
      version: metadata?.version || '1.0.0',
      deploymentNetwork: metadata?.deploymentNetwork
    };

    // Enhanced recommendations including pre-audit warnings and security suggestions
    const enhancedRecommendations = [
      ...claudeResponse.recommendations,
      ...preAuditChecks.map(warning => `Pre-analysis Warning: ${warning}`),
      ...securityValidation.suggestions
    ];

    const audit: ContractAudit = {
      contractHash: await generateSecurityHash(analysis.normalizedCode),
      score: scoreResult.score,
      timestamp: new Date().toISOString(),
      issues: claudeResponse.issues,
      recommendations: enhancedRecommendations,
      gasOptimizations: claudeResponse.gasOptimizations,
      metadata: auditMetadata,
      analysisTime,
      totalIssues: claudeResponse.issues.length,
      highSeverityCount: claudeResponse.issues.filter(i => i.severity === 'HIGH').length,
      mediumSeverityCount: claudeResponse.issues.filter(i => i.severity === 'MEDIUM').length,
      lowSeverityCount: claudeResponse.issues.filter(i => i.severity === 'LOW').length,
      scoreBreakdown: scoreResult.breakdown,
      preAuditWarnings: preAuditChecks,
      riskLevel: securityValidation.riskLevel,
      confidenceLevel: Math.round((securityValidation.securityScore / 100) * 90 + 10),
      securityValidation: securityValidation
    };

    // Cache the result
    this.cache.set(analysis.hash, audit);

    return audit;
  }

  public compareAudits(previous: ContractAudit, current: ContractAudit): AuditComparison {
    const scoreImprovement = current.score - previous.score;

    // Compare issues by hash to detect fixes and new issues
    const previousIssueHashes = new Set(previous.issues.map(i => i.hash));
    const currentIssueHashes = new Set(current.issues.map(i => i.hash));

    const fixedIssues = previous.issues.filter(issue => !currentIssueHashes.has(issue.hash));
    const newIssues = current.issues.filter(issue => !previousIssueHashes.has(issue.hash));
    const persistentIssues = current.issues.filter(issue => previousIssueHashes.has(issue.hash));

    return {
      previousAudit: previous,
      currentAudit: current,
      scoreImprovement,
      fixedIssues,
      newIssues,
      persistentIssues
    };
  }

  public detectResolution(
    previousIssues: SecurityIssue[],
    currentIssues: SecurityIssue[]
  ): SecurityIssue[] {
    const currentHashes = new Set(currentIssues.map(i => i.hash));

    return previousIssues.filter(issue => {
      // Check if the exact issue (by hash) is no longer present
      if (!currentHashes.has(issue.hash)) {
        return true;
      }

      // Additional resolution logic could be added here
      // For example, checking if the issue type is no longer present in the same function
      return false;
    });
  }

  public calculateSecurityScore(issues: SecurityIssue[]): number {
    let score = 100;

    for (const issue of issues) {
      switch (issue.severity) {
        case 'HIGH':
          score -= 20;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
        case 'LOW':
          score -= 5;
          break;
      }
    }

    return Math.max(0, score);
  }

  public async testAPIConnection(): Promise<boolean> {
    return await this.claudeAPI.testConnection();
  }

  public getCacheStats() {
    return this.cache.getStats();
  }

  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Enhanced contract validation with security checks
   */
  private async validateContract(
    code: string,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<void> {
    if (onProgress) {
      onProgress({
        stage: 'Validation',
        progress: 6,
        message: 'Validating contract syntax and security...'
      });
    }

    // Use enhanced input validator
    const validationResult = InputValidator.validateContractCode(code);

    if (!validationResult.isValid) {
      throw new Error(`Contract validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Comprehensive contract validation using ContractValidator
    const contractValidation = ContractValidator.validateComplete(code);

    logger.info('Contract validation results', 'AuditEngine', {
      isValid: contractValidation.summary.isValid,
      totalIssues: contractValidation.summary.totalIssues,
      highSeverityIssues: contractValidation.summary.highSeverityIssues,
      canDeploy: contractValidation.summary.canDeploy
    });

    // Log validation errors and warnings
    if (contractValidation.validation.errors.length > 0) {
      logger.warn('Contract validation errors detected', 'AuditEngine', {
        errors: contractValidation.validation.errors.map(e => e.message)
      });
    }

    if (contractValidation.validation.warnings.length > 0) {
      logger.info('Contract validation warnings', 'AuditEngine', {
        warnings: contractValidation.validation.warnings
      });
    }

    // Check for critical validation errors
    if (!contractValidation.validation.isValid) {
      const errorMessages = contractValidation.validation.errors.map(e => e.message).join(', ');
      throw new Error(`Contract has critical validation errors: ${errorMessages}`);
    }

    // Check for critical security issues from ContractValidator
    const criticalSecurityIssues = contractValidation.securityChecks.filter(
      check => check.severity === 'HIGH' && !check.passed
    );

    if (criticalSecurityIssues.length > 3) {
      const issuesList = criticalSecurityIssues.flatMap(check => check.issues).join('; ');
      logger.error('Too many critical security issues detected', undefined, 'AuditEngine', {
        count: criticalSecurityIssues.length,
        issues: issuesList
      });
      throw new Error(`Too many critical security issues detected (${criticalSecurityIssues.length}). Please address major vulnerabilities before analysis.`);
    }

    // Check contract size
    if (!contractValidation.sizeCheck.withinLimit) {
      throw new Error(contractValidation.sizeCheck.warning || 'Contract size exceeds deployment limit');
    }

    // Also perform existing security validation
    const securityValidation = SecurityValidator.validateContract(code);

    // Check for critical security issues that would prevent analysis
    const criticalIssues = securityValidation.issues.filter(issue => issue.severity === 'high');
    if (criticalIssues.length > 5) {
      throw new Error('Too many critical security issues detected. Please address major vulnerabilities before analysis.');
    }

    if (onProgress) {
      onProgress({
        stage: 'Validation',
        progress: 8,
        message: `Contract validation passed (${validationResult.contractType} detected, ${contractValidation.summary.totalIssues} issues found)`
      });
    }
  }

  /**
   * Enhanced pre-audit security checks using security validator
   */
  private performPreAuditChecks(analysis: ContractAnalysis): string[] {
    // Use the comprehensive security validator
    const securityValidation = SecurityValidator.validateContract(analysis.normalizedCode);

    const warnings: string[] = [
      ...securityValidation.warnings,
      ...securityValidation.suggestions
    ];

    // Add ContractValidator security check results
    const contractValidation = ContractValidator.validateComplete(analysis.normalizedCode);

    // Add all security check issues as warnings
    contractValidation.securityChecks.forEach(check => {
      if (!check.passed && check.issues.length > 0) {
        warnings.push(...check.issues.map(issue => `${check.severity}: ${issue}`));
      }
    });

    // Add validation warnings
    if (contractValidation.validation.warnings.length > 0) {
      warnings.push(...contractValidation.validation.warnings);
    }

    // Add contract size warning if approaching limit
    if (contractValidation.sizeCheck.warning) {
      warnings.push(contractValidation.sizeCheck.warning);
    }

    // Add complexity-based warnings
    if (analysis.functions.length > 50) {
      warnings.push('High function count - consider contract modularity');
    }

    if (analysis.complexity > 20) {
      warnings.push('High cyclomatic complexity detected');
    }

    // Add compliance warnings
    const nonCompliantStandards = securityValidation.complianceChecks
      .filter(check => !check.compliant)
      .map(check => `Non-compliant with ${check.standard}: ${check.description}`);

    warnings.push(...nonCompliantStandards);

    logger.info('Pre-audit checks completed', 'AuditEngine', {
      warningCount: warnings.length,
      securityChecks: contractValidation.securityChecks.length,
      validationWarnings: contractValidation.validation.warnings.length
    });

    return warnings;
  }

  /**
   * Enhanced scoring algorithm with weighted factors
   */
  public calculateEnhancedSecurityScore(
    issues: SecurityIssue[],
    gasOptimizations: any[],
    codeComplexity: number,
    preAuditWarnings: string[]
  ): { score: number; breakdown: any } {
    let score = 100;
    const breakdown = {
      securityIssues: 0,
      gasEfficiency: 0,
      codeQuality: 0,
      preAuditWarnings: 0
    };

    // Security issues scoring (weighted by severity)
    for (const issue of issues) {
      let deduction = 0;
      switch (issue.severity) {
        case 'HIGH':
          deduction = 25; // Increased from 20
          break;
        case 'MEDIUM':
          deduction = 12; // Increased from 10
          break;
        case 'LOW':
          deduction = 6;  // Increased from 5
          break;
      }
      breakdown.securityIssues += deduction;
      score -= deduction;
    }

    // Gas efficiency scoring
    const gasScore = Math.min(15, gasOptimizations.length * 2);
    breakdown.gasEfficiency = gasScore;
    score -= gasScore;

    // Code complexity penalty
    if (codeComplexity > 15) {
      const complexityPenalty = Math.min(10, (codeComplexity - 15) * 2);
      breakdown.codeQuality = complexityPenalty;
      score -= complexityPenalty;
    }

    // Pre-audit warnings penalty
    const warningsPenalty = Math.min(10, preAuditWarnings.length * 1.5);
    breakdown.preAuditWarnings = warningsPenalty;
    score -= warningsPenalty;

    return {
      score: Math.max(0, Math.round(score)),
      breakdown
    };
  }
}