import React from 'react';
import { Card, CardContent, Badge } from '../ui';
import {
  TrendingUp,
  TrendingDown,
  Equal,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Code
} from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import type { ContractVersion } from '../../types';

interface VersionComparisonProps {
  originalVersion: ContractVersion;
  currentVersion: ContractVersion;
  className?: string;
}

export function VersionComparison({
  originalVersion,
  currentVersion,
  className
}: VersionComparisonProps) {
  const originalAudit = originalVersion.audit;
  const currentAudit = currentVersion.audit;

  const scoreChange = currentAudit.score - originalAudit.score;
  const issueChange = originalAudit.totalIssues - currentAudit.totalIssues;
  const highSeverityChange = originalAudit.highSeverityCount - currentAudit.highSeverityCount;
  const mediumSeverityChange = originalAudit.mediumSeverityCount - currentAudit.mediumSeverityCount;
  const lowSeverityChange = originalAudit.lowSeverityCount - currentAudit.lowSeverityCount;

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Equal className="h-4 w-4 text-gray-400" />;
  };

  const getChangeColor = (change: number, isImprovement = true) => {
    if (change === 0) return 'text-gray-600';
    const isPositive = isImprovement ? change > 0 : change < 0;
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  const formatChange = (change: number, showSign = true) => {
    if (change === 0) return '0';
    return showSign ? (change > 0 ? `+${change}` : `${change}`) : Math.abs(change).toString();
  };

  const getFixStatus = (version: ContractVersion) => {
    if (!version.fixSubmission) return null;

    switch (version.fixSubmission.status) {
      case 'verified':
        return { icon: CheckCircle, color: 'text-green-500', label: 'Verified' };
      case 'analyzing':
        return { icon: Clock, color: 'text-blue-500', label: 'Analyzing' };
      case 'partial':
        return { icon: AlertTriangle, color: 'text-yellow-500', label: 'Partial' };
      case 'rejected':
        return { icon: AlertTriangle, color: 'text-red-500', label: 'Issues Remain' };
      default:
        return { icon: Clock, color: 'text-gray-500', label: 'Pending' };
    }
  };

  const originalStatus = getFixStatus(originalVersion);
  const currentStatus = getFixStatus(currentVersion);

  return (
    <Card className={cn('border-l-4', className,
      scoreChange > 0 ? 'border-l-green-500' :
      scoreChange < 0 ? 'border-l-red-500' : 'border-l-gray-300'
    )}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Version Comparison
              </h3>
              <p className="text-sm text-gray-600">
                {originalVersion.version} → {currentVersion.version}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {currentStatus && (
                <div className="flex items-center space-x-1">
                  <currentStatus.icon className={cn('h-4 w-4', currentStatus.color)} />
                  <span className={cn('text-sm font-medium', currentStatus.color)}>
                    {currentStatus.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Score Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {originalAudit.score}
              </div>
              <div className="text-sm text-gray-500">
                {originalVersion.version} Score
              </div>
              <div className="flex items-center justify-center mt-1">
                {originalStatus && (
                  <Badge variant="secondary" size="sm">
                    {originalStatus.label}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {getChangeIcon(scoreChange)}
                  <span className={cn('text-lg font-bold', getChangeColor(scoreChange))}>
                    {formatChange(scoreChange)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Score Change</div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {currentAudit.score}
              </div>
              <div className="text-sm text-gray-500">
                {currentVersion.version} Score
              </div>
              <div className="flex items-center justify-center mt-1">
                {currentStatus && (
                  <Badge
                    variant={currentStatus.color.includes('green') ? 'success' : 'secondary'}
                    size="sm"
                  >
                    {currentStatus.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Issue Changes */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Security Issues Resolved</h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Shield className="h-4 w-4 text-gray-600" />
                  <span className={cn('text-lg font-bold', getChangeColor(issueChange))}>
                    {formatChange(issueChange)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Total Issues</div>
                <div className="text-xs text-gray-400 mt-1">
                  {originalAudit.totalIssues} → {currentAudit.totalIssues}
                </div>
              </div>

              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className={cn('text-lg font-bold', getChangeColor(highSeverityChange))}>
                    {formatChange(highSeverityChange)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">High Severity</div>
                <div className="text-xs text-gray-400 mt-1">
                  {originalAudit.highSeverityCount} → {currentAudit.highSeverityCount}
                </div>
              </div>

              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className={cn('text-lg font-bold', getChangeColor(mediumSeverityChange))}>
                    {formatChange(mediumSeverityChange)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Medium Severity</div>
                <div className="text-xs text-gray-400 mt-1">
                  {originalAudit.mediumSeverityCount} → {currentAudit.mediumSeverityCount}
                </div>
              </div>

              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className={cn('text-lg font-bold', getChangeColor(lowSeverityChange))}>
                    {formatChange(lowSeverityChange)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Low Severity</div>
                <div className="text-xs text-gray-400 mt-1">
                  {originalAudit.lowSeverityCount} → {currentAudit.lowSeverityCount}
                </div>
              </div>
            </div>
          </div>

          {/* Version Details */}
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-3">
                  {originalVersion.version} Details
                </h5>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(originalVersion.submissionDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Code className="h-4 w-4" />
                    <span>{originalAudit.metadata.linesOfCode} lines</span>
                  </div>
                  {originalVersion.submissionNotes && (
                    <p className="text-xs bg-gray-100 p-2 rounded border-l-2 border-gray-300">
                      {originalVersion.submissionNotes}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-3">
                  {currentVersion.version} Details
                </h5>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(currentVersion.submissionDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Code className="h-4 w-4" />
                    <span>{currentAudit.metadata.linesOfCode} lines</span>
                  </div>
                  {currentVersion.submissionNotes && (
                    <p className="text-xs bg-gray-100 p-2 rounded border-l-2 border-gray-300">
                      {currentVersion.submissionNotes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          {(scoreChange !== 0 || issueChange !== 0) && (
            <div className="border-t border-gray-200 pt-6">
              <div className={cn(
                'p-4 rounded-lg',
                scoreChange > 0 || issueChange > 0
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              )}>
                <div className="flex items-start space-x-3">
                  {scoreChange > 0 || issueChange > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <h6 className={cn(
                      'text-sm font-medium',
                      scoreChange > 0 || issueChange > 0 ? 'text-green-800' : 'text-red-800'
                    )}>
                      {scoreChange > 0 || issueChange > 0 ? 'Improvement Detected' : 'Issues Detected'}
                    </h6>
                    <p className={cn(
                      'text-xs mt-1',
                      scoreChange > 0 || issueChange > 0 ? 'text-green-700' : 'text-red-700'
                    )}>
                      {scoreChange > 0 || issueChange > 0
                        ? `Your security score improved by ${scoreChange} points and ${issueChange} issue${issueChange !== 1 ? 's' : ''} ${issueChange === 1 ? 'was' : 'were'} resolved.`
                        : `Your security score decreased by ${Math.abs(scoreChange)} points. Please review the new issues introduced.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}