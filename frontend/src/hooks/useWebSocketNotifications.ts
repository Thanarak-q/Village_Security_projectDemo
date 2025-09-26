import { useEffect, useRef, useCallback } from 'react';
import { useSafeState, useSafeCallback, useSafeMemo } from './useSafeState';
import { websocketMessageManager } from '../utils/websocketMessageManager';
import { websocketDiagnostics } from '../utils/websocketDiagnostics';
import { useAuth } from './useAuth';

interface WebSocketNotification {
  id: string;
  title: string;
  body?: string;
  level?: 'info' | 'warning' | 'critical';
  createdAt: number;
  type?: string;
  category?: string;
  data?: Record<string, unknown>;
  villageKey?: string;
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

type ErrorType = 'WEBSOCKET' | 'API' | 'VALIDATION' | 'NETWORK' | 'UNKNOWN';
type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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

interface UseWebSocketNotificationsOptions {
  villageKey?: string;
}

const isBrowser = typeof window !== 'undefined';

export function useWebSocketNotifications(options: UseWebSocketNotificationsOptions = {}): UseWebSocketNotificationsReturn {
  const [notifications, setNotifications] = useSafeState<WebSocketNotification[]>([]);
  const [isConnected, setIsConnected] = useSafeState(false);
  const [connectionStatus, setConnectionStatus] = useSafeState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [errorStats, setErrorStats] = useSafeState<ErrorStats>({
    total: 0,
    byType: {},
    bySeverity: {},
    retryable: 0,
    critical: 0
  });
  const [healthStatus, setHealthStatus] = useSafeState<HealthStatus>({
    status: 'HEALTHY',
    message: 'System is operating normally',
    color: 'green'
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const subscribedVillageRef = useRef<string | null>(null);

  const { villageKey: overrideVillageKey } = options;
  const { user } = useAuth();

  const resolvedVillageKey = useSafeMemo(() => {
    const fromOptions = typeof overrideVillageKey === 'string' ? overrideVillageKey.trim() : '';
    const fromUser = typeof user?.village_key === 'string' ? user.village_key.trim() : '';
    const fromSession = typeof window !== 'undefined'
      ? (() => {
          try {
            return sessionStorage.getItem('selectedVillage')?.trim() || '';
          } catch (error) {
            console.warn('⚠️ Unable to read selected village from sessionStorage:', error);
            return '';
          }
        })()
      : '';
    const fromEnv = typeof process.env.NEXT_PUBLIC_DEFAULT_VILLAGE_KEY === 'string'
      ? process.env.NEXT_PUBLIC_DEFAULT_VILLAGE_KEY.trim()
      : '';

    const resolved = fromOptions || fromUser || fromSession || fromEnv || null;

    if (!resolved) {
      console.warn('⚠️ No village key available for WebSocket subscription');
    }

    return resolved;
  }, [overrideVillageKey, user?.village_key]);

  const calculateHealthStatus = useCallback((stats: ErrorStats): HealthStatus => {
    const criticalCount = stats.bySeverity['CRITICAL'] || 0;
    if (criticalCount > 0) {
      return {
        status: 'CRITICAL',
        message: `${criticalCount} critical errors detected`,
        color: 'red'
      };
    }

    const highCount = stats.bySeverity['HIGH'] || 0;
    if (highCount > 5) {
      return {
        status: 'WARNING',
        message: `${highCount} high severity errors detected`,
        color: 'orange'
      };
    }

    return {
      status: 'HEALTHY',
      message: 'System is operating normally',
      color: 'green'
    };
  }, []);

  const recordError = useCallback((
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    context?: Record<string, unknown>,
    retryable: boolean = false
  ) => {
    const logFn = severity === 'CRITICAL' || severity === 'HIGH'
      ? console.error
      : severity === 'MEDIUM'
        ? console.warn
        : console.info;

    logFn(`[${type}] ${message}`, context);

    setErrorStats(prev => {
      const updated: ErrorStats = {
        total: prev.total + 1,
        byType: { ...prev.byType, [type]: (prev.byType[type] || 0) + 1 },
        bySeverity: { ...prev.bySeverity, [severity]: (prev.bySeverity[severity] || 0) + 1 },
        retryable: retryable ? prev.retryable + 1 : prev.retryable,
        critical: prev.critical
      };

      updated.critical = updated.bySeverity['CRITICAL'] || 0;
      setHealthStatus(calculateHealthStatus(updated));
      return updated;
    });
  }, [calculateHealthStatus]);

  const handleWebSocketError = useCallback((
    error: Event | Error | string,
    context?: Record<string, unknown>
  ) => {
    const message = error instanceof Error ? error.message : typeof error === 'string'
      ? error
      : 'WebSocket connection error';
    recordError('WEBSOCKET', 'HIGH', message, context, true);
  }, [recordError]);

  const handleValidationError = useCallback((
    error: Error | string,
    field?: string,
    context?: Record<string, unknown>
  ) => {
    const message = error instanceof Error ? error.message : error;
    const details = field ? { ...context, field } : context;
    recordError('VALIDATION', 'LOW', message, details, false);
  }, [recordError]);

  const subscribeToVillage = useCallback((ws: WebSocket, villageKey: string) => {
    const trimmedKey = villageKey.trim();

    if (!trimmedKey) {
      console.warn('⚠️ Attempted to subscribe with empty village key');
      return;
    }

    try {
      ws.send(JSON.stringify({
        type: 'SUBSCRIBE_ADMIN',
        data: { villageKey: trimmedKey }
      }));
      subscribedVillageRef.current = trimmedKey;
      console.log(`🪪 Requested admin subscription for village ${trimmedKey}`);
    } catch (error) {
      console.error('❌ Failed to send subscription request:', error);
      handleWebSocketError(
        error instanceof Error ? error : new Error('Subscription request failed'),
        { messageType: 'subscribe_admin', villageKey: trimmedKey }
      );
    }
  }, [handleWebSocketError]);

  const getWebSocketUrl = useSafeCallback(() => {
    if (!isBrowser) {
      return process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3002/ws';
    }

    const overrideUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();
    if (overrideUrl) {
      return overrideUrl;
    }

    const currentHost = window.location.host;
    const hostname = window.location.hostname;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    const localDevMatch = currentHost.match(/:(\d+)$/);
    if (localDevMatch) {
      const port = localDevMatch[1];
      if (['3000', '5173', '4173'].includes(port)) {
        const proxyHost = process.env.NEXT_PUBLIC_WS_PROXY_HOST?.trim();
        if (proxyHost) {
          return `${wsProtocol}//${proxyHost}/ws`;
        }

        const devPort = process.env.NEXT_PUBLIC_WS_DEV_PORT?.trim();
        if (devPort) {
          return `${wsProtocol}//${hostname}:${devPort}/ws`;
        }

        // Default to Caddy (or any reverse proxy) on the same hostname.
        return `${wsProtocol}//${hostname}/ws`;
      }
    }

    return `${wsProtocol}//${currentHost}/ws`;
  }, []);

  const connect = useSafeCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    const wsUrl = getWebSocketUrl();
    
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
        console.log('🔔 WebSocket connected successfully');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        // Update message manager connection status
        websocketMessageManager.setWebSocket(ws);

        if (resolvedVillageKey) {
          console.log('🪪 Subscribing to village:', resolvedVillageKey);
          subscribeToVillage(ws, resolvedVillageKey);
        } else {
          console.warn('⚠️ No village key available for WebSocket subscription');
        }
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
              createdAt: data.data.createdAt || Date.now(),
              type: data.data.type,
              category: data.data.category,
              data: data.data.data,
              villageKey: data.data.villageKey
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
          const filtered = newNotifications.filter(n => n.createdAt > oneDayAgo);

              return filtered;
            });

            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('dashboardRealtimeNotification', {
                detail: notification
              }));
            }
            
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
          } else if (data.type === 'SUBSCRIBED_ADMIN') {
            if (data.villageKey) {
              subscribedVillageRef.current = data.villageKey;
              console.log('✅ Subscription confirmed for village:', data.villageKey);
            } else {
              console.warn('⚠️ Subscription confirmation received without village key');
            }
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
        console.log('🔌 WebSocket disconnected:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          reconnectAttempts: reconnectAttempts.current
        });
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Update message manager connection status
        websocketMessageManager.setWebSocket(null);
        
        // Attempt to reconnect if not a manual close and we haven't exceeded max attempts
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached. WebSocket will not reconnect automatically.');
        }
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setConnectionStatus('error');
      return;
    }
  }, [getWebSocketUrl, handleValidationError, handleWebSocketError, resolvedVillageKey, subscribeToVillage]);

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

  useEffect(() => {
    if (!resolvedVillageKey) {
      subscribedVillageRef.current = null;
      return;
    }

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && subscribedVillageRef.current !== resolvedVillageKey) {
      subscribeToVillage(ws, resolvedVillageKey);
    }
  }, [resolvedVillageKey, subscribeToVillage]);

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
