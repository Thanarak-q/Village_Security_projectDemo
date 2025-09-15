/**
 * @file React hook for managing notifications
 * This hook provides state management and API integration for notifications
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Notification,
  NotificationFilters,
  NotificationCounts,
  fetchNotifications,
  getNotificationCounts,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '@/lib/notifications';
import { useWebSocket } from './useWebSocket';

interface UseNotificationsReturn {
  notifications: Notification[];
  counts: NotificationCounts | null;
  loading: boolean;
  error: string | null;
  wsConnected: boolean;
  refreshNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotificationById: (notificationId: string) => Promise<void>;
}

export function useNotifications(initialFilters?: NotificationFilters): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WebSocket integration for real-time notifications
  const { isConnected: wsConnected, error: wsError } = useWebSocket({
    onNotification: (newNotification: Notification) => {
      console.log('📨 New notification received via WebSocket:', newNotification);
      
      // Add new notification to the beginning of the list
      setNotifications(prev => [newNotification, ...prev]);
      
      // Update counts
      setCounts(prev => prev ? {
        total: prev.total + 1,
        unread: prev.unread + (newNotification.is_read ? 0 : 1)
      } : null);
    },
    onNotificationCount: (newCounts: NotificationCounts) => {
      console.log('📊 Notification counts updated via WebSocket:', newCounts);
      setCounts(newCounts);
    },
    onError: (wsError: string) => {
      console.error('❌ WebSocket error:', wsError);
      setError(`WebSocket error: ${wsError}`);
    },
    onConnect: () => {
      console.log('🔌 WebSocket connected, refreshing notifications...');
      // Refresh notifications when WebSocket connects
      refreshNotifications();
    },
    onDisconnect: () => {
      console.log('🔌 WebSocket disconnected');
    }
  });

  const refreshNotifications = useCallback(async (filters: NotificationFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const [notificationsData, countsData] = await Promise.all([
        fetchNotifications({ ...initialFilters, ...filters }),
        getNotificationCounts()
      ]);
      
      setNotifications(notificationsData.notifications);
      setCounts(countsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.notification_id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      
      // Update counts
      setCounts(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      setError(errorMessage);
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const result = await markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: n.is_read ? n.read_at : new Date().toISOString() 
        }))
      );
      
      // Update counts
      setCounts(prev => prev ? { ...prev, unread: 0 } : null);
      
      console.log(`Marked ${result.updated_count} notifications as read`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      setError(errorMessage);
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  const deleteNotificationById = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.notification_id === notificationId);
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
      
      // Update counts
      setCounts(prev => {
        if (!prev) return null;
        const newCount = prev.total - 1;
        const newUnread = deletedNotification && !deletedNotification.is_read 
          ? Math.max(0, prev.unread - 1) 
          : prev.unread;
        return { total: newCount, unread: newUnread };
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
      setError(errorMessage);
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  // Load notifications on mount
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  return {
    notifications,
    counts,
    loading,
    error,
    wsConnected,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotificationById
  };
}
