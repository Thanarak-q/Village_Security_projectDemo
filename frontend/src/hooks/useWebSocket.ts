/**
 * @file WebSocket hook for real-time notifications
 * This hook manages WebSocket connection and handles real-time notification updates
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface WebSocketMessage {
  type: 'notification' | 'notification_count' | 'authenticated' | 'error' | 'pong';
  data?: any;
  message?: string;
}

interface UseWebSocketOptions {
  onNotification?: (notification: any) => void;
  onNotificationCount?: (counts: { total: number; unread: number }) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sendMessage: (message: any) => void;
  reconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const {
    onNotification,
    onNotificationCount,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Get JWT token from localStorage or cookies
      const token = localStorage.getItem('token') || 
                   document.cookie
                     .split('; ')
                     .find(row => row.startsWith('token='))
                     ?.split('=')[1];

      if (!token) {
        setError('No authentication token found');
        setIsConnecting(false);
        return;
      }

      // Determine WebSocket URL for Docker environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host; // Use current host (Docker will handle routing)
      const wsUrl = `${protocol}//${host}/ws/notifications?token=${encodeURIComponent(token)}`;

      console.log('🔌 Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);

          switch (message.type) {
            case 'notification':
              onNotification?.(message.data);
              break;
            case 'notification_count':
              onNotificationCount?.(message.data);
              break;
            case 'authenticated':
              console.log('🔐 WebSocket authenticated successfully');
              break;
            case 'error':
              console.error('❌ WebSocket error:', message.message);
              onError?.(message.message || 'Unknown error');
              break;
            case 'pong':
              // Handle pong response
              break;
            default:
              console.log('📨 Unknown WebSocket message type:', message.type);
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err);
          onError?.('Failed to parse WebSocket message');
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        onDisconnect?.();

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttemptsRef.current);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Failed to reconnect after multiple attempts');
        }
      };

      ws.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnecting(false);
        onError?.('WebSocket connection error');
      };

    } catch (err) {
      console.error('❌ Error creating WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [onNotification, onNotificationCount, onError, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        console.log('📤 WebSocket message sent:', message);
      } catch (err) {
        console.error('❌ Error sending WebSocket message:', err);
        onError?.('Failed to send WebSocket message');
      }
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
      onError?.('WebSocket not connected');
    }
  }, [onError]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  // Ping the server every 30 seconds to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);

  // Connect on mount and disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    reconnect,
  };
}
