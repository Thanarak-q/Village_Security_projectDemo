/**
 * @file React hook for managing notifications
 * This hook provides state management and API integration for notifications
 */

import { useState, useEffect, useCallback } from 'react';
import {
  type Notification,
  NotificationFilters,
  NotificationCounts,
  fetchNotifications,
  getNotificationCounts,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '@/lib/notifications';
// WebSocket enabled
import { useWebSocket } from './useWebSocket';

interface UseNotificationsReturn {
  notifications: Notification[];
  counts: NotificationCounts | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
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

  // WebSocket integration for real-time updates
  const handleNewNotification = useCallback((notificationData: any) => {
    console.log('📨 Received new notification:', notificationData);
    
    // Add new notification to the beginning of the list
    setNotifications(prev => [notificationData, ...prev]);
    
    // Update counts
    setCounts(prev => prev ? { 
      total: prev.total + 1, 
      unread: prev.unread + 1 
    } : { total: 1, unread: 1 });
    
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notificationData.title, {
        body: notificationData.message,
        icon: '/favicon.ico',
        tag: notificationData.notification_id,
      });
    }
  }, []);

  const handleNotificationCount = useCallback((countData: any) => {
    console.log('📊 Received notification count update:', countData);
    setCounts(countData);
  }, []);

  const handleWebSocketError = useCallback((errorMessage: string) => {
    console.error('🔌 WebSocket error:', errorMessage);
    setError(`Connection error: ${errorMessage}`);
  }, []);

  const { isConnected } = useWebSocket({
    onNotification: handleNewNotification,
    onNotificationCount: handleNotificationCount,
    onError: handleWebSocketError,
    autoReconnect: true
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

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📣 Notification permission:', permission);
      });
    }
  }, []);

  // Load notifications on mount
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  return {
    notifications,
    counts,
    loading,
    error,
    isConnected,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotificationById
  };
}
