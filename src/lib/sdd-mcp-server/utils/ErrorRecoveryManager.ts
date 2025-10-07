/**
 * ErrorRecoveryManager - Centralized error handling and recovery system
 * Provides robust error handling with retry mechanisms, graceful degradation, and user-friendly messages
 */

export interface ErrorContext {
  tool: string;
  operation: string;
  phase?: number;
  featureId?: string;
  timestamp: Date;
  retryCount?: number;
}

export interface ErrorRecoveryOptions {
  maxRetries: number;
  retryDelay: number;
  enableGracefulDegradation: boolean;
  enableUserFriendlyMessages: boolean;
  enableDetailedLogging: boolean;
}

export interface RetryableError extends Error {
  isRetryable: boolean;
  retryAfter?: number;
}

export class ErrorRecoveryManager {
  private static instance: ErrorRecoveryManager;
  private errorLog: Array<{ context: ErrorContext; error: Error; resolved: boolean }> = [];
  private defaultOptions: ErrorRecoveryOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    enableGracefulDegradation: true,
    enableUserFriendlyMessages: true,
    enableDetailedLogging: true
  };

  private constructor() {}

  public static getInstance(): ErrorRecoveryManager {
    if (!ErrorRecoveryManager.instance) {
      ErrorRecoveryManager.instance = new ErrorRecoveryManager();
    }
    return ErrorRecoveryManager.instance;
  }

  /**
   * Enhanced error handling with retry mechanism and graceful degradation
   */
  public async handleError<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    options: Partial<ErrorRecoveryOptions> = {}
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Log successful recovery if this was a retry
        if (attempt > 0) {
          this.logRecovery(context, attempt);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Log the error
        if (config.enableDetailedLogging) {
          this.logError(context, lastError, attempt);
        }

        // Check if error is retryable
        if (!this.isRetryableError(lastError) || attempt >= config.maxRetries) {
          break;
        }

        // Wait before retry
        if (attempt < config.maxRetries) {
          const delay = this.calculateRetryDelay(attempt, config.retryDelay);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed, handle final error
    return this.handleFinalError(lastError!, context, config);
  }

  /**
   * Graceful degradation when critical data is missing
   */
  public handleGracefulDegradation<T>(
    data: T | null | undefined,
    fallback: T,
    context: ErrorContext,
    message: string
  ): T {
    if (data === null || data === undefined) {
      this.logGracefulDegradation(context, message);
      return fallback;
    }
    return data;
  }

  /**
   * Generate user-friendly error messages with solutions
   */
  public generateUserFriendlyMessage(error: Error, context: ErrorContext): string {
    const errorType = this.categorizeError(error);
    
    switch (errorType) {
      case 'DATABASE_CONNECTION':
        return `Database connection failed. Please check your database connection and try again. If this persists, contact support.`;
      
      case 'VALIDATION_ERROR':
        return `Invalid input provided. Please check your input and try again.`;
      
      case 'NOT_FOUND':
        return `The requested resource was not found. Please verify the feature ID and try again.`;
      
      case 'PERMISSION_DENIED':
        return `You don't have permission to perform this action. Please contact your administrator.`;
      
      case 'TIMEOUT':
        return `The operation timed out. Please try again. If this persists, the system may be under heavy load.`;
      
      case 'NETWORK_ERROR':
        return `Network error occurred. Please check your internet connection and try again.`;
      
      case 'JSON_PARSE_ERROR':
        return `Data format error. The system will attempt to repair the data automatically.`;
      
      default:
        return `An unexpected error occurred: ${error.message}. Please try again or contact support if the issue persists.`;
    }
  }

  /**
   * Add retry mechanism for transient failures
   */
  public async addRetryMechanism<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries: number = 3
  ): Promise<T> {
    return this.handleError(operation, context, { maxRetries });
  }

  /**
   * Add graceful degradation when data is missing
   */
  public addGracefulDegradation<T>(
    data: T | null | undefined,
    fallback: T,
    context: ErrorContext,
    message: string
  ): T {
    return this.handleGracefulDegradation(data, fallback, context, message);
  }

  /**
   * Add detailed error logging and monitoring
   */
  public addDetailedErrorLogging(error: Error, context: ErrorContext): void {
    this.logError(context, error, 0);
  }

  /**
   * Add user-friendly error messages with solutions
   */
  public addUserFriendlyErrorMessages(error: Error, context: ErrorContext): string {
    return this.generateUserFriendlyMessage(error, context);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'TIMEOUT',
      'NETWORK_ERROR'
    ];

    const errorMessage = error.message.toUpperCase();
    return retryableErrors.some(retryableError => errorMessage.includes(retryableError));
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    return baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
  }

  /**
   * Categorize error for better handling
   */
  private categorizeError(error: Error): string {
    const message = error.message.toUpperCase();
    
    if (message.includes('DATABASE') || message.includes('CONNECTION')) {
      return 'DATABASE_CONNECTION';
    }
    if (message.includes('VALIDATION') || message.includes('INVALID')) {
      return 'VALIDATION_ERROR';
    }
    if (message.includes('NOT FOUND') || message.includes('404')) {
      return 'NOT_FOUND';
    }
    if (message.includes('PERMISSION') || message.includes('UNAUTHORIZED')) {
      return 'PERMISSION_DENIED';
    }
    if (message.includes('TIMEOUT') || message.includes('TIMED OUT')) {
      return 'TIMEOUT';
    }
    if (message.includes('NETWORK') || message.includes('FETCH')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('JSON') || message.includes('PARSE')) {
      return 'JSON_PARSE_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Log error with context
   */
  private logError(context: ErrorContext, error: Error, attempt: number): void {
    const logEntry = {
      context: { ...context, retryCount: attempt },
      error,
      resolved: false
    };
    
    this.errorLog.push(logEntry);
    
    console.error(`[${context.tool}] Error in ${context.operation}:`, {
      error: error.message,
      stack: error.stack,
      context,
      attempt,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log successful recovery
   */
  private logRecovery(context: ErrorContext, attempt: number): void {
    console.log(`[${context.tool}] Successfully recovered from error after ${attempt} retries:`, {
      operation: context.operation,
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log graceful degradation
   */
  private logGracefulDegradation(context: ErrorContext, message: string): void {
    console.warn(`[${context.tool}] Graceful degradation applied:`, {
      operation: context.operation,
      message,
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle final error after all retries failed
   */
  private async handleFinalError<T>(
    error: Error,
    context: ErrorContext,
    options: ErrorRecoveryOptions
  ): Promise<T> {
    if (options.enableGracefulDegradation) {
      // Return fallback data or throw user-friendly error
      throw new Error(this.generateUserFriendlyMessage(error, context));
    } else {
      throw error;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get error statistics for monitoring
   */
  public getErrorStatistics(): {
    totalErrors: number;
    resolvedErrors: number;
    unresolvedErrors: number;
    errorsByTool: Record<string, number>;
    errorsByOperation: Record<string, number>;
  } {
    const totalErrors = this.errorLog.length;
    const resolvedErrors = this.errorLog.filter(entry => entry.resolved).length;
    const unresolvedErrors = totalErrors - resolvedErrors;
    
    const errorsByTool = this.errorLog.reduce((acc, entry) => {
      acc[entry.context.tool] = (acc[entry.context.tool] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const errorsByOperation = this.errorLog.reduce((acc, entry) => {
      acc[entry.context.operation] = (acc[entry.context.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors,
      resolvedErrors,
      unresolvedErrors,
      errorsByTool,
      errorsByOperation
    };
  }
}
