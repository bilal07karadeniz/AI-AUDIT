import React from 'react';
import { ShieldCheckIcon, ShieldExclamationIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ProgressRing, Card, CardContent, Badge } from '../ui';
import { cn, getScoreColor } from '../../lib/utils';
import type { ContractAudit } from '../../types';

interface SecurityScoreProps {
  audit: ContractAudit;
  className?: string;
}

export function SecurityScore({ audit, className }: SecurityScoreProps) {
  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', icon: ShieldCheckIcon };
    if (score >= 60) return { label: 'Good', color: 'text-yellow-600', icon: ShieldExclamationIcon };
    return { label: 'Needs Attention', color: 'text-red-600', icon: ExclamationTriangleIcon };
  };

  const status = getScoreStatus(audit.score);
  const Icon = status.icon;

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Icon className={cn('h-6 w-6', status.color)} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Security Score</h3>
              <p className={cn('text-sm font-medium', status.color)}>{status.label}</p>
            </div>
          </div>
          <ProgressRing value={audit.score} size="lg" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{audit.totalIssues}</div>
            <div className="text-sm text-gray-500">Total Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{audit.metadata.linesOfCode}</div>
            <div className="text-sm text-gray-500">Lines of Code</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">High Severity</span>
            <div className="flex items-center space-x-2">
              <Badge severity="HIGH">{audit.highSeverityCount}</Badge>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${audit.totalIssues > 0 ? (audit.highSeverityCount / audit.totalIssues) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Medium Severity</span>
            <div className="flex items-center space-x-2">
              <Badge severity="MEDIUM">{audit.mediumSeverityCount}</Badge>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{
                    width: `${audit.totalIssues > 0 ? (audit.mediumSeverityCount / audit.totalIssues) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Low Severity</span>
            <div className="flex items-center space-x-2">
              <Badge severity="LOW">{audit.lowSeverityCount}</Badge>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${audit.totalIssues > 0 ? (audit.lowSeverityCount / audit.totalIssues) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Analysis Time</span>
            <span>{(audit.analysisTime / 1000).toFixed(1)}s</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
            <span>Complexity Score</span>
            <span>{Math.round(audit.metadata.complexity)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}