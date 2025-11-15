import type { ContractVersion, FixSubmission, ContractAudit, FixVerificationProgress } from '../types';

export class VersionManager {
  private static readonly STORAGE_KEY = 'ai_audit_versions';
  private static readonly ACTIVE_FIX_KEY = 'ai_audit_active_fix';

  static saveVersions(versions: ContractVersion[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(versions));
    } catch (error) {
      console.error('Failed to save versions to localStorage:', error);
    }
  }

  static loadVersions(): ContractVersion[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load versions from localStorage:', error);
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
      console.error('Failed to save active fix submission:', error);
    }
  }

  static loadActiveFixSubmission(): FixSubmission | null {
    try {
      const stored = localStorage.getItem(this.ACTIVE_FIX_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load active fix submission:', error);
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
      console.error('Failed to clear version data:', error);
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