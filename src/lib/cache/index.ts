import type { ContractAudit, CacheEntry } from '../../types';

export class AuditCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize: number = 100, ttlHours: number = 24) {
    this.maxSize = maxSize;
    this.ttl = ttlHours * 60 * 60 * 1000; // Convert hours to milliseconds
    this.loadFromStorage();
  }

  public get(contractHash: string): ContractAudit | null {
    const entry = this.cache.get(contractHash);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > new Date(entry.expiresAt).getTime()) {
      this.cache.delete(contractHash);
      this.saveToStorage();
      return null;
    }

    return entry.result;
  }

  public set(contractHash: string, result: ContractAudit): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttl);

    const entry: CacheEntry = {
      contractHash,
      result,
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    // If cache is at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      this.removeOldestEntry();
    }

    this.cache.set(contractHash, entry);
    this.saveToStorage();
  }

  public has(contractHash: string): boolean {
    return this.get(contractHash) !== null;
  }

  public clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  public getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: string | null;
  } {
    let oldestTimestamp = Date.now();
    let oldestEntry: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      const timestamp = new Date(entry.timestamp).getTime();
      if (timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp;
        oldestEntry = key;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
      oldestEntry
    };
  }

  private removeOldestEntry(): void {
    let oldestTimestamp = Date.now();
    let oldestKey: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      const timestamp = new Date(entry.timestamp).getTime();
      if (timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private calculateHitRate(): number {
    // This would need to be implemented with actual hit/miss tracking
    // For now, return a placeholder
    return 0;
  }

  private saveToStorage(): void {
    try {
      const entries = Array.from(this.cache.entries());
      localStorage.setItem('audit-cache', JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('audit-cache');
      if (stored) {
        const entries: [string, CacheEntry][] = JSON.parse(stored);
        this.cache = new Map(entries);

        // Clean up expired entries
        this.cleanupExpiredEntries();
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > new Date(entry.expiresAt).getTime()) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      this.saveToStorage();
    }
  }
}