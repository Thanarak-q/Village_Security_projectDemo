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
  time: string; // Formatted time ago
  village: string;
}

export interface NotificationCount {
  total: number;
  unread: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  is_read?: boolean;
  priority?: string;
}

const API_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Helper function to get auth token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

// Helper function to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
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
  success: boolean;
  data?: {
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}> {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.is_read !== undefined) queryParams.append('is_read', filters.is_read.toString());
    if (filters.priority) queryParams.append('priority', filters.priority);

    const queryString = queryParams.toString();
    const endpoint = `/api/notifications${queryString ? `?${queryString}` : ''}`;

    return await apiRequest(endpoint);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch notifications'
    };
  }
}

/**
 * Fetch notification counts
 */
export async function fetchNotificationCounts(): Promise<{
  success: boolean;
  data?: NotificationCount;
  error?: string;
}> {
  try {
    return await apiRequest('/api/notifications/count');
  } catch (error) {
    console.error('Error fetching notification counts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch notification counts'
    };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<{
  success: boolean;
  data?: Notification;
  error?: string;
}> {
  try {
    return await apiRequest(`/api/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark notification as read'
    };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  data?: { updated_count: number };
  error?: string;
}> {
  try {
    return await apiRequest('/api/notifications/read-all', {
      method: 'PUT'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark all notifications as read'
    };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<{
  success: boolean;
  data?: { deleted_id: string };
  error?: string;
}> {
  try {
    return await apiRequest(`/api/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete notification'
    };
  }
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: string) {
  // This should match the icons used in the frontend notification component
  switch (type) {
    case 'resident_pending':
    case 'guard_pending':
    case 'admin_pending':
      return 'Users'; // You'll need to import this from lucide-react
    case 'house_updated':
    case 'member_added':
    case 'member_removed':
      return 'Home'; // You'll need to import this from lucide-react
    case 'visitor_pending_too_long':
    case 'visitor_rejected_review':
      return 'AlertTriangle'; // You'll need to import this from lucide-react
    case 'status_changed':
      return 'Settings'; // You'll need to import this from lucide-react
    default:
      return 'Bell'; // Default icon
  }
}

/**
 * Get notification color based on priority
 */
export function getNotificationColor(priority: string) {
  switch (priority) {
    case 'urgent':
      return 'text-red-500 bg-red-100 dark:bg-red-900/20';
    case 'high':
      return 'text-orange-500 bg-orange-100 dark:bg-orange-900/20';
    case 'medium':
      return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
    case 'low':
      return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    default:
      return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
  }
}
