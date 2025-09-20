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
  getNotificationCounts
} from '@/lib/notifications';

interface UseNotificationsReturn {
  notifications: Notification[];
  counts: NotificationCounts | null;
  loading: boolean;
  error: string | null;
  refreshNotifications: (filters?: NotificationFilters) => Promise<void>;
}

export function useNotifications(initialFilters?: NotificationFilters): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


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
    refreshNotifications
  };
}
