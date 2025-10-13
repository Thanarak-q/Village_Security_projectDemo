/**
 * @file Monitoring Dashboard Component
 * Real-time system monitoring and metrics display
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface SystemMetrics {
  timestamp: string;
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

interface SystemHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  issues: string[];
  recommendations: string[];
}

interface PerformanceStats {
  averageResponseTime: number;
  totalRequests: number;
  errorRate: number;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
    avgResponseTime: number;
  }>;
}

interface SecurityStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  recentEvents: Array<{
    type: string;
    adminId?: string;
    ip: string;
    userAgent: string;
    timestamp: string;
    details: Record<string, unknown>;
  }>;
  suspiciousActivity: Array<{
    type: string;
    adminId?: string;
    ip: string;
    userAgent: string;
    timestamp: string;
    details: Record<string, unknown>;
  }>;
}

interface MonitoringDashboardProps {
  className?: string;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  className = ''
}) => {
  const { user, loading: authLoading } = useAuth();
  const isAdminUser = Boolean(user && (user.role === 'admin' || user.role === 'superadmin'));
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [performance, setPerformance] = useState<PerformanceStats | null>(null);
  const [security, setSecurity] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMonitoringData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const [healthRes, metricsRes, performanceRes, securityRes] = await Promise.all([
        fetch('/api/monitoring/health', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/monitoring/metrics', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/monitoring/performance', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/monitoring/security', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData.data);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.data.latest);
      }

      if (performanceRes.ok) {
        const performanceData = await performanceRes.json();
        setPerformance(performanceData.data.stats);
      }

      if (securityRes.ok) {
        const securityData = await securityRes.json();
        setSecurity(securityData.data);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdminUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchMonitoringData();

    let interval: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      interval = setInterval(fetchMonitoringData, 30000); // 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, isAdminUser]);

  if (authLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Check if user has admin role
  if (!isAdminUser) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p>You need admin privileges to access monitoring dashboard.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600 bg-green-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p>{error}</p>
          <button
            onClick={fetchMonitoringData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          System Monitoring Dashboard
        </h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Auto Refresh</span>
          </label>
          <button
            onClick={fetchMonitoringData}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* System Health */}
      {health && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">System Health</h3>
          <div className={`px-4 py-2 rounded-lg ${getStatusColor(health.status)}`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{health.status}</span>
              <span className="text-sm">
                {health.issues.length} issues, {health.recommendations.length} recommendations
              </span>
            </div>
          </div>
          
          {health.issues.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-red-600 mb-2">Issues:</h4>
              <ul className="list-disc list-inside text-sm text-red-600">
                {health.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          
          {health.recommendations.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-blue-600 mb-2">Recommendations:</h4>
              <ul className="list-disc list-inside text-sm text-blue-600">
                {health.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Uptime</h4>
            <p className="text-2xl font-semibold text-gray-800">
              {formatUptime(metrics.uptime)}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Memory Usage</h4>
            <p className="text-2xl font-semibold text-gray-800">
              {metrics.memory.percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 mb-2">CPU Load</h4>
            <p className="text-2xl font-semibold text-gray-800">
              {metrics.cpu.loadAverage[0].toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">1min average</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 mb-2">WebSocket</h4>
            <p className="text-2xl font-semibold text-gray-800">
              {metrics.websocket.connections}
            </p>
            <p className="text-xs text-gray-500">
              {metrics.websocket.messages} messages, {metrics.websocket.errors} errors
            </p>
          </div>
        </div>
      )}

      {/* Performance Stats */}
      {performance && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Avg Response Time</h4>
              <p className="text-2xl font-semibold text-gray-800">
                {performance.averageResponseTime.toFixed(2)}ms
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total Requests</h4>
              <p className="text-2xl font-semibold text-gray-800">
                {performance.totalRequests.toLocaleString()}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Error Rate</h4>
              <p className="text-2xl font-semibold text-gray-800">
                {performance.errorRate.toFixed(2)}%
              </p>
            </div>
          </div>
          
          {performance.topEndpoints.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Top Endpoints</h4>
              <div className="space-y-2">
                {performance.topEndpoints.slice(0, 5).map((endpoint, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-mono">{endpoint.endpoint}</span>
                    <span className="text-gray-500">
                      {endpoint.count} requests, {endpoint.avgResponseTime.toFixed(2)}ms avg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Stats */}
      {security && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Security</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total Events</h4>
              <p className="text-2xl font-semibold text-gray-800">
                {security.totalEvents}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Suspicious Activity</h4>
              <p className="text-2xl font-semibold text-red-600">
                {security.suspiciousActivity.length}
              </p>
            </div>
          </div>
          
          {Object.keys(security.eventsByType).length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Events by Type</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(security.eventsByType).map(([type, count]) => (
                  <div key={type} className="bg-gray-50 p-2 rounded text-center">
                    <p className="text-sm font-medium text-gray-800">{count}</p>
                    <p className="text-xs text-gray-600">{type}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;
