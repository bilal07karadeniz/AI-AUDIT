import React, { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  BoltIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, Badge } from '../ui';
import { cn, formatNumber } from '../../lib/utils';
import type { GasOptimization } from '../../types';

interface GasOptimizationsProps {
  optimizations: GasOptimization[];
  title?: string;
}

export function GasOptimizations({ optimizations, title = 'Gas Optimizations' }: GasOptimizationsProps) {
  const [expandedOptimizations, setExpandedOptimizations] = useState<Set<string>>(new Set());

  const toggleOptimization = (optimizationId: string) => {
    const newExpanded = new Set(expandedOptimizations);
    if (newExpanded.has(optimizationId)) {
      newExpanded.delete(optimizationId);
    } else {
      newExpanded.add(optimizationId);
    }
    setExpandedOptimizations(newExpanded);
  };

  const totalGasSavings = optimizations.reduce((total, opt) => total + opt.gasSavings, 0);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BoltIcon className="h-6 w-6 text-yellow-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">
                {optimizations.length} optimizations • {formatNumber(totalGasSavings)} gas savings
              </p>
            </div>
          </div>
          <Badge variant="warning">
            {formatNumber(totalGasSavings)} gas
          </Badge>
        </div>

        {optimizations.length === 0 ? (
          <div className="text-center py-8">
            <BoltIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No gas optimizations identified</p>
          </div>
        ) : (
          <div className="space-y-3">
            {optimizations.map((optimization) => {
              const isExpanded = expandedOptimizations.has(optimization.id);

              return (
                <div
                  key={optimization.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleOptimization(optimization.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <BoltIcon className="h-5 w-5 text-yellow-600" />
                      <div className="text-left">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {optimization.location}
                          </span>
                          <Badge variant="warning">
                            -{formatNumber(optimization.gasSavings)} gas
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {optimization.description}
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
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Impact</h4>
                          <p className="text-sm text-gray-700">{optimization.impact}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendation</h4>
                          <p className="text-sm text-gray-700">{optimization.recommendation}</p>
                        </div>

                        {optimization.codeExample && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <DocumentTextIcon className="h-4 w-4 mr-1" />
                              Optimized Code Example
                            </h4>
                            <pre className="text-xs bg-gray-100 p-3 rounded border font-mono overflow-x-auto">
                              {optimization.codeExample}
                            </pre>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <span className="text-xs text-gray-500">
                            Estimated savings: {formatNumber(optimization.gasSavings)} gas
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-500 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(100, (optimization.gasSavings / totalGasSavings) * 100)}%`
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {((optimization.gasSavings / totalGasSavings) * 100).toFixed(1)}%
                            </span>
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
      </CardContent>
    </Card>
  );
}