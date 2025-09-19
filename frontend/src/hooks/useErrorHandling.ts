/**
 * @file Frontend Error Handling Hook
 * Provides comprehensive error handling for the frontend application
 */

import { useState, useCallback, useEffect, useMemo } from 'react';

export interface ErrorInfo {
  id: string;
  message: string;
  type: 'WEBSOCKET' | 'API' | 'VALIDATION' | 'NETWORK' | 'UNKNOWN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  context?: Record<string, unknown>;
  retryable: boolean;
  retryCount?: number;
}

export interface ErrorHandlerOptions {
  maxErrors: number;
  autoRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  showNotifications: boolean;
  logToConsole: boolean;
}

const defaultOptions: ErrorHandlerOptions = {
  maxErrors: 100,
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  showNotifications: true,
  logToConsole: true
};

export function useErrorHandling(options: Partial<ErrorHandlerOptions> = {}) {
  const config = { ...defaultOptions, ...options };
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);

  const generateErrorId = () => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const createError = useCallback((
    message: string,
    type: ErrorInfo['type'],
    severity: ErrorInfo['severity'] = 'MEDIUM',
    context?: Record<string, any>,
    retryable: boolean = false
  ): ErrorInfo => {
    return {
      id: generateErrorId(),
      message,
      type,
      severity,
      timestamp: new Date().toISOString(),
      context,
      retryable,
      retryCount: 0
    };
  }, []);

  const addError = useCallback((error: ErrorInfo) => {
    setErrors(prev => {
      const newErrors = [error, ...prev].slice(0, config.maxErrors);
      
      if (config.logToConsole) {
        const logLevel = error.severity === 'CRITICAL' ? 'error' : 
                        error.severity === 'HIGH' ? 'error' : 
                        error.severity === 'MEDIUM' ? 'warn' : 'info';
        
        // Safely log error information
        const errorInfo = {
          type: error.type || 'UNKNOWN',
          message: error.message || 'Unknown error',
          context: error.context || {},
          timestamp: error.timestamp || new Date().toISOString(),
          severity: error.severity || 'MEDIUM'
        };
        
        console[logLevel](`🚨 Error [${errorInfo.severity}]:`, errorInfo);
      }

      if (config.showNotifications && error.severity !== 'LOW') {
        // Show browser notification for important errors
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Error: ${error.type}`, {
            body: error.message,
            icon: '/favicon.ico',
            tag: error.id
          });
        }
      }

      return newErrors;
    });

    // Auto-retry if enabled and error is retryable
    if (config.autoRetry && error.retryable && (error.retryCount || 0) < config.maxRetries) {
      setTimeout(() => {
        retryError(error.id);
      }, config.retryDelay * ((error.retryCount || 0) + 1));
    }
  }, [config, errors]);

  const handleError = useCallback((
    error: Error | string,
    type: ErrorInfo['type'] = 'UNKNOWN',
    severity: ErrorInfo['severity'] = 'MEDIUM',
    context?: Record<string, unknown>,
    retryable: boolean = false
  ) => {
    const message = error instanceof Error ? error.message : error;
    const errorInfo = createError(message, type, severity, context, retryable);
    addError(errorInfo);
    return errorInfo;
  }, [createError, addError]);

  const retryError = useCallback(async (errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (!error || !error.retryable) return;

    setIsRetrying(true);
    
    try {
      // Update retry count
      setErrors(prev => prev.map(e => 
        e.id === errorId 
          ? { ...e, retryCount: (e.retryCount || 0) + 1 }
          : e
      ));

      // Simulate retry logic - in real app, this would retry the actual operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`🔄 Retrying error: ${errorId} (attempt ${(error.retryCount || 0) + 1})`);
      
    } catch (retryError) {
      console.error('❌ Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  }, [errors]);

  const clearError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(e => e.id !== errorId));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const getErrorsByType = useCallback((type: ErrorInfo['type']) => {
    return errors.filter(e => e.type === type);
  }, [errors]);

  const getErrorsBySeverity = useCallback((severity: ErrorInfo['severity']) => {
    return errors.filter(e => e.severity === severity);
  }, [errors]);

  const getErrorStats = useMemo(() => {
    const stats = {
      total: errors.length,
      byType: {} as Record<ErrorInfo['type'], number>,
      bySeverity: {} as Record<ErrorInfo['severity'], number>,
      retryable: errors.filter(e => e.retryable).length,
      critical: errors.filter(e => e.severity === 'CRITICAL').length
    };

    errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }, [errors]);

  const getHealthStatus = useMemo(() => {
    const criticalErrors = errors.filter(e => e.severity === 'CRITICAL').length;
    const highErrors = errors.filter(e => e.severity === 'HIGH').length;
    
    if (criticalErrors > 0) {
      return {
        status: 'CRITICAL',
        message: `${criticalErrors} critical errors detected`,
        color: 'red'
      };
    }
    
    if (highErrors > 5) {
      return {
        status: 'WARNING',
        message: `${highErrors} high severity errors detected`,
        color: 'orange'
      };
    }
    
    return {
      status: 'HEALTHY',
      message: 'System is operating normally',
      color: 'green'
    };
  }, [errors]);

  // Clean up old errors periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      setErrors(prev => prev.filter(error => 
        new Date(error.timestamp) > oneHourAgo
      ));
    }, 60000); // Clean up every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // WebSocket error handling
  const handleWebSocketError = useCallback((
    error: Event | Error,
    context?: Record<string, unknown>
  ) => {
    const message = error instanceof Error ? error.message : 'WebSocket connection error';
    return handleError(message, 'WEBSOCKET', 'HIGH', context, true);
  }, [handleError]);

  // API error handling
  const handleApiError = useCallback((
    error: Error | string,
    statusCode?: number,
    context?: Record<string, unknown>
  ) => {
    const message = error instanceof Error ? error.message : error;
    const severity = statusCode && statusCode >= 500 ? 'HIGH' : 'MEDIUM';
    return handleError(message, 'API', severity, { ...context, statusCode }, true);
  }, [handleError]);

  // Validation error handling
  const handleValidationError = useCallback((
    error: Error | string,
    field?: string,
    context?: Record<string, unknown>
  ) => {
    const message = error instanceof Error ? error.message : error;
    return handleError(message, 'VALIDATION', 'LOW', { ...context, field }, false);
  }, [handleError]);

  // Network error handling
  const handleNetworkError = useCallback((
    error: Error | string,
    context?: Record<string, unknown>
  ) => {
    const message = error instanceof Error ? error.message : error;
    return handleError(message, 'NETWORK', 'HIGH', context, true);
  }, [handleError]);

  return {
    errors,
    isRetrying,
    addError,
    handleError,
    handleWebSocketError,
    handleApiError,
    handleValidationError,
    handleNetworkError,
    retryError,
    clearError,
    clearAllErrors,
    getErrorsByType,
    getErrorsBySeverity,
    getErrorStats,
    getHealthStatus,
    createError
  };
}
