import React, { useState } from 'react';
import { Card, CardContent } from '../ui';
import { ArrowUpDown, TrendingUp, TrendingDown, Calendar, Zap } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import type { ComparisonData } from '../../lib/analytics';

interface ComparisonTableProps {
  comparisons: ComparisonData[];
}

type SortKey = 'contractName' | 'score' | 'issues' | 'gasSavings' | 'date' | 'improvement';
type SortDirection = 'asc' | 'desc';

export function ComparisonTable({ comparisons }: ComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedComparisons = [...comparisons].sort((a, b) => {
    let aValue: any = a[sortKey];
    let bValue: any = b[sortKey];

    if (sortKey === 'date') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-100';
  };

  const getImprovementDisplay = (improvement: number) => {
    if (improvement === 0) return null;

    const Icon = improvement > 0 ? TrendingUp : TrendingDown;
    const color = improvement > 0 ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center space-x-1 ${color}`}>
        <Icon className="w-3 h-3" />
        <span className="text-xs">{Math.abs(improvement).toFixed(1)}</span>
      </div>
    );
  };

  const SortHeader = ({ children, sortKey: key }: { children: React.ReactNode; sortKey: SortKey }) => (
    <button
      onClick={() => handleSort(key)}
      className="flex items-center space-x-1 text-left font-medium text-gray-900 hover:text-gray-700 transition-colors"
    >
      <span>{children}</span>
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  if (comparisons.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No comparison data available</p>
          <p className="text-sm text-gray-400 mt-2">
            Complete audits for multiple contracts to see comparative analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Contract Comparison</h3>
          <div className="text-sm text-gray-500">
            {comparisons.length} contract{comparisons.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2">
                  <SortHeader sortKey="contractName">Contract</SortHeader>
                </th>
                <th className="text-center py-3 px-2">
                  <SortHeader sortKey="score">Score</SortHeader>
                </th>
                <th className="text-center py-3 px-2">
                  <SortHeader sortKey="issues">Issues</SortHeader>
                </th>
                <th className="text-center py-3 px-2">
                  <SortHeader sortKey="gasSavings">Gas Saved</SortHeader>
                </th>
                <th className="text-center py-3 px-2">
                  <SortHeader sortKey="date">Last Audit</SortHeader>
                </th>
                <th className="text-center py-3 px-2">
                  <SortHeader sortKey="improvement">Improvement</SortHeader>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedComparisons.map((comparison, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-2">
                    <div className="font-medium text-gray-900 truncate max-w-xs">
                      {comparison.contractName}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(comparison.score)}`}>
                      {comparison.score}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="font-medium text-gray-900">{comparison.issues}</span>
                      {comparison.issues > 0 && (
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {comparison.gasSavings.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {formatDate(comparison.date).split(',')[0]}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center">
                    {getImprovementDisplay(comparison.improvement) || (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-sm text-gray-500">Highest Score</div>
            <div className="text-lg font-bold text-green-600">
              {Math.max(...comparisons.map(c => c.score))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Lowest Score</div>
            <div className="text-lg font-bold text-red-600">
              {Math.min(...comparisons.map(c => c.score))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Total Gas Saved</div>
            <div className="text-lg font-bold text-purple-600">
              {comparisons.reduce((sum, c) => sum + c.gasSavings, 0).toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Avg Improvement</div>
            <div className="text-lg font-bold text-blue-600">
              {(comparisons.reduce((sum, c) => sum + c.improvement, 0) / comparisons.length).toFixed(1)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}