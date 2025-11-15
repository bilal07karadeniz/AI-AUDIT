import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '../ui';
import {
  TrendingUp, TrendingDown, ShieldCheck, AlertTriangle, Wrench, BarChart3,
  Target, Clock, Zap, Award, Activity, ChevronUp, ChevronDown, Info
} from 'lucide-react';
import type { AnalyticsMetrics } from '../../lib/analytics';
import { cn } from '../../lib/utils';

interface MetricsCardsProps {
  metrics: AnalyticsMetrics;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'value' | 'trend' | 'impact'>('value');

  // Calculate additional derived metrics
  const derivedMetrics = useMemo(() => {
    const fixRate = metrics.totalIssuesFound > 0 ? (metrics.totalIssuesFixed / metrics.totalIssuesFound) * 100 : 0;
    const avgGasPerAudit = metrics.totalAudits > 0 ? metrics.totalGasSaved / metrics.totalAudits : 0;
    const securityTrend = metrics.scoreImprovement;
    const auditEfficiency = metrics.auditFrequency;

    return {
      fixRate,
      avgGasPerAudit,
      securityTrend,
      auditEfficiency,
      riskLevel: metrics.averageScore >= 80 ? 'Low' : metrics.averageScore >= 60 ? 'Medium' : 'High',
      performanceGrade: metrics.averageScore >= 90 ? 'A+' : metrics.averageScore >= 80 ? 'A' :
                       metrics.averageScore >= 70 ? 'B' : metrics.averageScore >= 60 ? 'C' : 'D'
    };
  }, [metrics]);

  const cards = [
    {
      id: 'audits',
      title: 'Total Audits',
      value: metrics.totalAudits,
      icon: ShieldCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Contracts audited',
      trend: metrics.totalAudits > 0 ? '+100%' : '0%',
      details: {
        'This Week': Math.round(derivedMetrics.auditEfficiency),
        'Success Rate': '100%',
        'Avg Duration': '2.5 min'
      },
      impact: 'high'
    },
    {
      id: 'score',
      title: 'Security Score',
      value: `${metrics.averageScore}/100`,
      secondaryValue: derivedMetrics.performanceGrade,
      icon: Award,
      color: metrics.averageScore >= 80 ? 'text-green-600' : metrics.averageScore >= 60 ? 'text-yellow-600' : 'text-red-600',
      bgColor: metrics.averageScore >= 80 ? 'bg-green-50' : metrics.averageScore >= 60 ? 'bg-yellow-50' : 'bg-red-50',
      borderColor: metrics.averageScore >= 80 ? 'border-green-200' : metrics.averageScore >= 60 ? 'border-yellow-200' : 'border-red-200',
      description: `${derivedMetrics.riskLevel} risk level`,
      trend: metrics.scoreImprovement >= 0 ? `+${metrics.scoreImprovement}` : `${metrics.scoreImprovement}`,
      details: {
        'Risk Level': derivedMetrics.riskLevel,
        'Performance': derivedMetrics.performanceGrade,
        'Trend': metrics.scoreImprovement >= 0 ? 'Improving' : 'Declining'
      },
      impact: metrics.averageScore >= 80 ? 'low' : metrics.averageScore >= 60 ? 'medium' : 'high'
    },
    {
      id: 'issues',
      title: 'Security Issues',
      value: metrics.totalIssuesFound,
      secondaryValue: `${metrics.totalIssuesFixed} fixed`,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      description: `${derivedMetrics.fixRate.toFixed(1)}% resolution rate`,
      trend: `${derivedMetrics.fixRate.toFixed(1)}%`,
      details: {
        'Total Found': metrics.totalIssuesFound,
        'Fixed': metrics.totalIssuesFixed,
        'Resolution Rate': `${derivedMetrics.fixRate.toFixed(1)}%`
      },
      impact: derivedMetrics.fixRate >= 80 ? 'low' : derivedMetrics.fixRate >= 50 ? 'medium' : 'high'
    },
    {
      id: 'gas',
      title: 'Gas Optimized',
      value: metrics.totalGasSaved.toLocaleString(),
      secondaryValue: `${derivedMetrics.avgGasPerAudit.toLocaleString()} avg`,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Total gas savings',
      trend: '+100%',
      details: {
        'Total Saved': metrics.totalGasSaved.toLocaleString(),
        'Per Audit': derivedMetrics.avgGasPerAudit.toLocaleString(),
        'Cost Saved': `$${(metrics.totalGasSaved * 0.00001).toFixed(2)}`
      },
      impact: 'medium'
    },
    {
      id: 'improvement',
      title: 'Score Trend',
      value: `${metrics.scoreImprovement >= 0 ? '+' : ''}${metrics.scoreImprovement}`,
      secondaryValue: derivedMetrics.securityTrend >= 0 ? 'Improving' : 'Declining',
      icon: metrics.scoreImprovement >= 0 ? TrendingUp : TrendingDown,
      color: metrics.scoreImprovement >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.scoreImprovement >= 0 ? 'bg-green-50' : 'bg-red-50',
      borderColor: metrics.scoreImprovement >= 0 ? 'border-green-200' : 'border-red-200',
      description: 'Security trajectory',
      trend: `${Math.abs(metrics.scoreImprovement)}pts`,
      details: {
        'Direction': metrics.scoreImprovement >= 0 ? 'Upward' : 'Downward',
        'Change': `${metrics.scoreImprovement} points`,
        'Status': metrics.scoreImprovement >= 5 ? 'Excellent' : metrics.scoreImprovement >= 0 ? 'Good' : 'Needs Attention'
      },
      impact: Math.abs(metrics.scoreImprovement) >= 5 ? 'high' : 'medium'
    },
    {
      id: 'frequency',
      title: 'Audit Activity',
      value: metrics.auditFrequency.toFixed(1),
      secondaryValue: 'per week',
      icon: Activity,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      description: 'Weekly frequency',
      trend: metrics.auditFrequency >= 2 ? 'High' : metrics.auditFrequency >= 1 ? 'Medium' : 'Low',
      details: {
        'Weekly Rate': metrics.auditFrequency.toFixed(1),
        'Total Days': Math.round(metrics.totalAudits / (metrics.auditFrequency / 7)),
        'Activity Level': metrics.auditFrequency >= 2 ? 'High' : 'Moderate'
      },
      impact: 'low'
    }
  ];

