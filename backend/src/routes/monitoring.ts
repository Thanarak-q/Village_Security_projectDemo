/**
 * @file Monitoring Routes
 * API routes for system monitoring and metrics
 */

import { Elysia, t } from 'elysia';
import { monitoringService } from '../utils/monitoring';
import { extractTokenFromHeaders, verifyAdminToken, checkRolePermission } from '../middleware/auth';

export const monitoringRoutes = new Elysia({ prefix: '/api/monitoring' })
  .get('/health', async ({ headers, set }) => {
    try {
      const token = extractTokenFromHeaders(headers);
      if (!token) {
        set.status = 401;
        return { success: false, error: 'Token required' };
      }

      const authResult = await verifyAdminToken(token);
      if (!authResult.success || !authResult.admin) {
        set.status = 401;
        return { success: false, error: 'Invalid token' };
      }

      if (!checkRolePermission(authResult.admin.role, 'admin')) {
        set.status = 403;
        return { success: false, error: 'Insufficient permissions' };
      }

      const health = monitoringService.getSystemHealth();
      return {
        success: true,
        data: health
      };
    } catch (error) {
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })

  .get('/metrics', async ({ headers, set }) => {
    try {
      const token = extractTokenFromHeaders(headers);
      if (!token) {
        set.status = 401;
        return { success: false, error: 'Token required' };
      }

      const authResult = await verifyAdminToken(token);
      if (!authResult.success || !authResult.admin) {
        set.status = 401;
        return { success: false, error: 'Invalid token' };
      }

      if (!checkRolePermission(authResult.admin.role, 'admin')) {
        set.status = 403;
        return { success: false, error: 'Insufficient permissions' };
      }

      const metrics = monitoringService.getSystemMetrics();
      const latest = monitoringService.getLatestMetrics();
      
      return {
        success: true,
        data: {
          metrics: metrics.slice(-20), // Last 20 metrics
          latest,
          count: metrics.length
        }
      };
    } catch (error) {
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })

  .get('/performance', () => {
    const performance = monitoringService.getPerformanceStats();
    const performanceMetrics = monitoringService.getPerformanceMetrics();
    
    return {
      success: true,
      data: {
        stats: performance,
        recent: performanceMetrics.slice(-50) // Last 50 performance metrics
      }
    };
  })

  .get('/security', () => {
    const security = monitoringService.getSecurityStats();
    
    return {
      success: true,
      data: security
    };
  })

  .get('/dashboard', () => {
    const health = monitoringService.getSystemHealth();
    const performance = monitoringService.getPerformanceStats();
    const security = monitoringService.getSecurityStats();
    const latest = monitoringService.getLatestMetrics();
    
    return {
      success: true,
      data: {
        health,
        performance,
        security,
        system: latest
      }
    };
  })

  .get('/logs', ({ query }) => {
    const { type = 'all', limit = 100 } = query as { type?: string; limit?: number };
    
    let logs: any[] = [];
    
    if (type === 'all' || type === 'performance') {
      logs = logs.concat(monitoringService.getPerformanceMetrics().slice(-limit));
    }
    
    if (type === 'all' || type === 'security') {
      logs = logs.concat(monitoringService.getSecurityEvents().slice(-limit));
    }
    
    // Sort by timestamp
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return {
      success: true,
      data: logs.slice(0, limit)
    };
  }, {
    query: t.Object({
      type: t.Optional(t.String()),
      limit: t.Optional(t.Number())
    })
  })

  .get('/alerts', () => {
    const health = monitoringService.getSystemHealth();
    const security = monitoringService.getSecurityStats();
    
    const alerts = [];
    
    // System health alerts
    if (health.status === 'CRITICAL') {
      alerts.push({
        type: 'SYSTEM_CRITICAL',
        severity: 'CRITICAL',
        message: 'System is in critical state',
        details: health.issues,
        timestamp: new Date()
      });
    } else if (health.status === 'WARNING') {
      alerts.push({
        type: 'SYSTEM_WARNING',
        severity: 'WARNING',
        message: 'System warnings detected',
        details: health.issues,
        timestamp: new Date()
      });
    }
    
    // Security alerts
    if (security.suspiciousActivity.length > 0) {
      alerts.push({
        type: 'SECURITY_ALERT',
        severity: 'HIGH',
        message: `${security.suspiciousActivity.length} suspicious activities detected`,
        details: security.suspiciousActivity,
        timestamp: new Date()
      });
    }
    
    // Performance alerts
    if (security.totalEvents > 100) {
      alerts.push({
        type: 'HIGH_ACTIVITY',
        severity: 'MEDIUM',
        message: 'High security event activity',
        details: { totalEvents: security.totalEvents },
        timestamp: new Date()
      });
    }
    
    return {
      success: true,
      data: {
        alerts,
        count: alerts.length
      }
    };
  })

  .get('/export', ({ query }) => {
    const { type = 'all', format = 'json' } = query as { type?: string; format?: string };
    
    let data: any = {};
    
    if (type === 'all' || type === 'metrics') {
      data.metrics = monitoringService.getSystemMetrics();
    }
    
    if (type === 'all' || type === 'performance') {
      data.performance = monitoringService.getPerformanceMetrics();
    }
    
    if (type === 'all' || type === 'security') {
      data.security = monitoringService.getSecurityEvents();
    }
    
    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csv = Object.keys(data).map(key => 
        `${key}: ${JSON.stringify(data[key])}`
      ).join('\n');
      
      return {
        success: true,
        data: csv,
        format: 'csv'
      };
    }
    
    return {
      success: true,
      data,
      format: 'json'
    };
  }, {
    query: t.Object({
      type: t.Optional(t.String()),
      format: t.Optional(t.String())
    })
  });
