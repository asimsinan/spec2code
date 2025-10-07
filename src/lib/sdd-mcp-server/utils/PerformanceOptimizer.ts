/**
 * PerformanceOptimizer - Advanced performance optimization and caching system
 * Provides data caching, lazy loading, batch processing, and memory optimization
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTtl: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  enableLazyLoading: boolean;
  enableBatchProcessing: boolean;
  enableMemoryOptimization: boolean;
}

export interface BatchOperation<T> {
  id: string;
  operation: () => Promise<T>;
  priority: number;
  timestamp: number;
}

export interface PerformanceMetrics {
  cacheHitRate: number;
  cacheMissRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  batchProcessingEfficiency: number;
  lazyLoadingEfficiency: number;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private batchQueue: BatchOperation<any>[] = [];
  private isProcessingBatch = false;
  private config: CacheConfig;
  private metrics: PerformanceMetrics;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      maxSize: 1000,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      enableLazyLoading: true,
      enableBatchProcessing: true,
      enableMemoryOptimization: true
    };
    
    this.metrics = {
      cacheHitRate: 0,
      cacheMissRate: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      batchProcessingEfficiency: 0,
      lazyLoadingEfficiency: 0
    };

    this.startCleanupTimer();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Add data caching for frequently accessed data
   */
  public addDataCaching<T>(
    key: string,
    data: T,
    ttl?: number
  ): void {
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTtl,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
    this.updateMetrics();
  }

  /**
   * Get data from cache with lazy loading fallback
   */
  public async getCachedData<T>(
    key: string,
    fallback?: () => Promise<T>,
    ttl?: number
  ): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (entry) {
      // Check if entry is still valid
      if (Date.now() - entry.timestamp < entry.ttl) {
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.updateMetrics();
        return entry.data as T;
      } else {
        // Entry expired, remove it
        this.cache.delete(key);
      }
    }

    // Cache miss - use fallback if provided
    if (fallback) {
      const startTime = Date.now();
      try {
        const data = await fallback();
        this.addDataCaching(key, data, ttl);
        this.updateResponseTime(Date.now() - startTime);
        return data;
      } catch (error) {
        console.error(`[PerformanceOptimizer] Error in fallback for key ${key}:`, error);
        return null;
      }
    }

    this.updateMetrics();
    return null;
  }

  /**
   * Add lazy loading for non-critical content
   */
  public addLazyLoading<T>(
    key: string,
    loader: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      try {
        // Check cache first
        const cached = await this.getCachedData(key, undefined, ttl);
        if (cached) {
          resolve(cached as T);
          return;
        }

        // Load data lazily
        const startTime = Date.now();
        const data = await loader();
        this.addDataCaching(key, data, ttl);
        this.updateResponseTime(Date.now() - startTime);
        this.updateLazyLoadingEfficiency();
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add batch processing for multiple operations
   */
  public addBatchProcessing<T>(
    operations: BatchOperation<T>[],
    batchSize: number = 10,
    maxWaitTime: number = 1000
  ): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      // Add operations to batch queue
      this.batchQueue.push(...operations);
      
      // Process batch if conditions are met
      if (this.batchQueue.length >= batchSize || this.shouldProcessBatch(maxWaitTime)) {
        this.processBatch(batchSize)
          .then((results: any[]) => resolve(results as T[]))
          .catch(reject);
      } else {
        // Wait for more operations or timeout
        setTimeout(() => {
          this.processBatch(batchSize)
            .then((results: any[]) => resolve(results as T[]))
            .catch(reject);
        }, maxWaitTime);
      }
    });
  }

  /**
   * Add memory optimization for large datasets
   */
  public addMemoryOptimization<T>(
    data: T[],
    maxSize: number = 1000
  ): T[] {
    if (!this.config.enableMemoryOptimization) {
      return data;
    }

    // If data is within limits, return as is
    if (data.length <= maxSize) {
      return data;
    }

    // Optimize large datasets
    const optimized = this.optimizeLargeDataset(data, maxSize);
    this.updateMemoryUsage();
    return optimized;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.updateMetrics();
  }

  /**
   * Update cache configuration
   */
  public updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval && this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.startCleanupTimer();
    }
  }

  /**
   * Process batch operations
   */
  private async processBatch(batchSize: number): Promise<any[]> {
    if (this.isProcessingBatch) {
      return [];
    }

    this.isProcessingBatch = true;
    const startTime = Date.now();
    
    try {
      // Get operations to process
      const operationsToProcess = this.batchQueue.splice(0, batchSize);
      
      // Process operations in parallel
      const results = await Promise.allSettled(
        operationsToProcess.map(op => op.operation())
      );

      // Extract successful results
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);

      // Log failed operations
      const failedResults = results.filter(result => result.status === 'rejected');
      if (failedResults.length > 0) {
        console.warn(`[PerformanceOptimizer] ${failedResults.length} batch operations failed`);
      }

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateBatchProcessingEfficiency(operationsToProcess.length, processingTime);
      
      return successfulResults;
    } finally {
      this.isProcessingBatch = false;
    }
  }

  /**
   * Check if batch should be processed
   */
  private shouldProcessBatch(maxWaitTime: number): boolean {
    if (this.batchQueue.length === 0) {
      return false;
    }

    const oldestOperation = this.batchQueue[0];
    return Date.now() - oldestOperation.timestamp >= maxWaitTime;
  }

  /**
   * Optimize large dataset
   */
  private optimizeLargeDataset<T>(data: T[], maxSize: number): T[] {
    // Strategy 1: Keep most recent items
    if (data.length > maxSize) {
      return data.slice(-maxSize);
    }

    // Strategy 2: Sample data if it's still too large
    if (data.length > maxSize * 2) {
      const step = Math.ceil(data.length / maxSize);
      return data.filter((_, index) => index % step === 0);
    }

    return data;
  }

  /**
   * Evict least recently used cache entry
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`[PerformanceOptimizer] Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    const totalRequests = this.metrics.cacheHitRate + this.metrics.cacheMissRate;
    
    if (totalRequests > 0) {
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate / totalRequests) * 100;
      this.metrics.cacheMissRate = (this.metrics.cacheMissRate / totalRequests) * 100;
    }

    this.updateMemoryUsage();
  }

  /**
   * Update response time metrics
   */
  private updateResponseTime(responseTime: number): void {
    if (this.metrics.averageResponseTime === 0) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime = (this.metrics.averageResponseTime + responseTime) / 2;
    }
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memoryUsage = process.memoryUsage();
      this.metrics.memoryUsage = memoryUsage.heapUsed / 1024 / 1024; // MB
    }
  }

  /**
   * Update batch processing efficiency
   */
  private updateBatchProcessingEfficiency(operationCount: number, processingTime: number): void {
    const efficiency = operationCount / processingTime; // operations per ms
    this.metrics.batchProcessingEfficiency = efficiency;
  }

  /**
   * Update lazy loading efficiency
   */
  private updateLazyLoadingEfficiency(): void {
    // This would be calculated based on lazy loading performance
    // For now, we'll use a simple metric
    this.metrics.lazyLoadingEfficiency = this.cache.size / this.config.maxSize;
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
    this.batchQueue = [];
  }
}
