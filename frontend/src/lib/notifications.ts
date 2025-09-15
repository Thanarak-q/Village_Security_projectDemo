/**
 * @file Frontend service for managing admin notifications
 * This file provides functions to interact with the notifications API
 */

// Types for notifications
export interface Notification {
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

export interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  is_read?: boolean;
  priority?: string;
}

export interface NotificationCounts {
  total: number;
  unread: number;
}

const API_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Helper function to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies in the request
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch notifications with optional filters
 */
export async function fetchNotifications(filters: NotificationFilters = {}): Promise<{
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.type) params.append('type', filters.type);
  if (filters.category) params.append('category', filters.category);
  if (filters.is_read !== undefined) params.append('is_read', filters.is_read.toString());
  if (filters.priority) params.append('priority', filters.priority);

  const queryString = params.toString();
  const endpoint = queryString ? `/api/notifications?${queryString}` : '/api/notifications';
  
  const response = await apiRequest(endpoint);
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch notifications');
  }
  
  return response.data;
}

/**
 * Get notification counts
 */
export async function getNotificationCounts(): Promise<NotificationCounts> {
  const response = await apiRequest('/api/notifications/count');
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch notification counts');
  }
  
  return response.data;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const response = await apiRequest(`/api/notifications/${notificationId}/read`, {
    method: 'PUT'
  });
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ updated_count: number }> {
  const response = await apiRequest('/api/notifications/read-all', {
    method: 'PUT'
  });
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to mark all notifications as read');
  }
  
  return response.data;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const response = await apiRequest(`/api/notifications/${notificationId}`, {
    method: 'DELETE'
  });
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete notification');
  }
}

// Helper functions for UI
export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'resident_pending':
    case 'guard_pending':
    case 'admin_pending':
      return 'Users';
    case 'house_updated':
    case 'member_added':
    case 'member_removed':
      return 'Home';
    case 'visitor_pending_too_long':
    case 'visitor_rejected_review':
      return 'AlertTriangle';
    case 'status_changed':
      return 'Settings';
    default:
      return 'Bell';
  }
}

export function getNotificationColor(type: string): string {
  switch (type) {
    case 'resident_pending':
    case 'guard_pending':
    case 'admin_pending':
      return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
    case 'house_updated':
    case 'member_added':
    case 'member_removed':
      return 'text-green-500 bg-green-100 dark:bg-green-900/20';
    case 'visitor_pending_too_long':
    case 'visitor_rejected_review':
      return 'text-red-500 bg-red-100 dark:bg-red-900/20';
    case 'status_changed':
      return 'text-orange-500 bg-orange-100 dark:bg-orange-900/20';
    default:
      return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
}
