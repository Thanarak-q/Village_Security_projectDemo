import { useEffect, useRef } from 'react';
import { useErrorHandling } from './useErrorHandling';
import { useSafeState, useSafeCallback, useSafeMemo } from './useSafeState';
import { websocketMessageManager } from '../utils/websocketMessageManager';
import { websocketDiagnostics } from '../utils/websocketDiagnostics';

interface WebSocketNotification {
  id: string;
  title: string;
  body?: string;
  level?: 'info' | 'warning' | 'critical';
  createdAt: number;
}

interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  retryable: number;
  critical: number;
}

interface HealthStatus {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  message: string;
  color: string;
}

interface UseWebSocketNotificationsReturn {
  notifications: WebSocketNotification[];
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (message: unknown) => void;
  clearNotifications: () => void;
  errorStats: ErrorStats;
  healthStatus: HealthStatus;
  queueStatus: {
    size: number;
    processing: boolean;
    oldestMessage?: number;
    newestMessage?: number;
    priorityCounts: Record<string, number>;
  };
}

export function useWebSocketNotifications(): UseWebSocketNotificationsReturn {
  const [notifications, setNotifications] = useSafeState<WebSocketNotification[]>([]);
  const [isConnected, setIsConnected] = useSafeState(false);
  const [connectionStatus, setConnectionStatus] = useSafeState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize error handling
  const {
    handleWebSocketError,
    handleValidationError,
    getErrorStats,
    getHealthStatus
  } = useErrorHandling({
    maxErrors: 50,
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 2000,
    showNotifications: true
  });

  const connect = useSafeCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    // Use the WebSocket URL through Caddy proxy (port 80)
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost/ws';
    console.log('🔗 Attempting to connect to:', wsUrl);
    
    // Update diagnostics
    websocketDiagnostics.updateConnection(wsUrl, null);
    websocketDiagnostics.updateReconnectAttempts(reconnectAttempts.current, maxReconnectAttempts);
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      // Update diagnostics with new connection
      websocketDiagnostics.updateConnection(wsUrl, ws);
      
      // Set up message manager
      websocketMessageManager.setWebSocket(ws);
      
      ws.onopen = () => {
        console.log('🔔 WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        // Update message manager connection status
        websocketMessageManager.setWebSocket(ws);
      };

      ws.onmessage = (event) => {
        try {
          // Validate event data
          if (!event.data) {
            console.warn('⚠️ Received empty WebSocket message');
            return;
          }

          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);

          // Validate message structure
          if (!data || typeof data !== 'object') {
            console.warn('⚠️ Invalid message structure received:', data);
            return;
          }

          // Handle different message types
          if (data.type === 'ADMIN_NOTIFICATION' && data.data) {
          // Validate notification data structure
          if (!data.data.id || !data.data.title) {
            console.warn('⚠️ Invalid notification structure:', data.data);
            handleValidationError(
              'Invalid notification structure received',
              'notification',
              { receivedData: data.data }
            );
            return;
          }

            const notification: WebSocketNotification = {
              id: data.data.id,
              title: data.data.title,
              body: data.data.body || '',
              level: data.data.level || 'info',
              createdAt: data.data.createdAt || Date.now()
            };
            
            // Check for duplicates before adding
            setNotifications(prev => {
              const exists = prev.some(n => n.id === notification.id);
              if (exists) {
                console.log('📨 Duplicate notification ignored:', notification.id);
                return prev;
              }
              
              // Keep only last 50 notifications and limit memory usage
              const newNotifications = [notification, ...prev].slice(0, 50);
              
              // Clean up old notifications (older than 24 hours)
              const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
              return newNotifications.filter(n => n.createdAt > oneDayAgo);
            });
            
            // Show browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(notification.title, {
                  body: notification.body,
                  icon: '/favicon.ico',
                  tag: notification.id
                });
              } catch (notificationError) {
                console.error('❌ Failed to show browser notification:', notificationError);
              }
            }
          } else if (data.type === 'WELCOME') {
            console.log('👋 Welcome message:', data.msg);
          } else if (data.type === 'ECHO') {
            console.log('🔄 Echo response:', data.data);
          } else if (data.type === 'ERROR') {
            console.error('❌ WebSocket server error:', data.error);
            setConnectionStatus('error');
          } else if (data.type === 'PONG') {
            console.log('🏓 Pong received from server');
          } else {
            console.warn('⚠️ Unknown message type received:', data.type);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
          handleWebSocketError(
            error instanceof Error ? error : new Error('Message parsing failed'),
            {
              messageType: 'unknown',
              rawData: event.data?.substring(0, 100)
            }
          );
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        
        // Get more detailed error information
        const errorDetails = {
          type: error.type || 'unknown',
          target: error.target ? 'WebSocket' : 'unknown',
          currentTarget: error.currentTarget ? 'WebSocket' : 'unknown',
          readyState: ws.readyState,
          url: wsUrl,
          timestamp: new Date().toISOString(),
          reconnectAttempts: reconnectAttempts.current,
          maxReconnectAttempts
        };
        
        console.error('❌ WebSocket error details:', errorDetails);
        
        // Update diagnostics with error
        websocketDiagnostics.setLastError(`WebSocket error: ${errorDetails.type} (readyState: ${errorDetails.readyState})`);
        websocketDiagnostics.logDiagnostics();
        
        setConnectionStatus('error');
        
        // Create a more descriptive error
        const webSocketError = new Error(`WebSocket connection failed: ${errorDetails.type} (readyState: ${errorDetails.readyState})`);
        
        // Handle error with comprehensive error handling
        handleWebSocketError(webSocketError, errorDetails);
        
        // Attempt to reconnect on error
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 Reconnecting after error in ${delay}ms`);
          
          setTimeout(() => {
            reconnectAttempts.current++;
            websocketDiagnostics.updateReconnectAttempts(reconnectAttempts.current, maxReconnectAttempts);
            connect();
          }, delay);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Update message manager connection status
        websocketMessageManager.setWebSocket(null);
        
        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setConnectionStatus('error');
      return;
    }
  }, [handleValidationError, handleWebSocketError]);

  const disconnect = useSafeCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useSafeCallback((message: unknown) => {
    try {
      // Use message manager for queuing and deduplication
      const messageId = websocketMessageManager.sendMessage(
        'USER_MESSAGE',
        message,
        {
          priority: 'normal',
          maxRetries: 3,
          metadata: { source: 'user' }
        }
      );
      
      console.log(`📤 Message queued/sent: ${messageId}`);
    } catch (error) {
      handleWebSocketError(
        error instanceof Error ? error : new Error('Failed to send message'),
        { messageType: 'user_message' }
      );
    }
  }, [handleWebSocketError]);

  const clearNotifications = useSafeCallback(() => {
    setNotifications([]);
  }, []);

  // Connect on mount with a small delay to avoid race conditions
  useEffect(() => {
    const timer = setTimeout(() => {
      connect();
    }, 1000); // Wait 1 second before connecting
    
    return () => {
      clearTimeout(timer);
      disconnect();
      // Clear notifications on unmount to prevent memory leaks
      setNotifications([]);
    };
  }, [connect, disconnect, setNotifications]);

  // Periodic cleanup of old notifications
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setNotifications(prev => {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const filtered = prev.filter(n => n.createdAt > oneDayAgo);
        
        if (filtered.length !== prev.length) {
          console.log(`🧹 Cleaned up ${prev.length - filtered.length} old notifications`);
        }
        
        return filtered;
      });
    }, 60000); // Run cleanup every minute

    return () => clearInterval(cleanupInterval);
  }, [setNotifications]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📣 Notification permission:', permission);
      });
    }
  }, []);

  // Memoize error stats and health status to prevent infinite re-renders
  const errorStats = useSafeMemo(() => getErrorStats, [getErrorStats]);
  const healthStatus = useSafeMemo(() => getHealthStatus as HealthStatus, [getHealthStatus]);
  const queueStatus = useSafeMemo(() => websocketMessageManager.getQueueStatus(), []);

  return {
    notifications,
    isConnected,
    connectionStatus,
    sendMessage,
    clearNotifications,
    errorStats,
    healthStatus,
    queueStatus
  };
}
