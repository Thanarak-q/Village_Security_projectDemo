/**
 * @file Error Monitoring and Alerting
 * Provides comprehensive error monitoring, metrics, and alerting capabilities
 */

import { AppError, ErrorType, ErrorSeverity, ErrorContext, errorHandler } from './errorHandler';

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByHour: Record<string, number>;
  averageErrorRate: number;
  criticalErrorCount: number;
  lastErrorTime: string | null;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: ErrorMetrics) => boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cooldown: number; // in milliseconds
  lastTriggered?: number;
}

export class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errorHistory: AppError[] = [];
  private metrics: ErrorMetrics;
  private alertRules: AlertRule[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.setupDefaultAlertRules();
  }

  public static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  private initializeMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorsByType: {} as Record<ErrorType, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      errorsByHour: {},
      averageErrorRate: 0,
      criticalErrorCount: 0,
      lastErrorTime: null
    };
  }

  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'critical_error_spike',
        name: 'Critical Error Spike',
        condition: (metrics) => metrics.criticalErrorCount > 5,
        severity: 'CRITICAL',
        cooldown: 300000 // 5 minutes
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: (metrics) => metrics.averageErrorRate > 10,
        severity: 'HIGH',
        cooldown: 600000 // 10 minutes
      },
      {
        id: 'websocket_errors',
        name: 'WebSocket Error Spike',
        condition: (metrics) => (metrics.errorsByType[ErrorType.WEBSOCKET_CONNECTION] || 0) > 10,
        severity: 'HIGH',
        cooldown: 300000 // 5 minutes
      },
      {
        id: 'database_errors',
        name: 'Database Error Spike',
        condition: (metrics) => (metrics.errorsByType[ErrorType.DATABASE_QUERY] || 0) > 5,
        severity: 'HIGH',
        cooldown: 600000 // 10 minutes
      }
    ];
  }

  public startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      console.warn('⚠️ Error monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkAlerts();
      this.cleanupOldErrors();
    }, intervalMs);

    console.log('📊 Error monitoring started');
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('📊 Error monitoring stopped');
  }

  public recordError(error: AppError): void {
    this.errorHistory.push(error);
    this.updateMetrics();
    this.checkAlerts();
  }

  private updateMetrics(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Filter errors from the last hour
    const recentErrors = this.errorHistory.filter(
      error => new Date(error.context.timestamp) > oneHourAgo
    );

    // Reset metrics
    this.metrics = this.initializeMetrics();
    this.metrics.totalErrors = recentErrors.length;
    this.metrics.lastErrorTime = recentErrors.length > 0 
      ? recentErrors[recentErrors.length - 1].context.timestamp 
      : null;

    // Count errors by type and severity
    recentErrors.forEach(error => {
      this.metrics.errorsByType[error.type] = (this.metrics.errorsByType[error.type] || 0) + 1;
      this.metrics.errorsBySeverity[error.severity] = (this.metrics.errorsBySeverity[error.severity] || 0) + 1;
      
      if (error.severity === ErrorSeverity.CRITICAL) {
        this.metrics.criticalErrorCount++;
      }
    });

    // Calculate average error rate (errors per minute)
    this.metrics.averageErrorRate = recentErrors.length / 60;

    // Count errors by hour
    recentErrors.forEach(error => {
      const hour = new Date(error.context.timestamp).getHours().toString();
      this.metrics.errorsByHour[hour] = (this.metrics.errorsByHour[hour] || 0) + 1;
    });
  }

  private checkAlerts(): void {
    this.alertRules.forEach(rule => {
      if (this.shouldTriggerAlert(rule)) {
        this.triggerAlert(rule);
      }
    });
  }

  private shouldTriggerAlert(rule: AlertRule): boolean {
    // Check cooldown
    if (rule.lastTriggered && Date.now() - rule.lastTriggered < rule.cooldown) {
      return false;
    }

    // Check condition
    return rule.condition(this.metrics);
  }

  private triggerAlert(rule: AlertRule): void {
    rule.lastTriggered = Date.now();
    
    const alert = {
      id: rule.id,
      name: rule.name,
      severity: rule.severity,
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      message: this.generateAlertMessage(rule)
    };

    this.sendAlert(alert);
  }

  private generateAlertMessage(rule: AlertRule): string {
    switch (rule.id) {
      case 'critical_error_spike':
        return `Critical error spike detected: ${this.metrics.criticalErrorCount} critical errors in the last hour`;
      case 'high_error_rate':
        return `High error rate detected: ${this.metrics.averageErrorRate.toFixed(2)} errors per minute`;
      case 'websocket_errors':
        return `WebSocket error spike: ${this.metrics.errorsByType[ErrorType.WEBSOCKET_CONNECTION] || 0} connection errors`;
      case 'database_errors':
        return `Database error spike: ${this.metrics.errorsByType[ErrorType.DATABASE_QUERY] || 0} query errors`;
      default:
        return `Alert triggered: ${rule.name}`;
    }
  }

  private sendAlert(alert: any): void {
    // In a real application, this would send alerts to monitoring systems
    console.error(`🚨 ALERT [${alert.severity}]: ${alert.name}`, {
      message: alert.message,
      timestamp: alert.timestamp,
      metrics: alert.metrics
    });

    // Could integrate with external services like:
    // - Slack notifications
    // - Email alerts
    // - PagerDuty
    // - DataDog
    // - New Relic
  }

  private cleanupOldErrors(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const initialCount = this.errorHistory.length;
    
    this.errorHistory = this.errorHistory.filter(
      error => new Date(error.context.timestamp) > oneDayAgo
    );

    const cleanedCount = initialCount - this.errorHistory.length;
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old error records`);
    }
  }

  public getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  public getErrorHistory(limit: number = 100): AppError[] {
    return this.errorHistory.slice(-limit);
  }

  public addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  public removeAlertRule(ruleId: string): void {
    this.alertRules = this.alertRules.filter(rule => rule.id !== ruleId);
  }

  public getHealthStatus(): {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    message: string;
    metrics: ErrorMetrics;
  } {
    if (this.metrics.criticalErrorCount > 0) {
      return {
        status: 'CRITICAL',
        message: `${this.metrics.criticalErrorCount} critical errors detected`,
        metrics: this.metrics
      };
    }

    if (this.metrics.averageErrorRate > 5) {
      return {
        status: 'WARNING',
        message: `High error rate: ${this.metrics.averageErrorRate.toFixed(2)} errors per minute`,
        metrics: this.metrics
      };
    }

    return {
      status: 'HEALTHY',
      message: 'System is operating normally',
      metrics: this.metrics
    };
  }

  public generateReport(): string {
    const health = this.getHealthStatus();
    const recentErrors = this.getErrorHistory(10);
    
    return `
# Error Monitoring Report
Generated: ${new Date().toISOString()}

## Health Status
- Status: ${health.status}
- Message: ${health.message}

## Metrics
- Total Errors (last hour): ${this.metrics.totalErrors}
- Critical Errors: ${this.metrics.criticalErrorCount}
- Average Error Rate: ${this.metrics.averageErrorRate.toFixed(2)} errors/min

## Error Types
${Object.entries(this.metrics.errorsByType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

## Recent Errors
${recentErrors.map(error => 
  `- [${error.severity}] ${error.type}: ${error.message}`
).join('\n')}
    `.trim();
  }
}

// Export singleton instance
export const errorMonitor = ErrorMonitor.getInstance();
