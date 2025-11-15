import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, Wrench } from 'lucide-react';
import type { FixSubmission } from '../../types';

interface FixStatusBadgeProps {
  submission?: FixSubmission;
  showDetails?: boolean;
  className?: string;
}

export function FixStatusBadge({ submission, showDetails = false, className = '' }: FixStatusBadgeProps) {
  if (!submission) {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 ${className}`}>
        <Wrench className="w-3 h-3 mr-1" />
        Not Fixed
      </span>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          text: 'Verified',
          className: 'bg-green-100 text-green-800',
          description: 'Fix has been verified and approved'
        };
      case 'partial':
        return {
          icon: AlertTriangle,
          text: 'Partial Fix',
          className: 'bg-yellow-100 text-yellow-800',
          description: 'Fix addresses some issues but needs improvement'
        };
      case 'rejected':
        return {
          icon: XCircle,
          text: 'Rejected',
          className: 'bg-red-100 text-red-800',
          description: 'Fix was rejected - issues remain or new problems introduced'
        };
      case 'pending':
        return {
          icon: Clock,
          text: 'Pending',
          className: 'bg-blue-100 text-blue-800',
          description: 'Fix submission is being processed'
        };
      default:
        return {
          icon: Clock,
          text: 'Unknown',
          className: 'bg-gray-100 text-gray-800',
          description: 'Unknown status'
        };
    }
  };

  const config = getStatusConfig(submission.status);
  const IconComponent = config.icon;

  if (showDetails) {
    return (
      <div className={`p-3 rounded-lg border ${className}`}>
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className} mb-2`}>
          <IconComponent className="w-3 h-3 mr-1" />
          {config.text}
          {submission.verificationResult && submission.verificationResult.confidence > 0 && (
            <span className="ml-1">({submission.verificationResult.confidence}%)</span>
          )}
        </div>
        <p className="text-xs text-gray-600">{config.description}</p>
        {submission.verificationResult && (
          <div className="mt-2 space-y-1">
            <div className="text-xs text-gray-700">
              <span className="font-medium">Quality Score:</span> {submission.verificationResult.codeQualityScore}/100
            </div>
            {submission.verificationResult.remainingIssues?.length > 0 && (
              <div className="text-xs text-red-600">
                {submission.verificationResult.remainingIssues?.length || 0} remaining issue(s)
              </div>
            )}
            {submission.verificationResult.newIssuesIntroduced?.length > 0 && (
              <div className="text-xs text-red-600">
                {submission.verificationResult.newIssuesIntroduced?.length || 0} new issue(s) introduced
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}>
      <IconComponent className="w-3 h-3 mr-1" />
      {config.text}
      {submission.verificationResult && submission.verificationResult.confidence > 0 && (
        <span className="ml-1">({submission.verificationResult.confidence}%)</span>
      )}
    </span>
  );
}