  // Sort cards based on selected criteria
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => {
      switch (sortBy) {
        case 'trend':
          return parseFloat(b.trend) - parseFloat(a.trend);
        case 'impact':
          const impactOrder = { high: 3, medium: 2, low: 1 };
          return impactOrder[b.impact] - impactOrder[a.impact];
        default:
          return parseFloat(String(b.value)) - parseFloat(String(a.value));
      }
    });
  }, [cards, sortBy]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="value">Value</option>
            <option value="trend">Trend</option>
            <option value="impact">Impact</option>
          </select>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Info className="w-3 h-3" />
          <span>Click cards for details</span>
        </div>
      </div>

      {/* Enhanced Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedCards.map((card, index) => {
          const IconComponent = card.icon;
          const isExpanded = expandedCard === index;
          return (
            <Card
              key={card.id}
              className={cn(
                "hover:shadow-lg transition-all duration-200 cursor-pointer border-2",
                card.borderColor,
                isExpanded && "ring-2 ring-brand-200 shadow-xl"
              )}
              onClick={() => setExpandedCard(isExpanded ? null : index)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        getImpactColor(card.impact)
                      )}>
                        {card.impact}
                      </span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      {card.secondaryValue && (
                        <p className="text-sm text-gray-500">{card.secondaryValue}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">{card.description}</p>
                      <div className="flex items-center space-x-1">
                        {card.trend && (
                          <span className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded",
                            card.trend.includes('+') || card.trend.includes('High') || card.trend.includes('Improving')
                              ? "text-green-700 bg-green-100"
                              : card.trend.includes('-') || card.trend.includes('Declining')
                              ? "text-red-700 bg-red-100"
                              : "text-blue-700 bg-blue-100"
                          )}>
                            {card.trend}
                          </span>
                        )}
                        {isExpanded ?
                          <ChevronUp className="w-4 h-4 text-gray-400" /> :
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        }
                      </div>
                    </div>
                  </div>
                  <div className={cn("p-3 rounded-lg ml-4", card.bgColor)}>
                    <IconComponent className={cn("w-6 h-6", card.color)} />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Detailed Metrics</h4>
                    <div className="space-y-2">
                      {Object.entries(card.details).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Target className="w-3 h-3" />
                        <span>
                          {card.impact === 'high' ? 'Requires immediate attention' :
                           card.impact === 'medium' ? 'Monitor regularly' :
                           'Stable metric'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}