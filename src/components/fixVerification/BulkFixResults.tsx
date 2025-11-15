import React, { useState } from 'react';
import { Card, CardContent, Badge } from '../ui';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';
import { cn, getColorForSeverity } from '../../lib/utils';
import type { FixSubmission, IndividualIssueVerification } from '../../types';

interface BulkFixResultsProps {
  bulkSubmission: FixSubmission;
  className?: string;
}

export function BulkFixResults({ bulkSubmission, className = '' }: BulkFixResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const { verificationResult } = bulkSubmission;
  if (!verificationResult) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-gray-500">No verification results available</p>
        </CardContent>
      </Card>
    );
  }

  const getOverallStatusConfig = (status: string) => {
    switch (status) {
      case 'all_fixed':
        return {
          icon: CheckCircle,
          text: 'All Issues Fixed',
          className: 'bg-green-100 text-green-800 border-green-200',
          description: 'All original issues have been successfully resolved'
        };
      case 'partial_fixes':
        return {
          icon: AlertTriangle,
          text: 'Partial Fixes',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: 'Most issues fixed but some remain or minor new issues detected'
        };
      case 'insufficient_fixes':
        return {
          icon: XCircle,
          text: 'Insufficient Fixes',
          className: 'bg-red-100 text-red-800 border-red-200',
          description: 'Many original issues remain unfixed'
        };
      case 'new_issues_introduced':
        return {
          icon: XCircle,
          text: 'New Issues Introduced',
          className: 'bg-red-100 text-red-800 border-red-200',
          description: 'Fixes introduced new security vulnerabilities'
        };
      default:
        return {
          icon: AlertTriangle,
          text: 'Unknown Status',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Unable to determine verification status'
        };
    }
  };

  const statusConfig = getOverallStatusConfig(verificationResult.overallStatus);
  const StatusIcon = statusConfig.icon;

  // Calculate verification summary
  const issueVerifications = verificationResult.issueVerifications || [];
  const newIssuesDetected = verificationResult.newIssuesDetected || [];
  const overallRecommendations = verificationResult.overallRecommendations || [];

  const verificationSummary = {
    fixed: issueVerifications.filter(v => v.isFixed).length,
    unfixed: issueVerifications.filter(v => !v.isFixed).length,
    newIssues: newIssuesDetected.length,
    averageConfidence: issueVerifications.length > 0
      ? Math.round(issueVerifications.reduce((sum, v) => sum + v.confidence, 0) / issueVerifications.length)
      : 0
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Status Card */}
      <Card className={`border-2 ${statusConfig.className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <StatusIcon className="h-8 w-8" />
              <div>
                <h3 className="text-lg font-semibold">{statusConfig.text}</h3>
                <p className="text-sm opacity-80">{statusConfig.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{verificationResult.confidence}%</div>
              <div className="text-sm opacity-80">Confidence</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-current border-opacity-20">
            <div className="text-center">
              <div className="text-2xl font-bold">{verificationSummary.fixed}</div>
              <div className="text-xs opacity-80">Fixed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{verificationSummary.unfixed}</div>
              <div className="text-xs opacity-80">Unfixed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{verificationSummary.newIssues}</div>
              <div className="text-xs opacity-80">New Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{verificationResult.globalCodeQualityScore}</div>
              <div className="text-xs opacity-80">Quality Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Verification Results */}
      <Card>
        <CardContent className="p-6">
          {/* Summary Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('summary')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900">Verification Summary</h3>
              {expandedSections.has('summary') ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSections.has('summary') && (
              <div className="mt-4 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{verificationResult.improvementSummary}</p>
                </div>

                {overallRecommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Overall Recommendations</h4>
                    <ul className="space-y-2">
                      {overallRecommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Individual Issue Verifications */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('issues')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                Individual Issue Verifications ({issueVerifications.length})
              </h3>
              {expandedSections.has('issues') ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSections.has('issues') && (
              <div className="mt-4 space-y-3">
                {issueVerifications.map((verification, index) => (
                  <IssueVerificationCard key={verification.originalIssueId} verification={verification} />
                ))}
              </div>
            )}
          </div>

          {/* New Issues Detected */}
          {newIssuesDetected.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('newIssues')}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900 text-red-600">
                  New Issues Detected ({newIssuesDetected.length})
                </h3>
                {expandedSections.has('newIssues') ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {expandedSections.has('newIssues') && (
                <div className="mt-4 space-y-3">
                  {newIssuesDetected.map((issue, index) => (
                    <div key={issue.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-start space-x-3">
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge severity={issue.severity}>{issue.severity}</Badge>
                            <span className="text-sm font-medium text-gray-900">{issue.type}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
                          <p className="text-sm text-gray-600">Location: {issue.function}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Details */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Submitted</span>
              <p className="font-medium text-gray-900">
                {new Date(bulkSubmission.submissionDate).toLocaleDateString()} at{' '}
                {new Date(bulkSubmission.submissionDate).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Verified</span>
              <p className="font-medium text-gray-900">
                {new Date(verificationResult.verifiedAt).toLocaleDateString()} at{' '}
                {new Date(verificationResult.verifiedAt).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Submission ID</span>
              <p className="font-medium text-gray-900 font-mono text-xs">
                {bulkSubmission.id.slice(0, 8)}...{bulkSubmission.id.slice(-8)}
              </p>
            </div>
          </div>
          {bulkSubmission.submissionNotes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">Submission Notes:</span>
              <p className="text-sm text-gray-700 mt-1">{bulkSubmission.submissionNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function IssueVerificationCard({ verification }: { verification: IndividualIssueVerification }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {verification.isFixed ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <div className="text-left">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {verification.isFixed ? 'Fixed' : 'Not Fixed'}
              </span>
              <span className="text-xs text-gray-500">
                {verification.confidence}% confidence
              </span>
            </div>
            <p className="text-xs text-gray-600">Issue ID: {verification.originalIssueId}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-3">
            <div>
              <h5 className="text-xs font-medium text-gray-900 mb-1">Verification Explanation</h5>
              <p className="text-xs text-gray-700">{verification.explanation}</p>
            </div>

            {verification.remainingConcerns?.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-gray-900 mb-1">Remaining Concerns</h5>
                <ul className="space-y-1">
                  {(verification.remainingConcerns || []).map((concern, index) => (
                    <li key={index} className="flex items-start space-x-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-700">{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}