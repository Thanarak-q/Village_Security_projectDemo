import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from './useNotifications';
import { useWebSocketNotifications } from './useWebSocketNotifications';
import type { Notification } from '@/lib/notifications';

interface HybridNotification extends Notification {
  isRealtime?: boolean; // Flag to indicate if this came from WebSocket
}

interface UseHybridNotificationsReturn {
  notifications: HybridNotification[];
  counts: { total: number; unread: number } | null;
  loading: boolean;
  error: string | null;
  isWebSocketConnected: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotificationById: (notificationId: string) => Promise<void>;
}

export function useHybridNotifications() {
  // HTTP-based notifications (existing system)
  const {
    notifications: httpNotifications,
    counts: httpCounts,
    loading: httpLoading,
    error: httpError,
    refreshNotifications: refreshHttpNotifications,
    markAsRead: markAsReadHttp,
    markAllAsRead: markAllAsReadHttp,
    deleteNotificationById: deleteNotificationHttp
  } = useNotifications();

  // WebSocket-based notifications (real-time)
  const {
    notifications: wsNotifications,
    isConnected: isWebSocketConnected,
    connectionStatus
  } = useWebSocketNotifications();

  const [notifications, setNotifications] = useState<HybridNotification[]>([]);
  const [counts, setCounts] = useState<{ total: number; unread: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Merge HTTP and WebSocket notifications
  useEffect(() => {
    const mergedNotifications: HybridNotification[] = [
      // Add WebSocket notifications first (most recent)
      ...wsNotifications.map(wsNotif => ({
        notification_id: wsNotif.id,
        admin_id: 'system', // WebSocket notifications are system-wide
        title: wsNotif.title,
        message: wsNotif.body || '',
        type: 'system' as const,
        category: 'realtime' as const,
        priority: wsNotif.level === 'critical' ? 'high' : wsNotif.level === 'warning' ? 'medium' : 'low',
        is_read: false,
        created_at: new Date(wsNotif.createdAt).toISOString(),
        read_at: null,
        isRealtime: true
      })),
      // Add HTTP notifications (filter out duplicates)
      ...httpNotifications.filter(httpNotif => 
        !wsNotifications.some(wsNotif => wsNotif.id === httpNotif.notification_id)
      ).map(httpNotif => ({
        ...httpNotif,
        isRealtime: false
      }))
    ];

    // Sort by creation date (newest first)
    mergedNotifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setNotifications(mergedNotifications);
  }, [httpNotifications, wsNotifications]);

  // Update counts
  useEffect(() => {
    if (httpCounts) {
      setCounts({
        total: httpCounts.total + wsNotifications.length,
        unread: httpCounts.unread + wsNotifications.filter(n => !n.is_read).length
      });
    }
  }, [httpCounts, wsNotifications]);

  // Update loading and error states
  useEffect(() => {
    setLoading(httpLoading);
    setError(httpError);
  }, [httpLoading, httpError]);

  const refreshNotifications = useCallback(async () => {
    await refreshHttpNotifications();
  }, [refreshHttpNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Find the notification to check if it's realtime
    const notification = notifications.find(n => n.notification_id === notificationId);
    
    if (notification?.isRealtime) {
      // For realtime notifications, just update local state
      setNotifications(prev => 
        prev.map(n => 
          n.notification_id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      
      // Update counts
      setCounts(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null);
    } else {
      // For HTTP notifications, use the existing API
      await markAsReadHttp(notificationId);
    }
  }, [notifications, markAsReadHttp]);

  const markAllAsRead = useCallback(async () => {
    try {
      // Mark all HTTP notifications as read
      await markAllAsReadHttp();
      
      // Mark all WebSocket notifications as read locally
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: n.is_read ? n.read_at : new Date().toISOString() 
        }))
      );
      
      // Update counts
      setCounts(prev => prev ? { ...prev, unread: 0 } : null);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Still mark WebSocket notifications as read locally even if HTTP fails
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: n.is_read ? n.read_at : new Date().toISOString() 
        }))
      );
      
      // Update counts
      setCounts(prev => prev ? { ...prev, unread: 0 } : null);
    }
  }, [markAllAsReadHttp]);

  const deleteNotificationById = useCallback(async (notificationId: string) => {
    // Find the notification to check if it's realtime
    const notification = notifications.find(n => n.notification_id === notificationId);
    
    if (notification?.isRealtime) {
      // For realtime notifications, just remove from local state
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
      
      // Update counts
      setCounts(prev => {
        if (!prev) return null;
        const newCount = prev.total - 1;
        const newUnread = notification.is_read ? prev.unread : Math.max(0, prev.unread - 1);
        return { total: newCount, unread: newUnread };
      });
    } else {
      // For HTTP notifications, use the existing API
      await deleteNotificationHttp(notificationId);
    }
  }, [notifications, deleteNotificationHttp]);

  return {
    notifications,
    counts,
    loading,
    error,
    isWebSocketConnected,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotificationById
  };
}
