/**
 * @file Frontend notification types and constants
 * Shared with backend for consistency
 */

// WebSocket Message Types - Keep in sync with backend
export const WS_MESSAGE_TYPES = {
  WELCOME: 'WELCOME',
  ADMIN_NOTIFICATION: 'ADMIN_NOTIFICATION',
  ECHO: 'ECHO',
  HEARTBEAT: 'HEARTBEAT',
  ERROR: 'ERROR',
  PING: 'PING',
  PONG: 'PONG'
} as const;

export type WSMessageType = typeof WS_MESSAGE_TYPES[keyof typeof WS_MESSAGE_TYPES];

// Notification Level Constants
export const NOTIFICATION_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
} as const;

export type NotificationLevel = typeof NOTIFICATION_LEVELS[keyof typeof NOTIFICATION_LEVELS];

// Connection Status Constants
export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting'
} as const;

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];

// Notification Categories and Types (from backend schema)
export const NOTIFICATION_TYPES = {
  RESIDENT_PENDING: 'resident_pending',
  GUARD_PENDING: 'guard_pending', 
  ADMIN_PENDING: 'admin_pending',
  HOUSE_UPDATED: 'house_updated',
  MEMBER_ADDED: 'member_added',
  MEMBER_REMOVED: 'member_removed',
  STATUS_CHANGED: 'status_changed',
  VISITOR_PENDING_TOO_LONG: 'visitor_pending_too_long',
  VISITOR_REJECTED_REVIEW: 'visitor_rejected_review'
} as const;

export const NOTIFICATION_CATEGORIES = {
  USER_APPROVAL: 'user_approval',
  HOUSE_MANAGEMENT: 'house_management',
  VISITOR_MANAGEMENT: 'visitor_management'
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
export type NotificationCategory = typeof NOTIFICATION_CATEGORIES[keyof typeof NOTIFICATION_CATEGORIES];

// WebSocket Notification interface
export interface WSNotification {
  id: string;
  title: string;
  body?: string;
  level?: NotificationLevel;
  createdAt: number;
  data?: Record<string, unknown>;
}

// WebSocket Message interface
export interface WSMessage {
  type: WSMessageType;
  data?: unknown;
  timestamp?: number;
}

// API Notification interface (HTTP-based)
export interface ApiNotification {
  notification_id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  created_at: string;
  village_name?: string;
}

// Notification counts
export interface NotificationCounts {
  total: number;
}

// Error classes
export class NotificationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

export class WebSocketError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'WebSocketError';
  }
}

// Utility functions for notifications
export const notificationUtils = {
  /**
   * Get notification level color for UI
   */
  getLevelColor: (level: NotificationLevel): string => {
    switch (level) {
      case NOTIFICATION_LEVELS.CRITICAL:
        return 'text-red-600 bg-red-50 border-red-200';
      case NOTIFICATION_LEVELS.WARNING:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case NOTIFICATION_LEVELS.INFO:
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  },

  /**
   * Get notification type icon
   */
  getTypeIcon: (type: NotificationType): string => {
    switch (type) {
      case NOTIFICATION_TYPES.RESIDENT_PENDING:
      case NOTIFICATION_TYPES.GUARD_PENDING:
      case NOTIFICATION_TYPES.ADMIN_PENDING:
        return '👤';
      case NOTIFICATION_TYPES.HOUSE_UPDATED:
      case NOTIFICATION_TYPES.MEMBER_ADDED:
      case NOTIFICATION_TYPES.MEMBER_REMOVED:
        return '🏠';
      case NOTIFICATION_TYPES.VISITOR_PENDING_TOO_LONG:
      case NOTIFICATION_TYPES.VISITOR_REJECTED_REVIEW:
        return '🚪';
      case NOTIFICATION_TYPES.STATUS_CHANGED:
        return '🔄';
      default:
        return '📢';
    }
  },

  /**
   * Get notification priority order for sorting
   */
  getPriority: (level: NotificationLevel): number => {
    switch (level) {
      case NOTIFICATION_LEVELS.CRITICAL:
        return 3;
      case NOTIFICATION_LEVELS.WARNING:
        return 2;
      case NOTIFICATION_LEVELS.INFO:
      default:
        return 1;
    }
  },

  /**
   * Format notification time for display
   */
  formatTime: (timestamp: number | string): string => {
    const date = new Date(typeof timestamp === 'number' ? timestamp : timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'ตอนนี้';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;
    
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * Check if notification is recent (within last hour)
   */
  isRecent: (timestamp: number | string): boolean => {
    const date = new Date(typeof timestamp === 'number' ? timestamp : timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff < 3600000; // 1 hour
  },

  /**
   * Generate notification key for React lists
   */
  generateKey: (notification: WSNotification | ApiNotification): string => {
    if ('notification_id' in notification) {
      return `api-${notification.notification_id}`;
    }
    return `ws-${notification.id}`;
  }
};
