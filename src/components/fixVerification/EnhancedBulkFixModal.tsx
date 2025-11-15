import React, { useState, useMemo } from 'react';
import { Card, CardContent, Button } from '../ui';
import {
  X, Upload, CheckCircle, AlertTriangle, XCircle, Clock,
  FileText, Code2, Zap, TrendingUp, ShieldCheck, Eye
} from 'lucide-react';
import type { ContractAudit, BulkFixSubmission } from '../../types';
import { cn } from '../../lib/utils';

interface EnhancedBulkFixModalProps {
  originalAudit: ContractAudit;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fixedCode: string, notes?: string) => Promise<BulkFixSubmission>;
}

export function EnhancedBulkFixModal({
  originalAudit,
  isOpen,
  onClose,
  onSubmit
}: EnhancedBulkFixModalProps) {
  const [fixedCode, setFixedCode] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState('');
  const [submissionResult, setSubmissionResult] = useState<BulkFixSubmission | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'checklist'>('edit');

  const [codeValidation, setCodeValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    hasChanges: boolean;
    estimatedImprovements: {
      potentialScoreIncrease: number;
      issuesLikelyFixed: number;
      codeQualityScore: number;
    };
  }>({
    isValid: false,
    errors: [],
    warnings: [],
    hasChanges: false,
    estimatedImprovements: {
      potentialScoreIncrease: 0,
      issuesLikelyFixed: 0,
      codeQualityScore: 0
    }
  });

  // Enhanced validation for bulk fix
  const validateBulkFix = (code: string) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const hasChanges = code.trim().length > 0;

    if (!code.trim()) {
      setCodeValidation({
        isValid: false,
        errors: [],
        warnings: [],
        hasChanges: false,
        estimatedImprovements: {
          potentialScoreIncrease: 0,
          issuesLikelyFixed: 0,
          codeQualityScore: 0
        }
      });
      return;
    }

    // Comprehensive validation
    if (!code.includes('pragma solidity')) {
      errors.push('Missing pragma directive');
    }

    if (!code.includes('contract ') && !code.includes('library ') && !code.includes('interface ')) {
      errors.push('No contract, library, or interface declaration found');
    }

    if (!code.includes('{') || !code.includes('}')) {
      errors.push('Incomplete contract structure');
    }

    // Check for minimum code size
    if (code.length < 100) {
      errors.push('Code appears too short to be a complete contract');
    }

    // Check if major issues are addressed
    const highSeverityIssues = originalAudit.issues.filter(i => i.severity === 'HIGH');
    let potentialFixedIssues = 0;

    for (const issue of highSeverityIssues) {
      // Simple heuristic: check if the problematic function is present and modified
      if (issue.function !== 'Unknown' && code.includes(issue.function)) {
        potentialFixedIssues++;
      }
    }

    // Advanced analysis
    const dangerousPatterns = [
      { pattern: /\.call\(/, warning: 'Low-level calls detected - ensure reentrancy protection' },
      { pattern: /tx\.origin/, warning: 'tx.origin usage detected - should use msg.sender' },
      { pattern: /block\.timestamp/, warning: 'Timestamp dependency detected' },
      { pattern: /selfdestruct\(/, warning: 'Self-destruct function present - high risk' },
      { pattern: /delegatecall\(/, warning: 'Delegate call detected - proxy pattern risks' }
    ];

    let riskPatterns = 0;
    for (const { pattern, warning } of dangerousPatterns) {
      if (pattern.test(code)) {
        warnings.push(warning);
        riskPatterns++;
      }
    }

    // Security improvements
    const securityPatterns = [
      /nonReentrant/,
      /require\(/,
      /onlyOwner/,
      /SafeMath/,
      /\.add\(|\.sub\(|\.mul\(|\.div\(/
    ];

    let securityFeatures = 0;
    for (const pattern of securityPatterns) {
      if (pattern.test(code)) {
        securityFeatures++;
      }
    }

    // Estimate improvements
    const baseScore = originalAudit.score;
    const potentialScoreIncrease = Math.min(
      40, // Max 40 point increase
      (potentialFixedIssues * 15) + (securityFeatures * 3) - (riskPatterns * 5)
    );

    const codeQualityScore = Math.min(100,
      50 + (securityFeatures * 8) + (code.includes('/**') ? 10 : 0) + (code.includes('require(') ? 10 : 0)
    );

    setCodeValidation({
      isValid: errors.length === 0,
      errors,
      warnings,
      hasChanges,
      estimatedImprovements: {
        potentialScoreIncrease: Math.max(0, potentialScoreIncrease),
        issuesLikelyFixed: potentialFixedIssues,
        codeQualityScore
      }
    });
  };

  const issueChecklist = useMemo(() => {
    return originalAudit.issues.map(issue => ({
      ...issue,
      likelyFixed: fixedCode.includes(issue.function) && fixedCode.length > 0,
      priority: issue.severity === 'HIGH' ? 3 : issue.severity === 'MEDIUM' ? 2 : 1
    })).sort((a, b) => b.priority - a.priority);
  }, [originalAudit.issues, fixedCode]);

  const handleSubmit = async () => {
    if (!fixedCode.trim()) {
      alert('Please provide the complete fixed contract code');
      return;
    }

    if (!codeValidation.isValid) {
      alert('Please fix the validation errors before submitting');
      return;
    }

    if (originalAudit.highSeverityCount > 0 && codeValidation.estimatedImprovements.issuesLikelyFixed === 0) {
      const proceed = confirm(
        'No high-severity issues appear to be addressed. Are you sure you want to submit this fix?'
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const result = await onSubmit(fixedCode, submissionNotes || undefined);
      setSubmissionResult(result);
    } catch (error) {
      console.error('Fix submission failed:', error);
      alert(`Fix submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      setVerificationStep('');
    }
  };

  const handleClose = () => {
    setFixedCode('');
    setSubmissionNotes('');
    setSubmissionResult(null);
    setVerificationStep('');
    setActiveTab('edit');
    setCodeValidation({
      isValid: false,
      errors: [],
      warnings: [],
      hasChanges: false,
      estimatedImprovements: {
        potentialScoreIncrease: 0,
        issuesLikelyFixed: 0,
        codeQualityScore: 0
      }
    });
    onClose();
  };

  const handleCodeChange = (code: string) => {
    setFixedCode(code);
    validateBulkFix(code);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-brand-50 to-brand-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Complete Contract Fix Submission</h2>
            <p className="text-sm text-gray-600 mt-1">
              Submit your complete fixed contract for comprehensive AI verification
            </p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>Original Score: {originalAudit.score}/100</span>
              <span>•</span>
              <span>{originalAudit.totalIssues} issues to address</span>
              <span>•</span>
              <span>{originalAudit.highSeverityCount} high severity</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('edit')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'edit'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <Code2 className="w-4 h-4 inline mr-2" />
            Edit Contract
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'checklist'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <ShieldCheck className="w-4 h-4 inline mr-2" />
            Issue Checklist
            <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
              {originalAudit.totalIssues}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'preview'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
            disabled={!fixedCode.trim()}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Impact Preview
            {codeValidation.estimatedImprovements.potentialScoreIncrease > 0 && (
              <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                +{codeValidation.estimatedImprovements.potentialScoreIncrease}
              </span>
            )}
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Edit Tab */}
          {activeTab === 'edit' && (
            <>
              {/* Fixed Code Input */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="bulk-fixed-code" className="block font-medium text-gray-900">
                    Complete Fixed Contract *
                  </label>
                  <div className="flex items-center space-x-2 text-xs">
                    {codeValidation.hasChanges && (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Contract provided
                      </span>
                    )}
                    {fixedCode.trim() && (
                      <span className="text-gray-500">
                        {fixedCode.split('\n').length} lines
                      </span>
                    )}
                  </div>
                </div>
                <textarea
                  id="bulk-fixed-code"
                  value={fixedCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder={`pragma solidity ^0.8.0;

contract ${originalAudit.metadata.contractName} {
    // Paste your complete fixed contract here
    // Make sure to address all ${originalAudit.totalIssues} security issues
    // Pay special attention to the ${originalAudit.highSeverityCount} high-severity issues
}`}
                  className={cn(
                    "w-full h-96 p-4 border rounded-lg font-mono text-sm transition-colors",
                    codeValidation.errors.length > 0
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : codeValidation.isValid
                      ? "border-green-300 focus:ring-green-500 focus:border-green-500"
                      : "border-gray-300 focus:ring-brand-500 focus:border-brand-500"
                  )}
                  disabled={isSubmitting}
                />

                {/* Validation Feedback */}
                {fixedCode.trim() && (
                  <div className="mt-3 space-y-2">
                    {codeValidation.errors.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium text-red-800 flex items-center text-sm">
                          <XCircle className="w-4 h-4 mr-2" />
                          Validation Errors:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-6 mt-1 text-sm text-red-700">
                          {codeValidation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {codeValidation.warnings.length > 0 && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="font-medium text-orange-800 flex items-center text-sm">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Security Warnings:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-6 mt-1 text-sm text-orange-700">
                          {codeValidation.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {codeValidation.isValid && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-medium text-green-800 flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Contract validation passed
                        </p>
                        {codeValidation.estimatedImprovements.potentialScoreIncrease > 0 && (
                          <p className="text-sm text-green-700 mt-1">
                            Estimated security score improvement: +{codeValidation.estimatedImprovements.potentialScoreIncrease} points
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submission Notes */}
              <div className="mb-6">
                <label htmlFor="bulk-submission-notes" className="block font-medium text-gray-900 mb-2">
                  Fix Summary & Notes (Optional)
                </label>
                <textarea
                  id="bulk-submission-notes"
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Describe the changes you made to fix the security issues:
• Fixed reentrancy vulnerability in withdraw function
• Added access control modifiers
• Implemented SafeMath for arithmetic operations
• Updated timestamp dependencies
..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          {/* Issue Checklist Tab */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Security Issues Checklist</h3>
                <div className="text-sm text-gray-600">
                  {issueChecklist.filter(issue => issue.likelyFixed).length} of {issueChecklist.length} likely addressed
                </div>
              </div>

              <div className="space-y-3">
                {issueChecklist.map((issue, index) => (
                  <Card key={issue.id} className={cn(
                    "transition-colors",
                    issue.likelyFixed ? "bg-green-50 border-green-200" : "bg-white"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mt-0.5",
                          issue.likelyFixed
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        )}>
                          {issue.likelyFixed ? "✓" : index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              issue.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                              issue.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {issue.severity}
                            </span>
                            <span className="font-medium text-gray-900">{issue.type}</span>
                            {issue.likelyFixed && (
                              <span className="text-xs text-green-600 font-medium">
                                Likely Fixed
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
                          <p className="text-xs text-gray-600">
                            Function: {issue.function} (Line {issue.line})
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Impact Preview Tab */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Estimated Impact</h3>

              {codeValidation.isValid ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-800">
                        +{codeValidation.estimatedImprovements.potentialScoreIncrease}
                      </div>
                      <div className="text-sm text-green-600">Score Improvement</div>
                      <div className="text-xs text-green-500 mt-1">
                        {originalAudit.score} → {Math.min(100, originalAudit.score + codeValidation.estimatedImprovements.potentialScoreIncrease)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-6 text-center">
                      <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-800">
                        {codeValidation.estimatedImprovements.issuesLikelyFixed}
                      </div>
                      <div className="text-sm text-blue-600">Issues Likely Fixed</div>
                      <div className="text-xs text-blue-500 mt-1">
                        of {originalAudit.totalIssues} total issues
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                    <CardContent className="p-6 text-center">
                      <Code2 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-800">
                        {codeValidation.estimatedImprovements.codeQualityScore}
                      </div>
                      <div className="text-sm text-purple-600">Code Quality</div>
                      <div className="text-xs text-purple-500 mt-1">
                        Estimated score
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No valid contract to analyze</p>
                  <p className="text-sm">Submit a valid contract to see impact estimates</p>
                </div>
              )}
            </div>
          )}

          {/* Verification Progress */}
          {isSubmitting && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600"></div>
                  <span className="text-sm text-gray-700">
                    {verificationStep || 'Processing comprehensive fix verification...'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Results */}
          {submissionResult && submissionResult.verificationResult && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">Comprehensive Verification Results</h3>

                {/* Overall Status */}
                <div className={cn(
                  "flex items-center space-x-2 p-4 rounded-lg border mb-6",
                  submissionResult.status === 'verified' ? 'bg-green-50 border-green-200 text-green-800' :
                  submissionResult.status === 'partial' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                  'bg-red-50 border-red-200 text-red-800'
                )}>
                  {submissionResult.status === 'verified' ? <CheckCircle className="w-6 h-6" /> :
                   submissionResult.status === 'partial' ? <AlertTriangle className="w-6 h-6" /> :
                   <XCircle className="w-6 h-6" />}
                  <div>
                    <p className="font-medium capitalize">{submissionResult.status} Fix</p>
                    <p className="text-sm opacity-90">
                      Overall Status: {submissionResult.verificationResult.overallStatus.replace('_', ' ')}
                      (Confidence: {submissionResult.verificationResult.confidence}%)
                    </p>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-4">
                  {/* Code Quality Score */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Global Code Quality Score</h4>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            submissionResult.verificationResult.globalCodeQualityScore >= 80
                              ? 'bg-green-500'
                              : submissionResult.verificationResult.globalCodeQualityScore >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${submissionResult.verificationResult.globalCodeQualityScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {submissionResult.verificationResult.globalCodeQualityScore}/100
                      </span>
                    </div>
                  </div>

                  {/* Issue Verifications */}
                  {submissionResult.verificationResult.issueVerifications?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Individual Issue Verifications</h4>
                      <div className="space-y-2">
                        {(submissionResult.verificationResult.issueVerifications || []).map((verification, index) => (
                          <div key={index} className={cn(
                            "p-3 rounded border",
                            verification.isFixed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                          )}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">
                                Issue #{index + 1}
                              </span>
                              <div className="flex items-center space-x-2">
                                {verification.isFixed ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                                <span className="text-xs">
                                  {verification.confidence}% confidence
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{verification.explanation}</p>
                            {verification.remainingConcerns?.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-red-700">Remaining concerns:</p>
                                <ul className="text-xs text-red-600 list-disc list-inside">
                                  {(verification.remainingConcerns || []).map((concern, idx) => (
                                    <li key={idx}>{concern}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Issues */}
                  {submissionResult.verificationResult.newIssuesDetected?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 text-red-800">New Issues Detected</h4>
                      <div className="space-y-2">
                        {(submissionResult.verificationResult.newIssuesDetected || []).map((issue, index) => (
                          <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                issue.severity === 'HIGH' ? 'bg-red-200 text-red-800' :
                                issue.severity === 'MEDIUM' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-blue-200 text-blue-800'
                              }`}>
                                {issue.severity}
                              </span>
                              <span className="font-medium text-red-800">{issue.type}</span>
                            </div>
                            <p className="text-sm text-red-700">{issue.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                    <p className="text-sm text-gray-700">
                      {submissionResult.verificationResult.improvementSummary}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {codeValidation.isValid && (
              <span className="text-green-600">
                ✓ Contract ready for submission
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {submissionResult ? 'Close' : 'Cancel'}
            </Button>
            {!submissionResult && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !fixedCode.trim() || !codeValidation.isValid}
                className="flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Verifying Contract...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>
                      {!fixedCode.trim()
                        ? 'Enter Contract to Submit'
                        : !codeValidation.isValid
                        ? 'Fix Errors to Submit'
                        : 'Submit Complete Fix'
                      }
                    </span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}