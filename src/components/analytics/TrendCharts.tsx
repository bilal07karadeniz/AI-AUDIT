import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent } from '../ui';
import type { TrendData, AnalyticsMetrics } from '../../lib/analytics';

interface TrendChartsProps {
  trendData: TrendData[];
  metrics: AnalyticsMetrics;
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#f97316'];

export function TrendCharts({ trendData, metrics }: TrendChartsProps) {
  // Risk distribution data for pie chart
  const riskData = [
    { name: 'High Risk', value: metrics.riskDistribution.high, color: '#ef4444' },
    { name: 'Medium Risk', value: metrics.riskDistribution.medium, color: '#f59e0b' },
    { name: 'Low Risk', value: metrics.riskDistribution.low, color: '#10b981' }
  ].filter(item => item.value > 0);

  // Score distribution data for bar chart
  const scoreRanges = [
    { range: '90-100', count: 0 },
    { range: '80-89', count: 0 },
    { range: '70-79', count: 0 },
    { range: '60-69', count: 0 },
    { range: '0-59', count: 0 }
  ];

  // This would normally come from the analytics engine, but for demo purposes:
  if (trendData.length > 0) {
    trendData.forEach(item => {
      if (item.score >= 90) scoreRanges[0].count++;
      else if (item.score >= 80) scoreRanges[1].count++;
      else if (item.score >= 70) scoreRanges[2].count++;
      else if (item.score >= 60) scoreRanges[3].count++;
      else scoreRanges[4].count++;
    });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'gasSavings' && ' gas'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Security Score Trend */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Score Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Security Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues and Gas Savings */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues Found & Gas Savings</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="issues" fill="#f59e0b" name="Issues Found" />
                  <Bar dataKey="gasSavings" fill="#10b981" name="Gas Saved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
            <div className="h-64">
              {riskData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No risk data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreRanges.filter(item => item.count > 0)}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="range"
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: any) => [value, 'Contracts']}
                  labelFormatter={(label: string) => `Score Range: ${label}`}
                />
                <Bar
                  dataKey="count"
                  name="Number of Contracts"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}