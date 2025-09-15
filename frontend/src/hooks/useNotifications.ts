/**
 * @file React hook for managing admin notifications
 * This hook provides state management and API integration for notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  fetchNotifications, 
  fetchNotificationCounts, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
  type NotificationCount,
  type NotificationFilters
} from '@/lib/notifications';

interface UseNotificationsReturn {
  // Data
  notifications: Notification[];
  counts: NotificationCount | null;
  loading: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  
  // Actions
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotificationById: (notificationId: string) => Promise<void>;
  setFilters: (filters: NotificationFilters) => void;
  
  // State
  hasMore: boolean;
}

export function useNotifications(initialFilters: NotificationFilters = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<NotificationFilters>({
    page: 1,
    limit: 20,
    ...initialFilters
  });
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  // Load notifications
  const loadNotifications = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentPage = reset ? 1 : (filters.page || 1);
      const requestFilters = { ...filters, page: currentPage };

      const response = await fetchNotifications(requestFilters);

      if (response.success && response.data) {
        const newNotifications = response.data.notifications;
        
        if (reset || currentPage === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        
        setPagination(response.data.pagination);
      } else {
        setError(response.error || 'Failed to load notifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load notification counts
  const loadCounts = useCallback(async () => {
    try {
      const response = await fetchNotificationCounts();
      if (response.success && response.data) {
        setCounts(response.data);
      }
    } catch (err) {
      console.error('Failed to load notification counts:', err);
    }
  }, []);

  // Refresh notifications (reset to page 1)
  const refreshNotifications = useCallback(async () => {
    await loadNotifications(true);
    await loadCounts();
  }, [loadNotifications, loadCounts]);

  // Load more notifications (next page)
  const loadMoreNotifications = useCallback(async () => {
    if (!pagination || pagination.page >= pagination.totalPages || loading) {
      return;
    }

    setFiltersState(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
  }, [pagination, loading]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await markNotificationAsRead(notificationId);
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.notification_id === notificationId
              ? { ...notification, is_read: true, read_at: new Date().toISOString() }
              : notification
          )
        );
        
        // Update counts
        if (counts) {
          setCounts(prev => prev ? {
            ...prev,
            unread: Math.max(0, prev.unread - 1)
          } : null);
        }
      } else {
        setError(response.error || 'Failed to mark notification as read');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  }, [counts]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await markAllNotificationsAsRead();
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({
            ...notification,
            is_read: true,
            read_at: new Date().toISOString()
          }))
        );
        
        // Update counts
        if (counts) {
          setCounts(prev => prev ? {
            ...prev,
            unread: 0
          } : null);
        }
      } else {
        setError(response.error || 'Failed to mark all notifications as read');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  }, [counts]);

  // Delete notification
  const deleteNotificationById = useCallback(async (notificationId: string) => {
    try {
      const response = await deleteNotification(notificationId);
      
      if (response.success) {
        setNotifications(prev => 
          prev.filter(notification => notification.notification_id !== notificationId)
        );
        
        // Update counts
        if (counts) {
          const deletedNotification = notifications.find(n => n.notification_id === notificationId);
          setCounts(prev => prev ? {
            ...prev,
            total: Math.max(0, prev.total - 1),
            unread: deletedNotification && !deletedNotification.is_read 
              ? Math.max(0, prev.unread - 1) 
              : prev.unread
          } : null);
        }
      } else {
        setError(response.error || 'Failed to delete notification');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  }, [counts, notifications]);

  // Set filters
  const setFilters = useCallback((newFilters: NotificationFilters) => {
    setFiltersState(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // Calculate if there are more notifications to load
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return {
    // Data
    notifications,
    counts,
    loading,
    error,
    
    // Pagination
    pagination,
    
    // Actions
    refreshNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotificationById,
    setFilters,
    
    // State
    hasMore
  };
}
