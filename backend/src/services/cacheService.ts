import { WorkbookData } from '../types';

interface CachedComparison {
  file1Data: WorkbookData;
  file2Data: WorkbookData;
  timestamp: Date;
  expiresAt: Date;
}

class CacheService {
  private cache: Map<string, CachedComparison> = new Map();
  private readonly TTL = 30 * 60 * 1000; // 30 minutes

  set(comparisonId: string, file1Data: WorkbookData, file2Data: WorkbookData): void {
    const now = new Date();
    this.cache.set(comparisonId, {
      file1Data,
      file2Data,
      timestamp: now,
      expiresAt: new Date(now.getTime() + this.TTL)
    });
    
    // Clean up expired entries
    this.cleanup();
  }

  get(comparisonId: string): CachedComparison | null {
    const cached = this.cache.get(comparisonId);
    if (!cached) return null;

    if (new Date() > cached.expiresAt) {
      this.cache.delete(comparisonId);
      return null;
    }

    return cached;
  }

  private cleanup(): void {
    const now = new Date();
    for (const [id, data] of this.cache.entries()) {
      if (now > data.expiresAt) {
        this.cache.delete(id);
      }
    }
  }

  clear(comparisonId: string): void {
    this.cache.delete(comparisonId);
  }

  clearAll(): void {
    this.cache.clear();
  }
}

export const cacheService = new CacheService();