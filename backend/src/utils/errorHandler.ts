/**
 * @file Comprehensive Error Handling Utilities
 * Provides centralized error handling, logging, and error classification
 */

export enum ErrorType {
  WEBSOCKET_CONNECTION = 'WEBSOCKET_CONNECTION',
  WEBSOCKET_SEND = 'WEBSOCKET_SEND',
  WEBSOCKET_PARSE = 'WEBSOCKET_PARSE',
  DATABASE_CONNECTION = 'DATABASE_CONNECTION',
  DATABASE_QUERY = 'DATABASE_QUERY',
  NOTIFICATION_CREATE = 'NOTIFICATION_CREATE',
  NOTIFICATION_BROADCAST = 'NOTIFICATION_BROADCAST',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  userId?: string;
  villageKey?: string;
  notificationId?: string;
  websocketId?: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
  requestId?: string;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly retryable: boolean;
  public readonly originalError?: Error;

  constructor(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Partial<ErrorContext> = {},
    retryable: boolean = false,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.context = {
      timestamp: new Date().toISOString(),
      ...context
    };
    this.retryable = retryable;
    this.originalError = originalError;

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      context: this.context,
      retryable: this.retryable,
      stack: this.stack,
      originalError: this.originalError?.message
    };
  }
}

export class WebSocketError extends AppError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorType.WEBSOCKET_CONNECTION,
      ErrorSeverity.HIGH,
      context,
      true,
      originalError
    );
    this.name = 'WebSocketError';
  }
}

export class NotificationError extends AppError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorType.NOTIFICATION_CREATE,
      ErrorSeverity.MEDIUM,
      context,
      true,
      originalError
    );
    this.name = 'NotificationError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      context,
      false,
      originalError
    );
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorType.DATABASE_QUERY,
      ErrorSeverity.HIGH,
      context,
      true,
      originalError
    );
    this.name = 'DatabaseError';
  }
}

// Error Handler Class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCounts: Map<ErrorType, number> = new Map();
  private lastErrorTime: Map<ErrorType, number> = new Map();

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: AppError | Error, additionalContext?: Partial<ErrorContext>): void {
    const appError = error instanceof AppError ? error : this.wrapError(error);
    
    // Add additional context
    if (additionalContext) {
      Object.assign(appError.context, additionalContext);
    }

    // Update error counts
    this.updateErrorCounts(appError.type);

    // Log error based on severity
    this.logError(appError);

    // Check for error patterns
    this.checkErrorPatterns(appError);

    // Send alerts for critical errors
    if (appError.severity === ErrorSeverity.CRITICAL) {
      this.sendCriticalAlert(appError);
    }
  }

  private wrapError(error: Error): AppError {
    return new AppError(
      error.message,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      {},
      false,
      error
    );
  }

  private updateErrorCounts(type: ErrorType): void {
    const currentCount = this.errorCounts.get(type) || 0;
    this.errorCounts.set(type, currentCount + 1);
    this.lastErrorTime.set(type, Date.now());
  }

  private logError(error: AppError): void {
    const logData = {
      ...error.toJSON(),
      errorCount: this.errorCounts.get(error.type) || 0,
      timeSinceLastError: this.getTimeSinceLastError(error.type)
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('❌ HIGH SEVERITY ERROR:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData);
        break;
      case ErrorSeverity.LOW:
        console.info('ℹ️ LOW SEVERITY ERROR:', logData);
        break;
    }
  }

  private getTimeSinceLastError(type: ErrorType): number | null {
    const lastTime = this.lastErrorTime.get(type);
    return lastTime ? Date.now() - lastTime : null;
  }

  private checkErrorPatterns(error: AppError): void {
    const errorCount = this.errorCounts.get(error.type) || 0;
    const timeSinceLastError = this.getTimeSinceLastError(error.type);

    // Check for error spikes (more than 10 errors in 1 minute)
    if (errorCount > 10 && timeSinceLastError && timeSinceLastError < 60000) {
      console.error(`🚨 ERROR SPIKE DETECTED for ${error.type}: ${errorCount} errors in ${timeSinceLastError}ms`);
    }

    // Check for repeated errors
    if (errorCount > 5 && timeSinceLastError && timeSinceLastError < 30000) {
      console.warn(`⚠️ REPEATED ERRORS for ${error.type}: ${errorCount} errors in ${timeSinceLastError}ms`);
    }
  }

  private sendCriticalAlert(error: AppError): void {
    // In a real application, this would send alerts to monitoring systems
    console.error('🚨 CRITICAL ALERT SENT:', {
      error: error.toJSON(),
      timestamp: new Date().toISOString(),
      action: 'ALERT_SENT'
    });
  }

  public getErrorStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [type, count] of this.errorCounts.entries()) {
      stats[type] = {
        count,
        lastErrorTime: this.lastErrorTime.get(type),
        timeSinceLastError: this.getTimeSinceLastError(type)
      };
    }
    
    return stats;
  }

  public resetErrorCounts(): void {
    this.errorCounts.clear();
    this.lastErrorTime.clear();
  }
}

// Utility functions
export const createError = (
  message: string,
  type: ErrorType,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context: Partial<ErrorContext> = {},
  retryable: boolean = false,
  originalError?: Error
): AppError => {
  return new AppError(message, type, severity, context, retryable, originalError);
};

export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  errorType: ErrorType,
  context: Partial<ErrorContext> = {}
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    const appError = error instanceof AppError 
      ? error 
      : createError(
          error instanceof Error ? error.message : 'Unknown error',
          errorType,
          ErrorSeverity.MEDIUM,
          context,
          true,
          error instanceof Error ? error : undefined
        );
    
    ErrorHandler.getInstance().handleError(appError, context);
    return null;
  }
};

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => R | Promise<R>,
  errorType: ErrorType,
  context: Partial<ErrorContext> = {}
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      const appError = error instanceof AppError 
        ? error 
        : createError(
            error instanceof Error ? error.message : 'Unknown error',
            errorType,
            ErrorSeverity.MEDIUM,
            context,
            true,
            error instanceof Error ? error : undefined
          );
      
      ErrorHandler.getInstance().handleError(appError, context);
      return null;
    }
  };
};

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
