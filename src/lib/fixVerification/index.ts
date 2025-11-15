import { ClaudeAPI } from '../claude';
import { DeterministicHasher } from '../hash';
import type {
  SecurityIssue,
  FixSubmission,
  FixVerificationResult,
  ContractAudit,
  BulkFixVerificationResult,
  IndividualIssueVerification,
  FixVerificationProgress,
  IndividualFixSubmission
} from '../../types';

export class FixVerificationEngine {
  private claudeAPI: ClaudeAPI;

  constructor(apiKey: string) {
    this.claudeAPI = new ClaudeAPI(apiKey);
  }

  /**
   * Verify if a submitted fix properly addresses the security issue
   */
  public async verifyFix(
    issue: SecurityIssue,
    originalCode: string,
    fixedCode: string,
    onProgress?: (message: string) => void
  ): Promise<FixVerificationResult> {
    if (onProgress) {
      onProgress('Analyzing submitted fix...');
    }

    const prompt = this.buildVerificationPrompt(issue, originalCode, fixedCode);

    try {
      if (onProgress) {
        onProgress('Sending to Claude for verification...');
      }

      const response = await this.claudeAPI.analyzeCode(prompt, {
        model: 'claude-opus-4-1-20250805',
        temperature: 0,
        max_tokens: 8000
      });

      if (onProgress) {
        onProgress('Processing verification results...');
      }

      return this.parseVerificationResponse(response);
    } catch (error) {
      console.error('Fix verification failed:', error);
      throw new Error(`Fix verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit a fix for verification
   */
  public async submitFix(
    version: string,
    originalVersion: string,
    fixedCode: string,
    submissionNotes?: string,
    onProgressUpdate?: (progress: FixVerificationProgress) => void
  ): Promise<FixSubmission> {
    const submissionId = DeterministicHasher.generateHash(`${version}-${Date.now()}`);
    const startTime = new Date().toISOString();

    const submission: FixSubmission = {
      id: submissionId,
      version,
      originalVersion,
      fixedCode,
      submissionDate: startTime,
      status: 'pending',
      submissionNotes,
      progress: {
        stage: 'initializing',
        progress: 0,
        message: 'Initializing verification process...',
        startTime
      }
    };

    try {
      const verificationResult = await this.verifyFix(
        issue,
        originalCode,
        fixedCode,
        onProgress
      );

      submission.verificationResult = verificationResult;
      submission.status = this.determineSubmissionStatus(verificationResult);

      return submission;
    } catch (error) {
      submission.status = 'rejected';
      throw error;
    }
  }

  /**
   * Build the verification prompt for Claude
   */
  private buildVerificationPrompt(
    issue: SecurityIssue,
    originalCode: string,
    fixedCode: string
  ): string {
    return `
You are SolidAudit, an expert smart contract security auditor. Your task is to verify if a submitted code fix properly addresses a specific security vulnerability.

ORIGINAL SECURITY ISSUE:
- Type: ${issue.type}
- Severity: ${issue.severity}
- Function: ${issue.function}
- Line: ${issue.line}
- Description: ${issue.description}
- Impact: ${issue.impact}
- Recommendation: ${issue.recommendation}
- CWE Reference: ${issue.cweReference}

ORIGINAL VULNERABLE CODE:
\`\`\`solidity
${originalCode}
\`\`\`

SUBMITTED FIX CODE:
\`\`\`solidity
${fixedCode}
\`\`\`

VERIFICATION REQUIREMENTS:
1. Analyze if the submitted fix properly addresses the original security issue
2. Check if the fix introduces any new security vulnerabilities
3. Evaluate the code quality and implementation approach
4. Identify any remaining issues or edge cases not covered
5. Provide improvement suggestions if applicable

RESPONSE FORMAT (JSON only):
{
  "isFixed": boolean,
  "confidence": number_between_0_and_100,
  "explanation": "detailed explanation of the verification analysis",
  "remainingIssues": ["list of any remaining security concerns"],
  "newIssuesIntroduced": ["list of any new vulnerabilities introduced by the fix"],
  "improvementSuggestions": ["list of suggestions to improve the fix"],
  "codeQualityScore": number_between_0_and_100
}

IMPORTANT CRITERIA:
- isFixed: true only if the original vulnerability is completely resolved
- confidence: how certain you are about your assessment (0-100)
- remainingIssues: any aspects of the original issue that are still present
- newIssuesIntroduced: any new security problems created by the fix
- codeQualityScore: overall quality of the implementation (0-100)

Be thorough and precise in your analysis. Consider edge cases, gas efficiency, and potential attack vectors.

RESPOND WITH VALID JSON ONLY:`;
  }

  /**
   * Parse Claude's verification response
   */
  private parseVerificationResponse(responseText: string): FixVerificationResult {
    try {
      // Clean the response to extract only JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in verification response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (typeof parsed.isFixed !== 'boolean') {
        throw new Error('Invalid isFixed field in response');
      }

      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 100) {
        throw new Error('Invalid confidence field in response');
      }

      return {
        isFixed: parsed.isFixed,
        confidence: Math.round(parsed.confidence),
        explanation: parsed.explanation || 'No explanation provided',
        remainingIssues: Array.isArray(parsed.remainingIssues) ? parsed.remainingIssues : [],
        newIssuesIntroduced: Array.isArray(parsed.newIssuesIntroduced) ? parsed.newIssuesIntroduced : [],
        improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions : [],
        codeQualityScore: Math.max(0, Math.min(100, parsed.codeQualityScore || 0)),
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to parse verification response:', error);
      console.error('Raw response:', responseText);
      throw new Error('Failed to parse fix verification results');
    }
  }

  /**
   * Determine submission status based on verification result
   */
  private determineSubmissionStatus(result: FixVerificationResult): 'verified' | 'rejected' | 'partial' {
    if (result.isFixed && result.confidence >= 90 && result.newIssuesIntroduced.length === 0) {
      return 'verified';
    }

    if (result.isFixed && result.confidence >= 70 && result.newIssuesIntroduced.length === 0) {
      return 'partial';
    }

    return 'rejected';
  }

  /**
   * Submit and verify a complete fixed contract against all original issues
   */
  public async submitFixVerification(
    originalAudit: ContractAudit,
    fixedCode: string,
    version: string,
    originalVersion: string,
    submissionNotes?: string,
    onProgressUpdate?: (progress: FixVerificationProgress) => void
  ): Promise<FixSubmission> {
    const submissionId = DeterministicHasher.generateHash(`${version}-${originalAudit.contractHash}-${Date.now()}`);
    const startTime = new Date().toISOString();

    const updateProgress = (stage: FixVerificationProgress['stage'], progress: number, message: string, currentIssue?: string, processedIssues?: number) => {
      const progressData: FixVerificationProgress = {
        stage,
        progress,
        message,
        currentIssue,
        processedIssues,
        totalIssues: originalAudit.totalIssues,
        startTime,
        estimatedTimeRemaining: this.calculateEstimatedTime(progress, startTime)
      };

      if (onProgressUpdate) {
        onProgressUpdate(progressData);
      }

      return progressData;
    };

    const submission: FixSubmission = {
      id: submissionId,
      version,
      originalVersion,
      fixedCode,
      submissionDate: startTime,
      status: 'analyzing',
      submissionNotes,
      progress: updateProgress('initializing', 0, 'Initializing verification process...')
    };

    try {
      submission.progress = updateProgress('analyzing_fixes', 10, 'Analyzing code changes against security issues...');

      const verificationResult = await this.verifyBulkFixWithProgress(
        originalAudit,
        fixedCode,
        (stage, progress, message, currentIssue, processedIssues) => {
          submission.progress = updateProgress(stage, progress, message, currentIssue, processedIssues);
        }
      );

      submission.progress = updateProgress('completed', 100, 'Verification complete!');
      submission.verificationResult = verificationResult;
      submission.status = this.determineBulkSubmissionStatus(verificationResult);

      return submission;
    } catch (error) {
      submission.status = 'rejected';
      submission.progress = updateProgress('completed', 100, 'Verification failed');
      throw error;
    }
  }

  private calculateEstimatedTime(progress: number, startTime: string): number {
    if (progress <= 0) return 0;

    const elapsed = Date.now() - new Date(startTime).getTime();
    const rate = progress / elapsed;
    const remaining = (100 - progress) / rate;

    return Math.max(0, remaining);
  }

  /**
   * Verify if the fixed contract addresses all original security issues with progress tracking
   */
  public async verifyBulkFixWithProgress(
    originalAudit: ContractAudit,
    fixedCode: string,
    onProgress?: (stage: FixVerificationProgress['stage'], progress: number, message: string, currentIssue?: string, processedIssues?: number) => void
  ): Promise<BulkFixVerificationResult> {

    if (onProgress) {
      onProgress('analyzing_fixes', 15, 'Building comprehensive verification prompt...');
    }

    const prompt = this.buildBulkVerificationPrompt(originalAudit, fixedCode);

    try {
      if (onProgress) {
        onProgress('analyzing_fixes', 30, 'Sending to Claude for comprehensive analysis...');
      }

      const response = await this.claudeAPI.analyzeCode(prompt, {
        model: 'claude-opus-4-1-20250805',
        temperature: 0,
        max_tokens: 16000 // Increased for comprehensive analysis
      });

      if (onProgress) {
        onProgress('checking_new_issues', 70, 'Analyzing response for new vulnerabilities...');
      }

      const result = this.parseBulkVerificationResponse(response);

      if (onProgress) {
        onProgress('generating_report', 90, 'Generating comprehensive verification report...', undefined, result.issueVerifications?.length);
      }

      return result;
    } catch (error) {
      console.error('Fix verification failed:', error);
      throw new Error(`Fix verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  public async verifyBulkFix(
    originalAudit: ContractAudit,
    fixedCode: string,
    onProgress?: (message: string) => void
  ): Promise<BulkFixVerificationResult> {
    return this.verifyBulkFixWithProgress(
      originalAudit,
      fixedCode,
      (stage, progress, message) => {
        if (onProgress) {
          onProgress(message);
        }
      }
    );
  }

  /**
   * Build the bulk verification prompt for Claude
   */
  private buildBulkVerificationPrompt(
    originalAudit: ContractAudit,
    fixedCode: string
  ): string {
    const issuesSummary = originalAudit.issues.map((issue, index) => `
${index + 1}. [${issue.severity}] ${issue.type} (Line ${issue.line}, Function: ${issue.function})
   - Description: ${issue.description}
   - Impact: ${issue.impact}
   - CWE: ${issue.cweReference}`).join('\n');

    return `
You are SolidAudit, an expert smart contract security auditor. Your task is to perform comprehensive verification of a complete fixed contract against all original security vulnerabilities identified in a previous audit.

ORIGINAL CONTRACT AUDIT SUMMARY:
- Contract: ${originalAudit.metadata.contractName}
- Original Score: ${originalAudit.score}/100
- Total Issues Found: ${originalAudit.totalIssues}
- High Severity: ${originalAudit.highSeverityCount}
- Medium Severity: ${originalAudit.mediumSeverityCount}
- Low Severity: ${originalAudit.lowSeverityCount}

ORIGINAL SECURITY ISSUES TO VERIFY:
${issuesSummary}

SUBMITTED FIXED CONTRACT CODE:
\`\`\`solidity
${fixedCode}
\`\`\`

COMPREHENSIVE VERIFICATION REQUIREMENTS:
1. For EACH original issue, determine if it has been properly fixed
2. Identify any NEW security vulnerabilities introduced by the fixes
3. Evaluate overall code quality and implementation approach
4. Provide individual verification for each original issue
5. Calculate an overall improvement assessment

RESPONSE FORMAT (JSON only):
{
  "overallStatus": "all_fixed" | "partial_fixes" | "insufficient_fixes" | "new_issues_introduced",
  "confidence": number_between_0_and_100,
  "globalCodeQualityScore": number_between_0_and_100,
  "issueVerifications": [
    {
      "originalIssueId": "issue_id_from_original_audit",
      "isFixed": boolean,
      "confidence": number_between_0_and_100,
      "explanation": "detailed explanation of this specific fix verification",
      "remainingConcerns": ["any remaining issues with this specific fix"]
    }
  ],
  "newIssuesDetected": [
    {
      "type": "vulnerability_type",
      "severity": "HIGH|MEDIUM|LOW",
      "description": "description of new issue",
      "location": "function or line reference"
    }
  ],
  "overallRecommendations": ["general recommendations for further improvement"],
  "improvementSummary": "comprehensive summary of all improvements and remaining concerns"
}

STATUS DEFINITIONS:
- "all_fixed": All original issues completely resolved, no new issues
- "partial_fixes": Most issues fixed but some remain or minor new issues
- "insufficient_fixes": Many original issues remain unfixed
- "new_issues_introduced": Fixes created significant new vulnerabilities

VERIFICATION CRITERIA:
- Be thorough and precise for each individual issue
- Consider edge cases, gas efficiency, and potential attack vectors
- Verify that fixes don't break existing functionality
- Ensure fixes follow security best practices
- Confidence should reflect certainty of your assessment

IMPORTANT: Respond with VALID JSON ONLY containing the complete verification analysis.`;
  }

  /**
   * Parse Claude's bulk verification response
   */
  private parseBulkVerificationResponse(responseText: string): BulkFixVerificationResult {
    try {
      // Clean the response to extract only JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in bulk verification response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      const validStatuses = ['all_fixed', 'partial_fixes', 'insufficient_fixes', 'new_issues_introduced'];
      if (!validStatuses.includes(parsed.overallStatus)) {
        throw new Error('Invalid overallStatus field in response');
      }

      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 100) {
        throw new Error('Invalid confidence field in response');
      }

      // Process issue verifications
      const issueVerifications: IndividualIssueVerification[] = Array.isArray(parsed.issueVerifications)
        ? parsed.issueVerifications.map((iv: any) => ({
            originalIssueId: iv.originalIssueId || '',
            isFixed: Boolean(iv.isFixed),
            confidence: Math.max(0, Math.min(100, iv.confidence || 0)),
            explanation: iv.explanation || 'No explanation provided',
            remainingConcerns: Array.isArray(iv.remainingConcerns) ? iv.remainingConcerns : []
          }))
        : [];

      // Process new issues detected
      const newIssuesDetected: SecurityIssue[] = Array.isArray(parsed.newIssuesDetected)
        ? parsed.newIssuesDetected.map((issue: any, index: number) => ({
            id: DeterministicHasher.generateHash(`new-issue-${Date.now()}-${index}`),
            type: issue.type || 'Unknown Issue',
            severity: ['HIGH', 'MEDIUM', 'LOW'].includes(issue.severity) ? issue.severity : 'MEDIUM',
            line: 0,
            function: issue.location || 'Unknown',
            description: issue.description || 'No description provided',
            impact: 'New issue introduced during fix implementation',
            recommendation: 'Review and address this newly introduced vulnerability',
            cweReference: 'CWE-Unknown',
            hash: DeterministicHasher.generateHash(`${issue.type}-${issue.description}`),
            fixed: false
          }))
        : [];

      return {
        overallStatus: parsed.overallStatus,
        confidence: Math.round(parsed.confidence),
        globalCodeQualityScore: Math.max(0, Math.min(100, parsed.globalCodeQualityScore || 0)),
        issueVerifications,
        newIssuesDetected,
        overallRecommendations: Array.isArray(parsed.overallRecommendations) ? parsed.overallRecommendations : [],
        verifiedAt: new Date().toISOString(),
        improvementSummary: parsed.improvementSummary || 'No summary provided'
      };
    } catch (error) {
      console.error('Failed to parse bulk verification response:', error);
      console.error('Raw response:', responseText);
      throw new Error('Failed to parse bulk fix verification results');
    }
  }

  /**
   * Determine bulk submission status based on verification result
   */
  private determineBulkSubmissionStatus(result: BulkFixVerificationResult): 'verified' | 'rejected' | 'partial' {
    switch (result.overallStatus) {
      case 'all_fixed':
        return result.confidence >= 90 ? 'verified' : 'partial';
      case 'partial_fixes':
        return 'partial';
      case 'insufficient_fixes':
      case 'new_issues_introduced':
        return 'rejected';
      default:
        return 'rejected';
    }
  }

  /**
   * Get a summary of fix verification for multiple issues
   */
  public static getFixVerificationSummary(issues: SecurityIssue[]) {
    const withSubmissions = issues.filter(issue => issue.fixSubmission);
    const verified = withSubmissions.filter(issue =>
      issue.fixSubmission?.status === 'verified'
    );
    const partial = withSubmissions.filter(issue =>
      issue.fixSubmission?.status === 'partial'
    );
    const rejected = withSubmissions.filter(issue =>
      issue.fixSubmission?.status === 'rejected'
    );
    const pending = withSubmissions.filter(issue =>
      issue.fixSubmission?.status === 'pending'
    );

    return {
      total: issues.length,
      submitted: withSubmissions.length,
      verified: verified.length,
      partial: partial.length,
      rejected: rejected.length,
      pending: pending.length,
      notSubmitted: issues.length - withSubmissions.length,
      averageConfidence: withSubmissions.length > 0
        ? Math.round(withSubmissions.reduce((sum, issue) =>
            sum + (issue.fixSubmission?.verificationResult?.confidence || 0), 0) / withSubmissions.length)
        : 0
    };
  }
}