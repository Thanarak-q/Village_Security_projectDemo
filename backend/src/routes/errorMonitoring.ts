/**
 * @file Error Monitoring API Routes
 * Provides endpoints for monitoring system health and error metrics
 */

import { Elysia, t } from 'elysia';
import { errorMonitor } from '../utils/errorMonitoring';
import { errorHandler } from '../utils/errorHandler';
import { errorRecoveryManager } from '../utils/errorRecovery';
import { requireRole } from '../hooks/requireRole';

export const errorMonitoringRoutes = new Elysia({ prefix: '/api/monitoring' })
  .onBeforeHandle(requireRole(['admin', 'superadmin']))

  // GET /api/monitoring/health - Get system health status
  .get('/health', async () => {
    try {
      const health = errorMonitor.getHealthStatus();
      const metrics = errorMonitor.getMetrics();
      const recoveryStats = errorRecoveryManager.getRecoveryStats();
      const errorStats = errorHandler.getErrorStats();

      return {
        success: true,
        data: {
          health,
          metrics,
          recovery: recoveryStats,
          errorStats,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Error fetching health status:', error);
      return {
        success: false,
        error: 'Failed to fetch health status',
        timestamp: new Date().toISOString()
      };
    }
  })

  // GET /api/monitoring/metrics - Get detailed error metrics
  .get('/metrics', async () => {
    try {
      const metrics = errorMonitor.getMetrics();
      const errorStats = errorHandler.getErrorStats();

      return {
        success: true,
        data: {
          metrics,
          errorStats,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Error fetching metrics:', error);
      return {
        success: false,
        error: 'Failed to fetch metrics',
        timestamp: new Date().toISOString()
      };
    }
  })

  // GET /api/monitoring/errors - Get recent error history
  .get('/errors', async ({ query }) => {
    try {
      const limit = parseInt(query.limit as string) || 50;
      const errors = errorMonitor.getErrorHistory(limit);

      return {
        success: true,
        data: {
          errors: errors.map(error => error.toJSON()),
          count: errors.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Error fetching error history:', error);
      return {
        success: false,
        error: 'Failed to fetch error history',
        timestamp: new Date().toISOString()
      };
    }
  }, {
    query: t.Object({
      limit: t.Optional(t.String())
    })
  })

  // GET /api/monitoring/report - Generate comprehensive error report
  .get('/report', async () => {
    try {
      const report = errorMonitor.generateReport();
      const health = errorMonitor.getHealthStatus();
      const metrics = errorMonitor.getMetrics();

      return {
        success: true,
        data: {
          report,
          health,
          metrics,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Error generating report:', error);
      return {
        success: false,
        error: 'Failed to generate report',
        timestamp: new Date().toISOString()
      };
    }
  })

  // POST /api/monitoring/reset - Reset error counts (admin only)
  .post('/reset', async () => {
    try {
      errorHandler.resetErrorCounts();
      
      return {
        success: true,
        message: 'Error counts reset successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error resetting error counts:', error);
      return {
        success: false,
        error: 'Failed to reset error counts',
        timestamp: new Date().toISOString()
      };
    }
  })

  // POST /api/monitoring/start - Start error monitoring
  .post('/start', async ({ body }) => {
    try {
      const intervalMs = (body as any)?.intervalMs || 60000;
      errorMonitor.startMonitoring(intervalMs);
      
      return {
        success: true,
        message: `Error monitoring started with ${intervalMs}ms interval`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error starting monitoring:', error);
      return {
        success: false,
        error: 'Failed to start monitoring',
        timestamp: new Date().toISOString()
      };
    }
  })

  // POST /api/monitoring/stop - Stop error monitoring
  .post('/stop', async () => {
    try {
      errorMonitor.stopMonitoring();
      
      return {
        success: true,
        message: 'Error monitoring stopped',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error stopping monitoring:', error);
      return {
        success: false,
        error: 'Failed to stop monitoring',
        timestamp: new Date().toISOString()
      };
    }
  })

  // GET /api/monitoring/alerts - Get alert configuration
  .get('/alerts', async () => {
    try {
      // This would return current alert rules in a real implementation
      return {
        success: true,
        data: {
          alerts: [
            {
              id: 'critical_error_spike',
              name: 'Critical Error Spike',
              severity: 'CRITICAL',
              enabled: true
            },
            {
              id: 'high_error_rate',
              name: 'High Error Rate',
              severity: 'HIGH',
              enabled: true
            },
            {
              id: 'websocket_errors',
              name: 'WebSocket Error Spike',
              severity: 'HIGH',
              enabled: true
            },
            {
              id: 'database_errors',
              name: 'Database Error Spike',
              severity: 'HIGH',
              enabled: true
            }
          ],
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Error fetching alerts:', error);
      return {
        success: false,
        error: 'Failed to fetch alerts',
        timestamp: new Date().toISOString()
      };
    }
  });
