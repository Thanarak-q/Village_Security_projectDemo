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
  data?: Record<string, unknown>;
  is_read: boolean;
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
}

export interface NotificationCounts {
  total: number;
  unread: number;
}

// Helper function to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(endpoint, {
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
  return 'bg-gray-500';
}
