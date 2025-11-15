import type { ContractAudit, CacheEntry } from '../../types';

export class AuditCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds
  private hits: number = 0;
  private misses: number = 0;
  private readonly STORAGE_KEY = 'audit-cache';
  private readonly MAX_STORAGE_SIZE = 2 * 1024 * 1024; // 2MB for cache

  constructor(maxSize: number = 100, ttlHours: number = 24) {
    this.maxSize = maxSize;
    this.ttl = ttlHours * 60 * 60 * 1000; // Convert hours to milliseconds
    this.loadFromStorage();
  }

  public get(contractHash: string): ContractAudit | null {
    const entry = this.cache.get(contractHash);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() > new Date(entry.expiresAt).getTime()) {
      this.cache.delete(contractHash);
      this.saveToStorage();
      this.misses++;
      return null;
    }

    this.hits++;
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
    const total = this.hits + this.misses;
    if (total === 0) return 0;
    return Math.round((this.hits / total) * 100);
  }

  /**
   * Reset hit/miss statistics
   */
  public resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Check storage quota before saving
   */
  private checkStorageQuota(dataSize: number): boolean {
    try {
      let currentSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          currentSize += localStorage[key].length + key.length;
        }
      }
      return (currentSize + dataSize) < this.MAX_STORAGE_SIZE;
    } catch {
      return false;
    }
  }

  private saveToStorage(): void {
    try {
      const entries = Array.from(this.cache.entries());
      const data = JSON.stringify(entries);
      const dataSize = data.length;

      // Check quota before saving
      if (!this.checkStorageQuota(dataSize)) {
        console.warn('Cache storage quota approaching, reducing cache size');
        // Remove oldest entries until we can save
        while (this.cache.size > Math.floor(this.maxSize / 2)) {
          this.removeOldestEntry();
        }
        const reducedData = JSON.stringify(Array.from(this.cache.entries()));

        if (!this.checkStorageQuota(reducedData.length)) {
          console.error('Unable to save cache: quota exceeded even after cleanup');
          return;
        }

        localStorage.setItem(this.STORAGE_KEY, reducedData);
        return;
      }

      localStorage.setItem(this.STORAGE_KEY, data);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded for cache');
        // Try to save with reduced size
        this.cache.clear();
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        } catch {
          console.error('Failed to clear cache storage');
        }
      } else {
        console.warn('Failed to save cache to localStorage:', error);
      }
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);

      // Validate data structure
      if (!Array.isArray(parsed)) {
        console.error('Invalid cache data structure, clearing cache');
        localStorage.removeItem(this.STORAGE_KEY);
        return;
      }

      // Validate and filter entries
      const validEntries = parsed.filter((entry: any) => {
        if (!Array.isArray(entry) || entry.length !== 2) return false;
        const [key, value] = entry;
        return typeof key === 'string' &&
               value &&
               typeof value === 'object' &&
               value.contractHash &&
               value.result &&
               value.timestamp &&
               value.expiresAt;
      });

      this.cache = new Map(validEntries as [string, CacheEntry][]);

      // Clean up expired entries
      this.cleanupExpiredEntries();
    } catch (error) {
      console.error('Failed to load cache from localStorage:', error);
      // Clear corrupted cache
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch {}
      this.cache.clear();
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