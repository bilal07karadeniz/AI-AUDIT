import type { ContractVersion, FixSubmission, ContractAudit, FixVerificationProgress } from '../types';
import { logger } from './utils/logger';
import { perfMonitor } from './utils/performance';

export class VersionManager {
  private static readonly STORAGE_KEY = 'ai_audit_versions';
  private static readonly ACTIVE_FIX_KEY = 'ai_audit_active_fix';
  private static readonly MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB conservative limit

  /**
   * Check if localStorage has enough space
   */
  private static checkStorageQuota(dataSize: number): boolean {
    try {
      const currentSize = this.getStorageSize();
      return (currentSize + dataSize) < this.MAX_STORAGE_SIZE;
    } catch {
      return false;
    }
  }

  /**
   * Get current localStorage usage
   */
  private static getStorageSize(): number {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }

  /**
   * Clean up old versions to free space
   */
  private static cleanupOldVersions(keepCount: number = 5): void {
    try {
      const versions = this.loadVersions();
      if (versions.length > keepCount) {
        const recentVersions = versions.slice(-keepCount);
        this.saveVersions(recentVersions);
        logger.info(`Cleaned up ${versions.length - keepCount} old versions`, 'VersionManager', {
          removed: versions.length - keepCount,
          kept: keepCount
        });
      }
    } catch (error) {
      logger.error('Failed to cleanup old versions', error as Error, 'VersionManager');
    }
  }

  static saveVersions(versions: ContractVersion[]): void {
    perfMonitor.start('versionManager:saveVersions', 'VersionManager');
    try {
      const data = JSON.stringify(versions);
      const dataSize = data.length;

      // Check if we have space
      if (!this.checkStorageQuota(dataSize)) {
        logger.warn('localStorage quota approaching, cleaning up old versions', 'VersionManager', {
          dataSize,
          storageSize: this.getStorageSize()
        });
        this.cleanupOldVersions(3);

        // Try again after cleanup
        if (!this.checkStorageQuota(dataSize)) {
          throw new Error('localStorage quota exceeded. Please clear old data.');
        }
      }

      localStorage.setItem(this.STORAGE_KEY, data);
      perfMonitor.end('versionManager:saveVersions', 'VersionManager', {
        versionCount: versions.length,
        dataSize
      });
    } catch (error) {
      perfMonitor.end('versionManager:saveVersions', 'VersionManager', { error: true });
      logger.error('Failed to save versions to localStorage', error as Error, 'VersionManager');

      // If quota exceeded, try cleanup and retry once
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        logger.warn('Quota exceeded, attempting cleanup', 'VersionManager');
        this.cleanupOldVersions(2);
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(versions));
        } catch (retryError) {
          throw new Error('localStorage quota exceeded. Please clear browser data and try again.');
        }
      }
      throw error;
    }
  }

  static loadVersions(): ContractVersion[] {
    perfMonitor.start('versionManager:loadVersions', 'VersionManager');
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        perfMonitor.end('versionManager:loadVersions', 'VersionManager', { empty: true });
        return [];
      }

      const parsed = JSON.parse(stored);

      // Validate the data structure
      if (!Array.isArray(parsed)) {
        logger.error('Invalid versions data structure, resetting', undefined, 'VersionManager');
        perfMonitor.end('versionManager:loadVersions', 'VersionManager', { invalid: true });
        return [];
      }

      // Validate each version object
      const validVersions = parsed.filter((version: any) => {
        return version &&
               typeof version.version === 'string' &&
               typeof version.code === 'string' &&
               version.audit &&
               typeof version.submissionDate === 'string';
      });

      perfMonitor.end('versionManager:loadVersions', 'VersionManager', {
        versionCount: validVersions.length
      });
      return validVersions;
    } catch (error) {
      perfMonitor.end('versionManager:loadVersions', 'VersionManager', { error: true });
      logger.error('Failed to load versions from localStorage', error as Error, 'VersionManager');
      // If corrupted, clear it
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch {}
      return [];
    }
  }

  static saveActiveFixSubmission(fixSubmission: FixSubmission | null): void {
    try {
      if (fixSubmission) {
        localStorage.setItem(this.ACTIVE_FIX_KEY, JSON.stringify(fixSubmission));
      } else {
        localStorage.removeItem(this.ACTIVE_FIX_KEY);
      }
    } catch (error) {
      logger.error('Failed to save active fix submission', error as Error, 'VersionManager');
    }
  }

  static loadActiveFixSubmission(): FixSubmission | null {
    try {
      const stored = localStorage.getItem(this.ACTIVE_FIX_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);

      // Validate the data structure
      if (!parsed || typeof parsed !== 'object') {
        logger.error('Invalid fix submission data structure', undefined, 'VersionManager');
        localStorage.removeItem(this.ACTIVE_FIX_KEY);
        return null;
      }

      // Basic validation
      if (!parsed.id || !parsed.version || !parsed.fixedCode) {
        logger.error('Invalid fix submission data, missing required fields', undefined, 'VersionManager');
        localStorage.removeItem(this.ACTIVE_FIX_KEY);
        return null;
      }

      return parsed;
    } catch (error) {
      logger.error('Failed to load active fix submission', error as Error, 'VersionManager');
      // If corrupted, clear it
      try {
        localStorage.removeItem(this.ACTIVE_FIX_KEY);
      } catch {}
      return null;
    }
  }

  static addVersion(
    code: string,
    audit: ContractAudit,
    notes?: string,
    parentVersion?: string
  ): ContractVersion {
    const versions = this.loadVersions();
    const versionNumber = versions.length + 1;
    const version = `v${versionNumber}`;

    const newVersion: ContractVersion = {
      version,
      code,
      audit,
      submissionDate: new Date().toISOString(),
      submissionNotes: notes,
      parentVersion,
    };

    versions.push(newVersion);
    this.saveVersions(versions);
    return newVersion;
  }

  static getVersion(version: string): ContractVersion | null {
    const versions = this.loadVersions();
    return versions.find(v => v.version === version) || null;
  }

  static getLatestVersion(): ContractVersion | null {
    const versions = this.loadVersions();
    return versions.length > 0 ? versions[versions.length - 1] : null;
  }

  static getAllVersions(): ContractVersion[] {
    return this.loadVersions();
  }

  static updateVersionWithFixSubmission(version: string, fixSubmission: FixSubmission): void {
    const versions = this.loadVersions();
    const versionIndex = versions.findIndex(v => v.version === version);

    if (versionIndex !== -1) {
      versions[versionIndex].fixSubmission = fixSubmission;
      this.saveVersions(versions);
    }
  }

  static generateNextVersion(): string {
    const versions = this.loadVersions();
    return `v${versions.length + 1}`;
  }

  static clearAllData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.ACTIVE_FIX_KEY);
    } catch (error) {
      logger.error('Failed to clear version data', error as Error, 'VersionManager');
    }
  }

  static getVersionStats(): {
    totalVersions: number;
    latestVersion: string | null;
    hasActiveFix: boolean;
  } {
    const versions = this.loadVersions();
    const activeFix = this.loadActiveFixSubmission();

    return {
      totalVersions: versions.length,
      latestVersion: versions.length > 0 ? versions[versions.length - 1].version : null,
      hasActiveFix: !!activeFix,
    };
  }
}