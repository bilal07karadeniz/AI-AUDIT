import React from 'react';
import { Card, CardContent } from '../ui';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldX, Info } from 'lucide-react';
import type { IssuePattern } from '../../lib/analytics';

interface IssuePatternsProps {
  patterns: IssuePattern[];
}

export function IssuePatterns({ patterns }: IssuePatternsProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <ShieldX className="w-4 h-4 text-red-500" />;
      case 'MEDIUM':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-600 bg-red-50';
      case 'decreasing':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (patterns.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No issue patterns available</p>
          <p className="text-sm text-gray-400 mt-2">Complete more audits to see vulnerability trends</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Vulnerability Patterns & Trends</h3>

          <div className="space-y-4">
            {patterns.map((pattern, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getSeverityColor(pattern.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {getSeverityIcon(pattern.severity)}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{pattern.type}</h4>
                      <p className="text-sm text-gray-600">
                        {pattern.count} occurrence{pattern.count !== 1 ? 's' : ''}
                        <span className="text-gray-400 ml-1">
                          ({pattern.percentage}% of all issues)
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getTrendColor(pattern.trend)}`}>
                      {getTrendIcon(pattern.trend)}
                      <span className="capitalize">{pattern.trend}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      pattern.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                      pattern.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {pattern.severity}
                    </span>
                  </div>
                </div>

                {/* Progress bar showing percentage */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Issue frequency</span>
                    <span>{pattern.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        pattern.severity === 'HIGH' ? 'bg-red-500' :
                        pattern.severity === 'MEDIUM' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(pattern.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {patterns.length > 5 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Top {Math.min(patterns.length, 10)} vulnerability patterns shown.</span>
                {patterns.length > 10 && ` ${patterns.length - 10} more patterns available in detailed reports.`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {patterns.filter(p => p.severity === 'HIGH').length}
              </div>
              <div className="text-sm text-gray-600">High-Risk Patterns</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {patterns.filter(p => p.trend === 'increasing').length}
              </div>
              <div className="text-sm text-gray-600">Increasing Trends</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {patterns.filter(p => p.trend === 'decreasing').length}
              </div>
              <div className="text-sm text-gray-600">Decreasing Trends</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}