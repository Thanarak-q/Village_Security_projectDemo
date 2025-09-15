/**
 * @file React hook for managing WebSocket connections
 * This hook provides real-time communication with the notification service
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// Helper function to get WebSocket token from backend API
async function getWebSocketToken(): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/auth/ws-token`, {
      method: 'GET',
      credentials: 'include', // Include HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to get WebSocket token:', response.status, response.statusText);
      return null;
    }

    const result = await response.json() as {
      success: boolean;
      data?: { token: string; expires_in: number };
      error?: string;
    };
    
    if (result.success && result.data?.token) {
      return result.data.token;
    }

    console.error('Invalid WebSocket token response:', result);
    return null;
  } catch (error) {
    console.error('Error fetching WebSocket token:', error);
    return null;
  }
}

interface WebSocketMessage {
  type: 'notification' | 'notification_count' | 'authenticated' | 'error' | 'pong';
  data?: NotificationData | NotificationCountData;
  message?: string;
}

interface NotificationData {
  notification_id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  priority: string;
  created_at: string;
  read_at?: string;
  village_name?: string;
}

interface NotificationCountData {
  total: number;
  unread: number;
}

interface UseWebSocketOptions {
  onNotification?: (notification: NotificationData) => void;
  onNotificationCount?: (counts: NotificationCountData) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
  autoReconnect?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: Record<string, unknown>) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost/ws/notifications';
const RECONNECT_INTERVAL = 5000; // 5 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    onNotification,
    onNotificationCount,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true
  } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isManuallyDisconnectedRef = useRef(false);
  const connectFunctionRef = useRef<(() => Promise<void>) | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);


  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      console.log('📨 Received WebSocket message:', event.data);
      const message: WebSocketMessage = JSON.parse(event.data);
      setLastMessage(message);

      switch (message.type) {
        case 'notification':
          if (onNotification && message.data) {
            onNotification(message.data as NotificationData);
          }
          break;
        case 'notification_count':
          if (onNotificationCount && message.data) {
            onNotificationCount(message.data as NotificationCountData);
          }
          break;
        case 'authenticated':
          console.log('✅ WebSocket authenticated:', message.message);
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
          reconnectAttemptsRef.current = 0;
          if (onConnect) onConnect();
          break;
        case 'auth_required':
          console.log('🔐 Authentication required');
          break;
        case 'error':
          console.error('❌ WebSocket error:', message.message);
          setError(message.message || 'WebSocket error');
          if (onError) onError(message.message || 'WebSocket error');
          break;
        case 'pong':
          // Handle ping/pong for keep-alive
          break;
        default:
          console.log('📨 Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      console.error('Raw message data:', event.data);
      setError('Failed to parse message');
    }
  }, [onNotification, onNotificationCount, onConnect, onError]);

  const handleOpen = useCallback(async () => {
    console.log('🔌 WebSocket connected');
    setIsConnecting(false);
    setError(null);
    
    // Send authentication token
    const token = await getWebSocketToken();
    if (token && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
    }
    
    // Send ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds

    // Store ping interval reference
    if (wsRef.current) {
      (wsRef.current as WebSocket & { pingInterval?: NodeJS.Timeout }).pingInterval = pingInterval;
    }
  }, []);

  const handleClose = useCallback(() => {
    console.log('🔌 WebSocket disconnected');
    setIsConnected(false);
    setIsConnecting(false);
    
    // Clear ping interval
    if (wsRef.current && (wsRef.current as WebSocket & { pingInterval?: NodeJS.Timeout }).pingInterval) {
      clearInterval((wsRef.current as WebSocket & { pingInterval?: NodeJS.Timeout }).pingInterval);
    }
    
    if (onDisconnect) onDisconnect();

    // Auto-reconnect if not manually disconnected
    if (autoReconnect && !isManuallyDisconnectedRef.current) {
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++;
        console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
        
        reconnectTimeoutRef.current = setTimeout(async () => {
          // Use ref to avoid circular dependency
          if (connectFunctionRef.current && !isManuallyDisconnectedRef.current) {
            await connectFunctionRef.current();
          }
        }, RECONNECT_INTERVAL);
      } else {
        console.error('❌ Max reconnection attempts reached');
        setError('Connection lost. Please refresh the page.');
      }
    }
  }, [autoReconnect, onDisconnect]);

  const handleError = useCallback((event: Event) => {
    console.error('❌ WebSocket error event:', event);
    setError('WebSocket connection error');
    setIsConnecting(false);
    if (onError) onError('WebSocket connection error');
  }, [onError]);

  const connect = useCallback(async (): Promise<void> => {
    const token = await getWebSocketToken();
    if (!token) {
      setError('No authentication token available - Please login first');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket already connected');
      return;
    }

    if (isConnecting) {
      console.log('🔌 WebSocket connection already in progress');
      return;
    }

    clearReconnectTimeout();
    setIsConnecting(true);
    setError(null);
    isManuallyDisconnectedRef.current = false;

    try {
        wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = handleOpen;
      wsRef.current.onmessage = handleMessage;
      wsRef.current.onclose = handleClose;
      wsRef.current.onerror = handleError;

      console.log('🔌 Connecting to WebSocket...', WS_URL);
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [isConnecting, handleOpen, handleMessage, handleClose, handleError, clearReconnectTimeout]);

  // Store connect function in ref to avoid circular dependency
  useEffect(() => {
    connectFunctionRef.current = connect;
  }, [connect]);


  const disconnect = useCallback(() => {
    isManuallyDisconnectedRef.current = true;
    clearReconnectTimeout();
    
    if (wsRef.current) {
      // Clear ping interval
      const wsWithInterval = wsRef.current as WebSocket & { pingInterval?: NodeJS.Timeout };
      if (wsWithInterval.pingInterval) {
        clearInterval(wsWithInterval.pingInterval);
      }
      
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, [clearReconnectTimeout]);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected. Message not sent:', message);
    }
  }, []);

  // Auto-connect when component mounts
  useEffect(() => {
    if (!isConnected && !isConnecting && connectFunctionRef.current) {
      connectFunctionRef.current();
    }
  }, [isConnected, isConnecting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    lastMessage,
    sendMessage,
    connect,
    disconnect
  };
}