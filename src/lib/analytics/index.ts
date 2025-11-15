import { format, parseISO, subDays, isAfter } from 'date-fns';
import type { ContractAudit, SecurityIssue } from '../../types';

export interface AnalyticsMetrics {
  totalAudits: number;
  averageScore: number;
  totalIssuesFound: number;
  totalIssuesFixed: number;
  scoreImprovement: number;
  totalGasSaved: number;
  auditFrequency: number;
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface TrendData {
  date: string;
  score: number;
  issues: number;
  gasSavings: number;
}

export interface IssuePattern {
  type: string;
  count: number;
  severity: string;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface InsightData {
  type: 'improvement' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  recommendation?: string;
  metric?: number;
  change?: number;
}

export interface ComparisonData {
  contractName: string;
  score: number;
  issues: number;
  gasSavings: number;
  date: string;
  improvement: number;
}

export class AnalyticsEngine {

  /**
   * Calculate comprehensive analytics metrics
   */
  public static calculateMetrics(audits: ContractAudit[]): AnalyticsMetrics {
    if (audits.length === 0) {
      return {
        totalAudits: 0,
        averageScore: 0,
        totalIssuesFound: 0,
        totalIssuesFixed: 0,
        scoreImprovement: 0,
        totalGasSaved: 0,
        auditFrequency: 0,
        riskDistribution: { high: 0, medium: 0, low: 0 }
      };
    }

    const sortedAudits = [...audits].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const totalAudits = audits.length;
    const averageScore = audits.reduce((sum, audit) => sum + audit.score, 0) / totalAudits;
    const totalIssuesFound = audits.reduce((sum, audit) => sum + audit.totalIssues, 0);
    const totalIssuesFixed = audits.reduce((sum, audit) =>
      sum + audit.issues.filter(issue => issue.fixed).length, 0
    );

    // Calculate score improvement (first vs last audit)
    const scoreImprovement = totalAudits > 1
      ? sortedAudits[sortedAudits.length - 1].score - sortedAudits[0].score
      : 0;

    const totalGasSaved = audits.reduce((sum, audit) =>
      sum + audit.gasOptimizations.reduce((gasSum, opt) => gasSum + opt.gasSavings, 0), 0
    );

    // Calculate audit frequency (audits per week in last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentAudits = audits.filter(audit =>
      isAfter(parseISO(audit.timestamp), thirtyDaysAgo)
    );
    const auditFrequency = (recentAudits.length / 30) * 7; // per week

    // Risk distribution
    const riskDistribution = {
      high: audits.reduce((sum, audit) => sum + audit.highSeverityCount, 0),
      medium: audits.reduce((sum, audit) => sum + audit.mediumSeverityCount, 0),
      low: audits.reduce((sum, audit) => sum + audit.lowSeverityCount, 0)
    };

    return {
      totalAudits,
      averageScore: Math.round(averageScore * 10) / 10,
      totalIssuesFound,
      totalIssuesFixed,
      scoreImprovement: Math.round(scoreImprovement * 10) / 10,
      totalGasSaved,
      auditFrequency: Math.round(auditFrequency * 10) / 10,
      riskDistribution
    };
  }

  /**
   * Generate trend data for charts
   */
  public static generateTrendData(audits: ContractAudit[]): TrendData[] {
    if (audits.length === 0) return [];

    const sortedAudits = [...audits].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return sortedAudits.map(audit => ({
      date: format(parseISO(audit.timestamp), 'MMM dd'),
      score: audit.score,
      issues: audit.totalIssues,
      gasSavings: audit.gasOptimizations.reduce((sum, opt) => sum + opt.gasSavings, 0)
    }));
  }

