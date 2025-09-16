/**
 * @file React hook for managing WebSocket connections
 * This hook provides real-time communication with the notification service
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// Token cache to avoid excessive API calls
let tokenCache: { token: string; expiresAt: number } | null = null;
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiry

// Helper function to get WebSocket token from backend API with caching and refresh
async function getWebSocketToken(forceRefresh = false): Promise<string | null> {
  try {
    // Check if we have a valid cached token
    if (!forceRefresh && tokenCache && Date.now() < tokenCache.expiresAt - TOKEN_REFRESH_BUFFER) {
      return tokenCache.token;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/auth/ws-token`, {
      method: 'GET',
      credentials: 'include', // Include HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to get WebSocket token:', response.status, response.statusText);
      // Clear invalid cache
      tokenCache = null;
      return null;
    }

    const result = await response.json() as {
      success: boolean;
      data?: { token: string; expires_in: number };
      error?: string;
    };
    
    if (result.success && result.data?.token) {
      // Cache the token with expiration time
      tokenCache = {
        token: result.data.token,
        expiresAt: Date.now() + (result.data.expires_in * 1000)
      };
      return result.data.token;
    }

    console.error('Invalid WebSocket token response:', result);
    tokenCache = null;
    return null;
  } catch (error) {
    console.error('Error fetching WebSocket token:', error);
    tokenCache = null;
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
  data?: Record<string, unknown>;
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

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws/notifications';
const INITIAL_RECONNECT_INTERVAL = 1000; // Start with 1 second
const MAX_RECONNECT_INTERVAL = 30000; // Max 30 seconds
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_MULTIPLIER = 1.5; // Exponential backoff multiplier

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
          console.log('📨 Processing notification message:', message);
          if (onNotification && message.data) {
            console.log('📨 Calling onNotification callback');
            onNotification(message.data as NotificationData);
          } else {
            console.log('📨 No onNotification callback or no data');
          }
          break;
        case 'notification_count':
          console.log('📊 Processing notification count message:', message);
          if (onNotificationCount && message.data) {
            console.log('📊 Calling onNotificationCount callback');
            onNotificationCount(message.data as NotificationCountData);
          } else {
            console.log('📊 No onNotificationCount callback or no data');
          }
          break;
        case 'authenticated':
          console.log('✅ WebSocket authenticated:', message.message);
          console.log('✅ Setting isConnected to true');
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
          reconnectAttemptsRef.current = 0;
          if (onConnect) onConnect();
          break;
        // @ts-expect-error: 'auth_required' is not part of WebSocketMessage['type'] union, but may be sent by backend
        case 'auth_required':
          console.log('🔐 Authentication required');
          break;
        case 'error':
          console.error('❌ WebSocket error:', message.message);
          
          // Check if it's an authentication error and try to refresh token
          if (message.message?.includes('Authentication') || message.message?.includes('token')) {
            console.log('🔄 Authentication error, clearing token cache and reconnecting...');
            tokenCache = null; // Clear cached token
            
            // Try to reconnect with fresh token after a delay
            setTimeout(async () => {
              if (connectFunctionRef.current && !isManuallyDisconnectedRef.current) {
                await connectFunctionRef.current();
              }
            }, 2000);
          }
          
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
    console.log('🔌 WebSocket connected to:', WS_URL);
    setIsConnecting(false);
    setError(null);
    
    // Send authentication token
    const token = await getWebSocketToken();
    console.log('🔐 WebSocket token received:', token ? 'Yes' : 'No');
    if (token && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
      console.log('🔐 WebSocket authentication sent');
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
        
        // Calculate exponential backoff delay
        const baseDelay = Math.min(
          INITIAL_RECONNECT_INTERVAL * Math.pow(RECONNECT_MULTIPLIER, reconnectAttemptsRef.current - 1),
          MAX_RECONNECT_INTERVAL
        );
        
        // Add some jitter to prevent thundering herd
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        
        console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}) in ${Math.round(delay)}ms...`);
        
        reconnectTimeoutRef.current = setTimeout(async () => {
          // Use ref to avoid circular dependency
          if (connectFunctionRef.current && !isManuallyDisconnectedRef.current) {
            await connectFunctionRef.current();
          }
        }, delay);
      } else {
        console.error('❌ Max reconnection attempts reached');
        setError('Connection lost after multiple attempts. Please refresh the page.');
        // Clear token cache in case it's stale
        tokenCache = null;
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