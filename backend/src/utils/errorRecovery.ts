/**
 * @file Error Recovery Strategies
 * Provides various recovery mechanisms for different types of errors
 */

import { AppError, ErrorType, ErrorSeverity, ErrorContext, errorHandler } from './errorHandler';

export interface RecoveryStrategy {
  canHandle(error: AppError): boolean;
  recover(error: AppError): Promise<boolean>;
  getRetryDelay(attempt: number): number;
  getMaxRetries(): number;
}

export class WebSocketRecoveryStrategy implements RecoveryStrategy {
  private retryCounts: Map<string, number> = new Map();

  canHandle(error: AppError): boolean {
    return error.type === ErrorType.WEBSOCKET_CONNECTION || 
           error.type === ErrorType.WEBSOCKET_SEND;
  }

  async recover(error: AppError): Promise<boolean> {
    const key = `${error.context.websocketId || 'default'}`;
    const retryCount = this.retryCounts.get(key) || 0;
    
    if (retryCount >= this.getMaxRetries()) {
      console.error(`❌ Max retry attempts reached for WebSocket recovery: ${key}`);
      return false;
    }

    this.retryCounts.set(key, retryCount + 1);

    try {
      // Implement WebSocket reconnection logic here
      console.log(`🔄 Attempting WebSocket recovery (attempt ${retryCount + 1}/${this.getMaxRetries()})`);
      
      // Simulate recovery attempt
      await new Promise(resolve => setTimeout(resolve, this.getRetryDelay(retryCount)));
      
      // Reset retry count on successful recovery
      this.retryCounts.delete(key);
      return true;
    } catch (recoveryError) {
      console.error('❌ WebSocket recovery failed:', recoveryError);
      return false;
    }
  }

  getRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000;
    const maxDelay = 30000;
    const jitter = Math.random() * 1000;
    return Math.min(baseDelay * Math.pow(2, attempt) + jitter, maxDelay);
  }

  getMaxRetries(): number {
    return 5;
  }
}

export class DatabaseRecoveryStrategy implements RecoveryStrategy {
  private retryCounts: Map<string, number> = new Map();

  canHandle(error: AppError): boolean {
    return error.type === ErrorType.DATABASE_CONNECTION || 
           error.type === ErrorType.DATABASE_QUERY;
  }

  async recover(error: AppError): Promise<boolean> {
    const key = `${error.context.villageKey || 'default'}`;
    const retryCount = this.retryCounts.get(key) || 0;
    
    if (retryCount >= this.getMaxRetries()) {
      console.error(`❌ Max retry attempts reached for database recovery: ${key}`);
      return false;
    }

    this.retryCounts.set(key, retryCount + 1);

    try {
      console.log(`🔄 Attempting database recovery (attempt ${retryCount + 1}/${this.getMaxRetries()})`);
      
      // Implement database reconnection logic here
      await new Promise(resolve => setTimeout(resolve, this.getRetryDelay(retryCount)));
      
      // Reset retry count on successful recovery
      this.retryCounts.delete(key);
      return true;
    } catch (recoveryError) {
      console.error('❌ Database recovery failed:', recoveryError);
      return false;
    }
  }

  getRetryDelay(attempt: number): number {
    // Linear backoff for database operations
    const baseDelay = 2000;
    const maxDelay = 10000;
    return Math.min(baseDelay * (attempt + 1), maxDelay);
  }

  getMaxRetries(): number {
    return 3;
  }
}

export class NotificationRecoveryStrategy implements RecoveryStrategy {
  private retryCounts: Map<string, number> = new Map();

  canHandle(error: AppError): boolean {
    return error.type === ErrorType.NOTIFICATION_CREATE || 
           error.type === ErrorType.NOTIFICATION_BROADCAST;
  }

  async recover(error: AppError): Promise<boolean> {
    const key = `${error.context.notificationId || 'default'}`;
    const retryCount = this.retryCounts.get(key) || 0;
    
    if (retryCount >= this.getMaxRetries()) {
      console.error(`❌ Max retry attempts reached for notification recovery: ${key}`);
      return false;
    }

    this.retryCounts.set(key, retryCount + 1);

    try {
      console.log(`🔄 Attempting notification recovery (attempt ${retryCount + 1}/${this.getMaxRetries()})`);
      
      // Implement notification retry logic here
      await new Promise(resolve => setTimeout(resolve, this.getRetryDelay(retryCount)));
      
      // Reset retry count on successful recovery
      this.retryCounts.delete(key);
      return true;
    } catch (recoveryError) {
      console.error('❌ Notification recovery failed:', recoveryError);
      return false;
    }
  }

  getRetryDelay(attempt: number): number {
    // Fast retry for notifications
    const baseDelay = 500;
    const maxDelay = 5000;
    return Math.min(baseDelay * Math.pow(1.5, attempt), maxDelay);
  }

  getMaxRetries(): number {
    return 3;
  }
}

export class ErrorRecoveryManager {
  private strategies: RecoveryStrategy[] = [];
  private recoveryQueue: Array<{ error: AppError; attempts: number }> = [];
  private isProcessing = false;

  constructor() {
    this.strategies = [
      new WebSocketRecoveryStrategy(),
      new DatabaseRecoveryStrategy(),
      new NotificationRecoveryStrategy()
    ];
  }

  public addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
  }

  public async handleError(error: AppError): Promise<boolean> {
    const strategy = this.strategies.find(s => s.canHandle(error));
    
    if (!strategy) {
      console.warn('⚠️ No recovery strategy found for error:', error.type);
      return false;
    }

    if (!error.retryable) {
      console.log('ℹ️ Error is not retryable:', error.type);
      return false;
    }

    // Add to recovery queue
    this.recoveryQueue.push({ error, attempts: 0 });
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processRecoveryQueue();
    }

    return true;
  }

  private async processRecoveryQueue(): Promise<void> {
    if (this.isProcessing || this.recoveryQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.recoveryQueue.length > 0) {
      const { error, attempts } = this.recoveryQueue.shift()!;
      const strategy = this.strategies.find(s => s.canHandle(error));

      if (!strategy) {
        continue;
      }

      if (attempts >= strategy.getMaxRetries()) {
        console.error(`❌ Max recovery attempts reached for error: ${error.type}`);
        continue;
      }

      try {
        const recovered = await strategy.recover(error);
        
        if (recovered) {
          console.log(`✅ Successfully recovered from error: ${error.type}`);
        } else {
          // Retry later
          this.recoveryQueue.push({ error, attempts: attempts + 1 });
        }
      } catch (recoveryError) {
        console.error('❌ Recovery attempt failed:', recoveryError);
        this.recoveryQueue.push({ error, attempts: attempts + 1 });
      }

      // Add delay between recovery attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isProcessing = false;
  }

  public getRecoveryStats(): Record<string, any> {
    return {
      queueLength: this.recoveryQueue.length,
      isProcessing: this.isProcessing,
      strategies: this.strategies.map(s => s.constructor.name)
    };
  }
}

// Circuit Breaker Pattern
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly failureThreshold: number;
  private readonly timeout: number;

  constructor(failureThreshold: number = 5, timeout: number = 60000) {
    this.failureThreshold = failureThreshold;
    this.timeout = timeout;
  }

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  public getState(): string {
    return this.state;
  }

  public getFailures(): number {
    return this.failures;
  }
}

// Export singleton instances
export const errorRecoveryManager = new ErrorRecoveryManager();
export const webSocketCircuitBreaker = new CircuitBreaker(3, 30000);
export const databaseCircuitBreaker = new CircuitBreaker(5, 60000);