  /**
   * Analyze issue patterns and trends
   */
  public static analyzeIssuePatterns(audits: ContractAudit[]): IssuePattern[] {
    if (audits.length === 0) return [];

    const allIssues = audits.flatMap(audit => audit.issues);
    const issueTypeMap = new Map<string, { count: number; severity: string; recent: number; older: number }>();

    // Count issues by type and track trends
    allIssues.forEach(issue => {
      const key = issue.type;
      const isRecent = isAfter(
        parseISO(audits.find(a => a.issues.includes(issue))?.timestamp || ''),
        subDays(new Date(), 30)
      );

      if (!issueTypeMap.has(key)) {
        issueTypeMap.set(key, { count: 0, severity: issue.severity, recent: 0, older: 0 });
      }

      const current = issueTypeMap.get(key)!;
      current.count++;
      if (isRecent) current.recent++;
      else current.older++;
    });

    const totalIssues = allIssues.length;

    return Array.from(issueTypeMap.entries())
      .map(([type, data]) => {
        const percentage = (data.count / totalIssues) * 100;

        // Determine trend
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (data.recent > data.older) trend = 'increasing';
        else if (data.recent < data.older) trend = 'decreasing';

        return {
          type,
          count: data.count,
          severity: data.severity,
          percentage: Math.round(percentage * 10) / 10,
          trend
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Generate insights and recommendations
   */
  public static generateInsights(audits: ContractAudit[]): InsightData[] {
    if (audits.length === 0) return [];

    const insights: InsightData[] = [];
    const metrics = this.calculateMetrics(audits);
    const patterns = this.analyzeIssuePatterns(audits);

    // Score improvement insight
    if (metrics.scoreImprovement > 0) {
      insights.push({
        type: 'success',
        title: 'Security Score Improvement',
        description: `Your security scores have improved by ${metrics.scoreImprovement} points on average.`,
        recommendation: 'Keep up the excellent work! Continue following best practices.',
        metric: metrics.scoreImprovement,
        change: metrics.scoreImprovement
      });
    } else if (metrics.scoreImprovement < -5) {
      insights.push({
        type: 'warning',
        title: 'Declining Security Scores',
        description: `Recent audits show a decline in security scores.`,
        recommendation: 'Review recent contracts for new vulnerability patterns and consider additional security training.',
        metric: Math.abs(metrics.scoreImprovement),
        change: metrics.scoreImprovement
      });
    }

    // Issue fix rate insight
    const fixRate = metrics.totalIssuesFound > 0
      ? (metrics.totalIssuesFixed / metrics.totalIssuesFound) * 100
      : 0;

    if (fixRate > 80) {
      insights.push({
        type: 'success',
        title: 'Excellent Issue Resolution',
        description: `You've fixed ${fixRate.toFixed(1)}% of discovered issues.`,
        recommendation: 'Maintain this excellent remediation rate.',
        metric: fixRate
      });
    } else if (fixRate < 50) {
      insights.push({
        type: 'warning',
        title: 'Low Issue Resolution Rate',
        description: `Only ${fixRate.toFixed(1)}% of issues have been marked as fixed.`,
        recommendation: 'Focus on addressing high and medium severity issues first.',
        metric: fixRate
      });
    }

    // Most common vulnerability
    if (patterns.length > 0) {
      const mostCommon = patterns[0];
      if (mostCommon.trend === 'increasing') {
        insights.push({
          type: 'warning',
          title: `Increasing ${mostCommon.type} Issues`,
          description: `${mostCommon.type} issues are trending upward (${mostCommon.count} occurrences).`,
          recommendation: 'Consider implementing automated checks for this vulnerability pattern.',
          metric: mostCommon.count
        });
      }
    }

    // Gas optimization insight
    if (metrics.totalGasSaved > 10000) {
      insights.push({
        type: 'success',
        title: 'Significant Gas Savings',
        description: `Your optimizations have saved approximately ${metrics.totalGasSaved.toLocaleString()} gas units.`,
        recommendation: 'Document these optimization patterns for future reference.',
        metric: metrics.totalGasSaved
      });
    }

    // Audit frequency insight
    if (metrics.auditFrequency < 1) {
      insights.push({
        type: 'info',
        title: 'Consider More Frequent Audits',
        description: 'Regular audits help maintain security posture.',
        recommendation: 'Aim for at least one audit per week for active projects.',
        metric: metrics.auditFrequency
      });
    }

    // High severity issues
    if (metrics.riskDistribution.high > metrics.riskDistribution.medium + metrics.riskDistribution.low) {
      insights.push({
        type: 'warning',
        title: 'High Number of Critical Issues',
        description: `${metrics.riskDistribution.high} high-severity issues detected.`,
        recommendation: 'Prioritize fixing critical security vulnerabilities immediately.',
        metric: metrics.riskDistribution.high
      });
    }

    return insights.slice(0, 6); // Limit to 6 most important insights
  }

  /**
   * Generate comparison data for multiple contracts
   */
  public static generateComparisonData(audits: ContractAudit[]): ComparisonData[] {
    if (audits.length === 0) return [];

    // Group audits by contract name and get the latest for each
    const contractMap = new Map<string, ContractAudit>();

    audits.forEach(audit => {
      const existing = contractMap.get(audit.metadata.contractName || 'Unknown');
      if (!existing || new Date(audit.timestamp) > new Date(existing.timestamp)) {
        contractMap.set(audit.metadata.contractName || 'Unknown', audit);
      }
    });

    // Calculate improvement for each contract (compared to their first audit)
    const firstAudits = new Map<string, ContractAudit>();
    audits
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach(audit => {
        const contractName = audit.metadata.contractName || 'Unknown';
        if (!firstAudits.has(contractName)) {
          firstAudits.set(contractName, audit);
        }
      });

    return Array.from(contractMap.entries()).map(([contractName, latestAudit]) => {
      const firstAudit = firstAudits.get(contractName);
      const improvement = firstAudit ? latestAudit.score - firstAudit.score : 0;

      return {
        contractName,
        score: latestAudit.score,
        issues: latestAudit.totalIssues,
        gasSavings: latestAudit.gasOptimizations.reduce((sum, opt) => sum + opt.gasSavings, 0),
        date: latestAudit.timestamp,
        improvement: Math.round(improvement * 10) / 10
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate security score distribution
   */
  public static getScoreDistribution(audits: ContractAudit[]): { range: string; count: number; percentage: number }[] {
    if (audits.length === 0) return [];

    const ranges = [
      { min: 90, max: 100, label: '90-100 (Excellent)' },
      { min: 80, max: 89, label: '80-89 (Good)' },
      { min: 70, max: 79, label: '70-79 (Fair)' },
      { min: 60, max: 69, label: '60-69 (Poor)' },
      { min: 0, max: 59, label: '0-59 (Critical)' }
    ];

    return ranges.map(range => {
      const count = audits.filter(audit =>
        audit.score >= range.min && audit.score <= range.max
      ).length;

      return {
        range: range.label,
        count,
        percentage: Math.round((count / audits.length) * 100)
      };
    }).filter(item => item.count > 0);
  }

  /**
   * Get function complexity analysis
   */
  public static getFunctionComplexityAnalysis(audits: ContractAudit[]): { complexity: number; count: number }[] {
    const complexityData = new Map<number, number>();

    audits.forEach(audit => {
      const complexity = Math.round(audit.metadata.complexity);
      complexityData.set(complexity, (complexityData.get(complexity) || 0) + 1);
    });

    return Array.from(complexityData.entries())
      .map(([complexity, count]) => ({ complexity, count }))
      .sort((a, b) => a.complexity - b.complexity);
  }
}