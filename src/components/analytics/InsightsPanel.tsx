import React from 'react';
import { Card, CardContent } from '../ui';
import { Lightbulb, CheckCircle, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import type { InsightData } from '../../lib/analytics';

interface InsightsPanelProps {
  insights: InsightData[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'improvement':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'improvement':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getMetricDisplay = (insight: InsightData) => {
    if (insight.metric === undefined) return null;

    let displayValue = insight.metric.toString();
    let suffix = '';

    if (insight.title.includes('Gas')) {
      displayValue = insight.metric.toLocaleString();
      suffix = ' gas';
    } else if (insight.title.includes('Score') || insight.title.includes('Resolution')) {
      if (insight.metric % 1 !== 0) {
        displayValue = insight.metric.toFixed(1);
      }
      if (insight.title.includes('Resolution')) {
        suffix = '%';
      }
    }

    return (
      <div className="text-right">
        <div className="text-lg font-bold text-gray-900">
          {displayValue}{suffix}
        </div>
        {insight.change !== undefined && (
          <div className={`text-xs ${insight.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {insight.change >= 0 ? '+' : ''}{insight.change.toFixed(1)}
          </div>
        )}
      </div>
    );
  };

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No insights available</p>
          <p className="text-sm text-gray-400 mt-2">
            Complete more audits to get personalized insights and recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Insights & Recommendations</h3>
        </div>

        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      {insight.description}
                    </p>
                    {insight.recommendation && (
                      <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs text-gray-600">
                        <span className="font-medium">Recommendation:</span> {insight.recommendation}
                      </div>
                    )}
                  </div>
                </div>
                {getMetricDisplay(insight)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-white bg-opacity-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-gray-600">
              <span className="font-medium">Pro Tip:</span> Insights are generated based on your audit history and current security trends.
              Regular audits help improve accuracy of recommendations.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}