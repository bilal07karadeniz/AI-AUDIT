/**
 * Logger Utility
 * Centralized logging system with levels, formatting, and export capabilities
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: any;
  error?: Error;
  stack?: string;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;
  private readonly STORAGE_KEY = 'app_logs';
  private enabled: boolean = true;
  private minLevel: LogLevel = LogLevel.INFO;

  private constructor() {
    this.loadLogs();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Get level priority
   */
  private getLevelPriority(level: LogLevel): number {
    const priorities = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3,
      [LogLevel.CRITICAL]: 4
    };
    return priorities[level];
  }

  /**
   * Check if level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    return this.getLevelPriority(level) >= this.getLevelPriority(this.minLevel);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
      error,
      stack: error?.stack
    };

    this.logs.push(entry);

    // Keep logs under limit
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Console output with formatting
    this.consoleOutput(entry);

    // Save to storage periodically
    if (this.logs.length % 10 === 0) {
      this.saveLogs();
    }
  }

  /**
   * Format and output to console
   */
  private consoleOutput(entry: LogEntry): void {
    const prefix = `[${entry.level}] ${entry.timestamp}`;
    const contextStr = entry.context ? ` [${entry.context}]` : '';
    const fullMessage = `${prefix}${contextStr} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(fullMessage, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(fullMessage, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(fullMessage, entry.data || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(fullMessage, entry.error || entry.data || '');
        if (entry.stack) {
          console.error('Stack:', entry.stack);
        }
        break;
    }
  }

  /**
   * Public logging methods
   */
  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, error?: Error, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  critical(message: string, error?: Error, context?: string, data?: any): void {
    this.log(LogLevel.CRITICAL, message, context, data, error);
  }

  /**
   * Get all logs
   */
  getLogs(filter?: {
    level?: LogLevel;
    context?: string;
    startTime?: string;
    endTime?: string;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (filter) {
      if (filter.level) {
        filtered = filtered.filter(log => log.level === filter.level);
      }
      if (filter.context) {
        filtered = filtered.filter(log => log.context === filter.context);
      }
      if (filter.startTime) {
        filtered = filtered.filter(log => log.timestamp >= filter.startTime!);
      }
      if (filter.endTime) {
        filtered = filtered.filter(log => log.timestamp <= filter.endTime!);
      }
    }

    return filtered;
  }

  /**
   * Get log statistics
   */
  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byContext: Record<string, number>;
    recentErrors: number;
  } {
    const byLevel = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.CRITICAL]: 0
    };

    const byContext: Record<string, number> = {};

    this.logs.forEach(log => {
      byLevel[log.level]++;
      if (log.context) {
        byContext[log.context] = (byContext[log.context] || 0) + 1;
      }
    });

    // Count errors in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const recentErrors = this.logs.filter(log =>
      (log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL) &&
      log.timestamp >= fiveMinutesAgo
    ).length;

    return {
      total: this.logs.length,
      byLevel,
      byContext,
      recentErrors
    };
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
    this.saveLogs();
  }

  /**
   * Export logs as JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  exportCSV(): string {
    const headers = ['Timestamp', 'Level', 'Context', 'Message', 'Data'];
    const rows = this.logs.map(log => [
      log.timestamp,
      log.level,
      log.context || '',
      log.message,
      log.data ? JSON.stringify(log.data) : ''
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  /**
   * Download logs as file
   */
  download(format: 'json' | 'csv' = 'json'): void {
    const content = format === 'json' ? this.exportJSON() : this.exportCSV();
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Save logs to localStorage
   */
  private saveLogs(): void {
    try {
      // Only save recent logs to avoid quota issues
      const recentLogs = this.logs.slice(-100);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  private loadLogs(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.logs = parsed.filter(log =>
            log &&
            typeof log === 'object' &&
            log.level &&
            log.message &&
            log.timestamp
          );
        }
      }
    } catch (error) {
      console.error('Failed to load logs from localStorage:', error);
    }
  }
}

// Singleton instance
export const logger = Logger.getInstance();

// Convenience exports
export const logDebug = (message: string, context?: string, data?: any) =>
  logger.debug(message, context, data);

export const logInfo = (message: string, context?: string, data?: any) =>
  logger.info(message, context, data);

export const logWarn = (message: string, context?: string, data?: any) =>
  logger.warn(message, context, data);

export const logError = (message: string, error?: Error, context?: string, data?: any) =>
  logger.error(message, error, context, data);

export const logCritical = (message: string, error?: Error, context?: string, data?: any) =>
  logger.critical(message, error, context, data);
