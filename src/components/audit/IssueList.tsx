import React, { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, Badge, Button } from '../ui';
import { FixStatusBadge, BulkFixSubmissionModal } from '../fixVerification';
import { cn, getColorForSeverity } from '../../lib/utils';
import { Wrench, Upload } from 'lucide-react';
import type { SecurityIssue, SeverityLevel, FixSubmission, ContractAudit, BulkFixSubmission } from '../../types';

interface IssueListProps {
  issues: SecurityIssue[];
  title?: string;
  onIssueClick?: (issue: SecurityIssue) => void;
  originalCode?: string;
  showFixVerification?: boolean;
  originalAudit?: ContractAudit;
  onFixSubmit?: (fixedCode: string, notes?: string) => Promise<BulkFixSubmission>;
}

export function IssueList({
  issues,
  title = 'Security Issues',
  onIssueClick,
  originalCode = '',
  showFixVerification = false,
  originalAudit,
  onFixSubmit
}: IssueListProps) {
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | 'ALL'>('ALL');
  const [showFixModal, setShowFixModal] = useState(false);

  const toggleIssue = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  const filteredIssues = selectedSeverity === 'ALL'
    ? issues
    : issues.filter(issue => issue.severity === selectedSeverity);

  const getSeverityIcon = (severity: SeverityLevel) => {
    switch (severity) {
      case 'HIGH':
        return ExclamationTriangleIcon;
      case 'MEDIUM':
        return InformationCircleIcon;
      case 'LOW':
        return CheckCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const severityFilters: (SeverityLevel | 'ALL')[] = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-4">
            {/* Fix Button */}
            {showFixVerification && originalAudit && onFixSubmit && issues.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowFixModal(true)}
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Submit Fixed Contract</span>
              </Button>
            )}

            {/* Severity Filters */}
            <div className="flex space-x-2">
              {severityFilters.map(severity => (
                <button
                  key={severity}
                  onClick={() => setSelectedSeverity(severity)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
                    selectedSeverity === severity
                      ? 'bg-brand-50 text-brand-700 border-brand-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  {severity === 'ALL' ? 'All' : severity}
                  {severity !== 'ALL' && (
                    <span className="ml-1">
                      ({issues.filter(i => i.severity === severity).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedSeverity === 'ALL'
                ? 'No security issues found'
                : `No ${selectedSeverity.toLowerCase()} severity issues found`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIssues.map((issue) => {
              const isExpanded = expandedIssues.has(issue.id);
              const Icon = getSeverityIcon(issue.severity);

              return (
                <div
                  key={issue.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => {
                      toggleIssue(issue.id);
                      onIssueClick?.(issue);
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={cn('h-5 w-5', getColorForSeverity(issue.severity).split(' ')[0])} />
                      <div className="text-left">
                        <div className="flex items-center space-x-2">
                          <Badge severity={issue.severity}>{issue.severity}</Badge>
                          <span className="text-sm font-medium text-gray-900">
                            {issue.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Line {issue.line} in {issue.function}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                          <p className="text-sm text-gray-700">{issue.description}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Impact</h4>
                          <p className="text-sm text-gray-700">{issue.impact}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendation</h4>
                          <p className="text-sm text-gray-700">{issue.recommendation}</p>
                        </div>

                        {issue.proofOfConcept && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Proof of Concept</h4>
                            <pre className="text-xs bg-gray-100 p-3 rounded border font-mono overflow-x-auto">
                              {issue.proofOfConcept}
                            </pre>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <span className="text-xs text-gray-500">
                            Reference: {issue.cweReference}
                          </span>
                          <div className="flex items-center space-x-2">
                            {issue.fixed && (
                              <Badge variant="success">Fixed</Badge>
                            )}
                            {showFixVerification && (
                              <FixStatusBadge submission={issue.fixSubmission} />
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Fix Submission Modal */}
        {showFixModal && originalAudit && onFixSubmit && (
          <BulkFixSubmissionModal
            isOpen={showFixModal}
            onClose={() => setShowFixModal(false)}
            originalAudit={originalAudit}
            originalCode={originalCode}
            onSubmit={async (fixedCode, notes) => {
              const result = await onFixSubmit(fixedCode, notes);
              setShowFixModal(false);
              return result;
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}