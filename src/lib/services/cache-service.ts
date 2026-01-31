/**
 * Cache Service
 * 
 * Provides caching functionality for API responses and database queries
 * to improve performance and reduce database load.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
  };

  // Default TTL values (in milliseconds)
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly SCHOOL_DATA_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly USER_DATA_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly SETTINGS_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly STATS_TTL = 2 * 60 * 1000; // 2 minutes

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.updateSize();
  }

  /**
   * Delete data from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateSize();
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    this.updateSize();
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFunction();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Cache school data with appropriate TTL
   */
  cacheSchoolData<T>(schoolId: string, dataType: string, data: T): void {
    const key = `school:${schoolId}:${dataType}`;
    this.set(key, data, this.SCHOOL_DATA_TTL);
  }

  /**
   * Get cached school data
   */
  getSchoolData<T>(schoolId: string, dataType: string): T | null {
    const key = `school:${schoolId}:${dataType}`;
    return this.get<T>(key);
  }

  /**
   * Cache user data with appropriate TTL
   */
  cacheUserData<T>(userId: string, dataType: string, data: T): void {
    const key = `user:${userId}:${dataType}`;
    this.set(key, data, this.USER_DATA_TTL);
  }

  /**
   * Get cached user data
   */
  getUserData<T>(userId: string, dataType: string): T | null {
    const key = `user:${userId}:${dataType}`;
    return this.get<T>(key);
  }

  /**
   * Cache settings with longer TTL
   */
  cacheSettings<T>(settingsType: string, schoolId: string, data: T): void {
    const key = `settings:${settingsType}:${schoolId}`;
    this.set(key, data, this.SETTINGS_TTL);
  }

  /**
   * Get cached settings
   */
  getSettings<T>(settingsType: string, schoolId: string): T | null {
    const key = `settings:${settingsType}:${schoolId}`;
    return this.get<T>(key);
  }

  /**
   * Cache statistics with short TTL
   */
  cacheStats<T>(statsType: string, identifier: string, data: T): void {
    const key = `stats:${statsType}:${identifier}`;
    this.set(key, data, this.STATS_TTL);
  }

  /**
   * Get cached statistics
   */
  getStats<T>(statsType: string, identifier: string): T | null {
    const key = `stats:${statsType}:${identifier}`;
    return this.get<T>(key);
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    this.stats.deletes += deletedCount;
    this.updateSize();
    return deletedCount;
  }

  /**
   * Invalidate all cache entries for a school
   */
  invalidateSchoolCache(schoolId: string): number {
    return this.invalidatePattern(`school:${schoolId}:*`);
  }

  /**
   * Invalidate all cache entries for a user
   */
  invalidateUserCache(userId: string): number {
    return this.invalidatePattern(`user:${userId}:*`);
  }

  /**
   * Invalidate settings cache for a school
   */
  invalidateSettingsCache(schoolId: string): number {
    return this.invalidatePattern(`settings:*:${schoolId}`);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let deletedCount = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    this.stats.deletes += deletedCount;
    this.updateSize();
    return deletedCount;
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Get cache keys by pattern
   */
  getKeys(pattern?: string): string[] {
    if (!pattern) {
      return Array.from(this.cache.keys());
    }
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  /**
   * Get cache entry info
   */
  getEntryInfo(key: string): { exists: boolean; age?: number; ttl?: number; expired?: boolean } {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return { exists: false };
    }
    
    const age = Date.now() - entry.timestamp;
    const expired = age > entry.ttl;
    
    return {
      exists: true,
      age,
      ttl: entry.ttl,
      expired,
    };
  }

  /**
   * Update cache size statistic
   */
  private updateSize(): void {
    this.stats.size = this.cache.size;
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanupInterval(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
    return setInterval(() => {
      const deleted = this.cleanup();
      if (deleted > 0) {
        console.log(`Cache cleanup: removed ${deleted} expired entries`);
      }
    }, intervalMs);
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;

// Start automatic cleanup (every 5 minutes)
if (typeof window === 'undefined') { // Only in server environment
  cacheService.startCleanupInterval();
}