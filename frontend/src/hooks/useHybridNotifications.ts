import { useState, useEffect, useCallback } from 'react';
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
  errorStats: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    retryable: number;
    critical: number;
  };
  healthStatus: {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    message: string;
    color: string;
  };
}

export function useHybridNotifications() {
  // HTTP-based notifications (existing system)
  const {
    notifications: httpNotifications,
    counts: httpCounts,
    loading: httpLoading,
    error: httpError,
    refreshNotifications: refreshHttpNotifications
  } = useNotifications();

  // WebSocket-based notifications (real-time)
  const {
    notifications: wsNotifications,
    isConnected: isWebSocketConnected,
    errorStats: wsErrorStats,
    healthStatus: wsHealthStatus
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
        is_read: false,
        created_at: new Date(wsNotif.createdAt).toISOString(),
        read_at: undefined,
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
        unread: httpCounts.unread + wsNotifications.length
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




  return {
    notifications,
    counts,
    loading,
    error,
    isWebSocketConnected,
    refreshNotifications,
    errorStats: wsErrorStats,
    healthStatus: wsHealthStatus
  };
}
