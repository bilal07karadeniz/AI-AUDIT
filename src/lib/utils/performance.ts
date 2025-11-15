/**
 * Performance Monitoring Utility
 * Track execution times, memory usage, and performance metrics
 */

import { logger } from './logger';

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  context?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  totalMeasurements: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  lastDuration: number;
  slowest: PerformanceMetric[];
  fastest: PerformanceMetric[];
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private activeTimers: Map<string, number> = new Map();
  private readonly MAX_METRICS_PER_NAME = 100;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start measuring performance
   */
  start(name: string, context?: string, metadata?: Record<string, any>): void {
    const startTime = performance.now();
    this.activeTimers.set(name, startTime);

    logger.debug(`Performance: Started measuring ${name}`, 'Performance', { context, metadata });
  }

  /**
   * End measurement and record result
   */
  end(name: string, context?: string, metadata?: Record<string, any>): number | null {
    const startTime = this.activeTimers.get(name);

    if (!startTime) {
      logger.warn(`Performance: No start time found for ${name}`, 'Performance');
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetric = {
      name,
      startTime,
      endTime,
      duration,
      context,
      metadata
    };

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricsArray = this.metrics.get(name)!;
    metricsArray.push(metric);

    // Keep only recent metrics
    if (metricsArray.length > this.MAX_METRICS_PER_NAME) {
      metricsArray.shift();
    }

    // Clean up timer
    this.activeTimers.delete(name);

    logger.debug(
      `Performance: Completed ${name} in ${duration.toFixed(2)}ms`,
      'Performance',
      { duration, context, metadata }
    );

    return duration;
  }

  /**
   * Measure async function execution
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    context?: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name, context, metadata);
    try {
      const result = await fn();
      this.end(name, context, metadata);
      return result;
    } catch (error) {
      this.end(name, context, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Measure sync function execution
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    context?: string,
    metadata?: Record<string, any>
  ): T {
    this.start(name, context, metadata);
    try {
      const result = fn();
      this.end(name, context, metadata);
      return result;
    } catch (error) {
      this.end(name, context, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Get statistics for a metric
   */
  getStats(name: string): PerformanceStats | null {
    const metrics = this.metrics.get(name);

    if (!metrics || metrics.length === 0) {
      return null;
    }

    const durations = metrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!);

    if (durations.length === 0) {
      return null;
    }

    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const lastDuration = durations[durations.length - 1];

    // Get slowest and fastest
    const sorted = [...metrics]
      .filter(m => m.duration !== undefined)
      .sort((a, b) => b.duration! - a.duration!);

    const slowest = sorted.slice(0, 5);
    const fastest = sorted.slice(-5).reverse();

    return {
      totalMeasurements: metrics.length,
      averageDuration,
      minDuration,
      maxDuration,
      lastDuration,
      slowest,
      fastest
    };
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, PerformanceMetric[]> {
    const result: Record<string, PerformanceMetric[]> = {};
    this.metrics.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Clear specific metric
   */
  clearMetric(name: string): void {
    this.metrics.delete(name);
    this.activeTimers.delete(name);
  }

  /**
   * Clear all metrics
   */
  clearAll(): void {
    this.metrics.clear();
    this.activeTimers.clear();
  }

  /**
   * Get summary report
   */
  getSummary(): string {
    const names = this.getMetricNames();
    const lines: string[] = ['Performance Summary', '='.repeat(50)];

    names.forEach(name => {
      const stats = this.getStats(name);
      if (stats) {
        lines.push(`\n${name}:`);
        lines.push(`  Count: ${stats.totalMeasurements}`);
        lines.push(`  Average: ${stats.averageDuration.toFixed(2)}ms`);
        lines.push(`  Min: ${stats.minDuration.toFixed(2)}ms`);
        lines.push(`  Max: ${stats.maxDuration.toFixed(2)}ms`);
        lines.push(`  Last: ${stats.lastDuration.toFixed(2)}ms`);
      }
    });

    return lines.join('\n');
  }

  /**
   * Log summary to console
   */
  logSummary(): void {
    console.log(this.getSummary());
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): {
    used: number;
    total: number;
    limit: number;
  } | null {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  /**
   * Mark a point in time
   */
  mark(name: string): void {
    if (performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Measure between two marks
   */
  measureBetween(name: string, startMark: string, endMark: string): number | null {
    try {
      if (performance.measure) {
        performance.measure(name, startMark, endMark);
        const measures = performance.getEntriesByName(name, 'measure');
        if (measures.length > 0) {
          return measures[measures.length - 1].duration;
        }
      }
    } catch (error) {
      logger.warn('Failed to measure between marks', 'Performance', { error });
    }
    return null;
  }
}

// Singleton instance
export const perfMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export const perfStart = (name: string, context?: string, metadata?: Record<string, any>) =>
  perfMonitor.start(name, context, metadata);

export const perfEnd = (name: string, context?: string, metadata?: Record<string, any>) =>
  perfMonitor.end(name, context, metadata);

export const perfMeasure = async <T>(
  name: string,
  fn: () => Promise<T>,
  context?: string,
  metadata?: Record<string, any>
): Promise<T> => perfMonitor.measure(name, fn, context, metadata);

export const perfMeasureSync = <T>(
  name: string,
  fn: () => T,
  context?: string,
  metadata?: Record<string, any>
): T => perfMonitor.measureSync(name, fn, context, metadata);

/**
 * Decorator for measuring method performance
 */
export function measurePerformance(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return perfMonitor.measure(
        metricName,
        () => originalMethod.apply(this, args),
        target.constructor.name
      );
    };

    return descriptor;
  };
}
