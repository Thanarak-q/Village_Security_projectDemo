import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketNotification {
  id: string;
  title: string;
  body?: string;
  level?: 'info' | 'warning' | 'critical';
  createdAt: number;
}

interface UseWebSocketNotificationsReturn {
  notifications: WebSocketNotification[];
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (message: unknown) => void;
  clearNotifications: () => void;
}

export function useWebSocketNotifications(): UseWebSocketNotificationsReturn {
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    // Use the WebSocket URL through Caddy proxy (port 80)
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost/ws';
    console.log('🔗 Attempting to connect to:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('🔔 WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          console.log('📨 Raw event data:', event.data);

          // Handle different message types
          if (data.type === 'ADMIN_NOTIFICATION' && data.data) {
            const notification: WebSocketNotification = {
              id: data.data.id,
              title: data.data.title,
              body: data.data.body,
              level: data.data.level || 'info',
              createdAt: data.data.createdAt
            };
            
            setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
            
            // Show browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(notification.title, {
                body: notification.body,
                icon: '/favicon.ico',
                tag: notification.id
              });
            }
          } else if (data.type === 'WELCOME') {
            console.log('👋 Welcome message:', data.msg);
          } else if (data.type === 'ECHO') {
            console.log('🔄 Echo response:', data.data);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        console.error('❌ WebSocket error details:', {
          type: error.type,
          target: error.target,
          currentTarget: error.currentTarget
        });
        setConnectionStatus('error');
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
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
  }, []);

  const disconnect = useCallback(() => {
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

  const sendMessage = useCallback((message: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }, []);

  const clearNotifications = useCallback(() => {
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
    };
  }, [connect, disconnect]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📣 Notification permission:', permission);
      });
    }
  }, []);

  return {
    notifications,
    isConnected,
    connectionStatus,
    sendMessage,
    clearNotifications
  };
}
