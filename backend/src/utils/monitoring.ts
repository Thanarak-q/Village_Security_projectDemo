/**
 * @file System Monitoring
 * Comprehensive monitoring and metrics collection
 */

import { AppError, ErrorType, ErrorSeverity } from './errorHandler';

export interface SystemMetrics {
  timestamp: Date;
  uptime: number;
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  database: {
    connections: number;
    queries: number;
    responseTime: number;
  };
  websocket: {
    connections: number;
    messages: number;
    errors: number;
  };
  api: {
    requests: number;
    errors: number;
    responseTime: number;
  };
}

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  adminId?: string;
}

export interface SecurityEvent {
  type: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY';
  adminId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  details: Record<string, unknown>;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: SystemMetrics[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private securityEvents: SecurityEvent[] = [];
  private maxMetricsHistory = 1000;
  private maxPerformanceHistory = 5000;
  private maxSecurityHistory = 10000;

  private constructor() {
    this.startMetricsCollection();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private startMetricsCollection(): void {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Clean up old metrics every 5 minutes
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000);
  }

  private collectSystemMetrics(): void {
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = require('os').totalmem();
      const freeMemory = require('os').freemem();
      const usedMemory = totalMemory - freeMemory;

      const metrics: SystemMetrics = {
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: {
          used: usedMemory,
          free: freeMemory,
          total: totalMemory,
          percentage: (usedMemory / totalMemory) * 100
        },
        cpu: {
          usage: 0, // Would need additional library for CPU usage
          loadAverage: require('os').loadavg()
        },
        database: {
          connections: 0, // Would need database connection pool info
          queries: 0, // Would need database query counter
          responseTime: 0 // Would need database response time tracking
        },
        websocket: {
          connections: 0, // Would need WebSocket connection tracking
          messages: 0, // Would need WebSocket message counter
          errors: 0 // Would need WebSocket error counter
        },
        api: {
          requests: 0, // Would need API request counter
          errors: 0, // Would need API error counter
          responseTime: 0 // Would need API response time tracking
        }
      };

      this.metrics.push(metrics);

      // Keep only recent metrics
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics = this.metrics.slice(-this.maxMetricsHistory);
      }

    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  private cleanupOldMetrics(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > oneHourAgo);
    this.securityEvents = this.securityEvents.filter(e => e.timestamp > oneHourAgo);
  }

  public recordPerformanceMetric(metric: Omit<PerformanceMetrics, 'timestamp'>): void {
    const performanceMetric: PerformanceMetrics = {
      ...metric,
      timestamp: new Date()
    };

    this.performanceMetrics.push(performanceMetric);

    // Keep only recent metrics
    if (this.performanceMetrics.length > this.maxPerformanceHistory) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxPerformanceHistory);
    }
  }

  public recordSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    this.securityEvents.push(securityEvent);

    // Keep only recent events
    if (this.securityEvents.length > this.maxSecurityHistory) {
      this.securityEvents = this.securityEvents.slice(-this.maxSecurityHistory);
    }

    // Log security events
    console.log(`🔒 Security Event: ${event.type}`, {
      adminId: event.adminId,
      ip: event.ip,
      userAgent: event.userAgent,
      details: event.details
    });
  }

  public getSystemMetrics(): SystemMetrics[] {
    return [...this.metrics];
  }

  public getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  public getLatestMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  public getSystemHealth(): {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    issues: string[];
    recommendations: string[];
  } {
    const latest = this.getLatestMetrics();
    if (!latest) {
      return {
        status: 'WARNING',
        issues: ['No metrics available'],
        recommendations: ['Check monitoring system']
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check memory usage
    if (latest.memory.percentage > 90) {
      issues.push('High memory usage');
      recommendations.push('Consider restarting the application or increasing memory');
    } else if (latest.memory.percentage > 80) {
      issues.push('Elevated memory usage');
      recommendations.push('Monitor memory usage closely');
    }

    // Check CPU load
    if (latest.cpu.loadAverage[0] > 4) {
      issues.push('High CPU load');
      recommendations.push('Check for resource-intensive processes');
    }

    // Check uptime
    if (latest.uptime > 7 * 24 * 3600) { // 7 days
      issues.push('Long uptime');
      recommendations.push('Consider restarting the application for updates');
    }

    // Check WebSocket errors
    if (latest.websocket.errors > 10) {
      issues.push('High WebSocket error rate');
      recommendations.push('Check WebSocket connection stability');
    }

    // Check API errors
    if (latest.api.errors > 20) {
      issues.push('High API error rate');
      recommendations.push('Check API endpoint stability');
    }

    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    
    if (issues.length > 3) {
      status = 'CRITICAL';
    } else if (issues.length > 0) {
      status = 'WARNING';
    }

    return {
      status,
      issues,
      recommendations
    };
  }

  public getPerformanceStats(): {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    topEndpoints: Array<{ endpoint: string; count: number; avgResponseTime: number }>;
  } {
    const recent = this.performanceMetrics.filter(
      m => m.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    const totalRequests = recent.length;
    const errorRequests = recent.filter(m => m.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    const averageResponseTime = totalRequests > 0 
      ? recent.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests 
      : 0;

    // Group by endpoint
    const endpointStats = new Map<string, { count: number; totalTime: number }>();
    recent.forEach(m => {
      const key = `${m.method} ${m.endpoint}`;
      const existing = endpointStats.get(key) || { count: 0, totalTime: 0 };
      endpointStats.set(key, {
        count: existing.count + 1,
        totalTime: existing.totalTime + m.responseTime
      });
    });

    const topEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgResponseTime: stats.totalTime / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      averageResponseTime,
      totalRequests,
      errorRate,
      topEndpoints
    };
  }

  public getSecurityStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: SecurityEvent[];
    suspiciousActivity: SecurityEvent[];
  } {
    const recent = this.securityEvents.filter(
      e => e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    const eventsByType: Record<string, number> = {};
    recent.forEach(e => {
      eventsByType[e.type] = (eventsByType[e.type] || 0) + 1;
    });

    const suspiciousActivity = recent.filter(
      e => e.type === 'SUSPICIOUS_ACTIVITY' || e.type === 'FAILED_LOGIN'
    );

    return {
      totalEvents: recent.length,
      eventsByType,
      recentEvents: recent.slice(-20), // Last 20 events
      suspiciousActivity
    };
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();
