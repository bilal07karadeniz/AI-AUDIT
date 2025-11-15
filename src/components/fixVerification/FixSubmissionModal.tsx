import React, { useState, useMemo } from 'react';
import { Card, CardContent, Button } from '../ui';
import { X, Upload, CheckCircle, AlertTriangle, XCircle, Clock, Eye, Code2, FileText, Zap } from 'lucide-react';
import type { SecurityIssue, FixSubmission } from '../../types';
import { cn } from '../../lib/utils';

interface FixSubmissionModalProps {
  issue: SecurityIssue;
  originalCode: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fixedCode: string, notes?: string) => Promise<FixSubmission>;
}

export function FixSubmissionModal({
  issue,
  originalCode,
  isOpen,
  onClose,
  onSubmit
}: FixSubmissionModalProps) {
  const [fixedCode, setFixedCode] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState('');
  const [submissionResult, setSubmissionResult] = useState<FixSubmission | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'diff' | 'preview'>('edit');
  const [codeValidation, setCodeValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    hasChanges: boolean;
  }>({ isValid: false, errors: [], warnings: [], hasChanges: false });

  // Live validation for fixed code
  const validateFixedCode = (code: string) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const hasChanges = code.trim() !== originalCode.trim();

    if (!code.trim()) {
      setCodeValidation({ isValid: false, errors: [], warnings: [], hasChanges: false });
      return;
    }

    // Basic syntax validation
    if (!code.includes('pragma solidity')) {
      errors.push('Missing pragma directive');
    }

    if (!code.includes('{') || !code.includes('}')) {
      errors.push('Incomplete code structure');
    }

    // Check if code actually addresses the issue function
    if (issue.function !== 'Unknown' && !code.includes(issue.function)) {
      warnings.push(`The issue was in function '${issue.function}' but it's not present in the fixed code`);
    }

    // Check for minimal changes
    if (hasChanges && Math.abs(code.length - originalCode.length) < 10) {
      warnings.push('Very minimal changes detected - ensure the fix is comprehensive');
    }

    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      { pattern: /\.call\(/, warning: 'Low-level calls detected - ensure reentrancy protection' },
      { pattern: /tx\.origin/, warning: 'tx.origin usage detected' },
      { pattern: /block\.timestamp/, warning: 'Timestamp dependency detected' }
    ];

    for (const { pattern, warning } of dangerousPatterns) {
      if (pattern.test(code)) {
        warnings.push(warning);
      }
    }

    setCodeValidation({
      isValid: errors.length === 0,
      errors,
      warnings,
      hasChanges
    });
  };

  // Generate code diff highlights
  const codeDiff = useMemo(() => {
    if (!fixedCode.trim() || !originalCode.trim()) return null;

    const originalLines = originalCode.split('\n');
    const fixedLines = fixedCode.split('\n');
    const maxLines = Math.max(originalLines.length, fixedLines.length);

    const diff = [];
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const fixedLine = fixedLines[i] || '';

      if (originalLine !== fixedLine) {
        diff.push({
          lineNumber: i + 1,
          original: originalLine,
          fixed: fixedLine,
          type: originalLine && fixedLine ? 'modified' : originalLine ? 'removed' : 'added'
        });
      }
    }

    return diff;
  }, [originalCode, fixedCode]);

  const handleSubmit = async () => {
    if (!fixedCode.trim()) {
      alert('Please provide the fixed code');
      return;
    }

    if (!codeValidation.isValid) {
      alert('Please fix the validation errors before submitting');
      return;
    }

    if (!codeValidation.hasChanges) {
      const proceed = confirm('No changes detected from original code. Are you sure you want to submit?');
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
    setCodeValidation({ isValid: false, errors: [], warnings: [], hasChanges: false });
    onClose();
  };

  const handleCodeChange = (code: string) => {
    setFixedCode(code);
    validateFixedCode(code);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'partial':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Submit Fix Verification</h2>
            <p className="text-sm text-gray-600 mt-1">
              Submit your fixed code for AI verification
            </p>
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
            Edit Code
          </button>
          <button
            onClick={() => setActiveTab('diff')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'diff'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
            disabled={!fixedCode.trim()}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Compare Changes
            {codeDiff && codeDiff.length > 0 && (
              <span className="ml-2 bg-brand-100 text-brand-600 text-xs px-2 py-0.5 rounded-full">
                {codeDiff.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'preview'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Preview
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Issue Details */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-2">Issue to Fix</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    issue.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                    issue.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {issue.severity}
                  </span>
                  <span className="font-medium">{issue.type}</span>
                </div>
                <p className="text-gray-700">{issue.description}</p>
                <p className="text-gray-600">
                  <span className="font-medium">Function:</span> {issue.function} (Line {issue.line})
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Recommendation:</span> {issue.recommendation}
                </p>
                {issue.proofOfConcept && (
                  <details className="mt-2">
                    <summary className="font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                      Proof of Concept
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded font-mono text-xs overflow-x-auto">
                      <pre>{issue.proofOfConcept}</pre>
                    </div>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tab Content */}
          {activeTab === 'edit' && (
            <>
              {/* Original Code Reference */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Original Code (Reference)</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm overflow-x-auto max-h-40">
                  <pre className="whitespace-pre-wrap">{originalCode}</pre>
                </div>
              </div>

              {/* Fixed Code Input */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="fixed-code" className="block font-medium text-gray-900">
                    Fixed Code *
                  </label>
                  <div className="flex items-center space-x-2 text-xs">
                    {codeValidation.hasChanges && (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Changes detected
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
                  id="fixed-code"
                  value={fixedCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="Paste your fixed code here...\n\nTip: Make sure to include the complete function or contract with your fixes."
                  className={cn(
                    "w-full h-64 p-4 border rounded-lg font-mono text-sm transition-colors",
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
                  <div className="mt-2 space-y-1">
                    {codeValidation.errors.length > 0 && (
                      <div className="text-sm text-red-600">
                        <p className="font-medium flex items-center">
                          <XCircle className="w-4 h-4 mr-1" />
                          Validation Errors:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-5">
                          {codeValidation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {codeValidation.warnings.length > 0 && (
                      <div className="text-sm text-orange-600">
                        <p className="font-medium flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Warnings:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-5">
                          {codeValidation.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {codeValidation.isValid && codeValidation.hasChanges && codeValidation.warnings.length === 0 && (
                      <div className="text-sm text-green-600">
                        <p className="font-medium flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Code validation passed
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Diff View */}
          {activeTab === 'diff' && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-4">Code Changes</h3>
              {codeDiff && codeDiff.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 mb-3">
                    {codeDiff.length} change{codeDiff.length !== 1 ? 's' : ''} detected
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                    {codeDiff.map((change, index) => (
                      <div key={index} className="border-b border-gray-200 last:border-b-0">
                        <div className="px-3 py-1 bg-gray-100 text-xs font-medium text-gray-600">
                          Line {change.lineNumber} - {change.type}
                        </div>
                        {change.type === 'modified' && (
                          <>
                            <div className="flex">
                              <div className="w-4 bg-red-100 text-red-600 text-xs text-center">-</div>
                              <div className="flex-1 px-3 py-1 bg-red-50 font-mono text-sm text-red-800">
                                {change.original}
                              </div>
                            </div>
                            <div className="flex">
                              <div className="w-4 bg-green-100 text-green-600 text-xs text-center">+</div>
                              <div className="flex-1 px-3 py-1 bg-green-50 font-mono text-sm text-green-800">
                                {change.fixed}
                              </div>
                            </div>
                          </>
                        )}
                        {change.type === 'removed' && (
                          <div className="flex">
                            <div className="w-4 bg-red-100 text-red-600 text-xs text-center">-</div>
                            <div className="flex-1 px-3 py-1 bg-red-50 font-mono text-sm text-red-800">
                              {change.original}
                            </div>
                          </div>
                        )}
                        {change.type === 'added' && (
                          <div className="flex">
                            <div className="w-4 bg-green-100 text-green-600 text-xs text-center">+</div>
                            <div className="flex-1 px-3 py-1 bg-green-50 font-mono text-sm text-green-800">
                              {change.fixed}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No changes detected yet</p>
                  <p className="text-sm">Edit the code to see differences</p>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {activeTab === 'preview' && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-4">Code Preview</h3>
              {fixedCode.trim() ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{fixedCode}</pre>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No code to preview</p>
                  <p className="text-sm">Enter your fixed code to see the preview</p>
                </div>
              )}
            </div>
          )}

          {/* Submission Notes */}
          <div className="mb-6">
            <label htmlFor="submission-notes" className="block font-medium text-gray-900 mb-2">
              Submission Notes (Optional)
            </label>
            <textarea
              id="submission-notes"
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              placeholder="Add any notes about your fix (e.g., explanation of changes, design decisions)..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Verification Progress */}
          {isSubmitting && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-700">
                    {verificationStep || 'Processing fix submission...'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Results */}
          {submissionResult && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">Verification Results</h3>

                {/* Status */}
                <div className={`flex items-center space-x-2 p-3 rounded-lg border mb-4 ${getStatusColor(submissionResult.status)}`}>
                  {getStatusIcon(submissionResult.status)}
                  <span className="font-medium capitalize">{submissionResult.status}</span>
                  {submissionResult.verificationResult && (
                    <span className="text-sm">
                      (Confidence: {submissionResult.verificationResult.confidence}%)
                    </span>
                  )}
                </div>

                {submissionResult.verificationResult && (
                  <div className="space-y-4">
                    {/* Explanation */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Analysis</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {submissionResult.verificationResult.explanation}
                      </p>
                    </div>

                    {/* Code Quality Score */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Code Quality Score</h4>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              submissionResult.verificationResult.codeQualityScore >= 80
                                ? 'bg-green-500'
                                : submissionResult.verificationResult.codeQualityScore >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${submissionResult.verificationResult.codeQualityScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {submissionResult.verificationResult.codeQualityScore}/100
                        </span>
                      </div>
                    </div>

                    {/* Remaining Issues */}
                    {submissionResult.verificationResult.remainingIssues?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Remaining Issues</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {(submissionResult.verificationResult.remainingIssues || []).map((issue, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* New Issues */}
                    {submissionResult.verificationResult.newIssuesIntroduced?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">New Issues Introduced</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {(submissionResult.verificationResult.newIssuesIntroduced || []).map((issue, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvement Suggestions */}
                    {submissionResult.verificationResult.improvementSuggestions?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Improvement Suggestions</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {(submissionResult.verificationResult.improvementSuggestions || []).map((suggestion, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
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
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>
                    {!fixedCode.trim()
                      ? 'Enter Code to Submit'
                      : !codeValidation.isValid
                      ? 'Fix Errors to Submit'
                      : 'Submit Fix'
                    }
                  </span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}