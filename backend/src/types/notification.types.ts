/**
 * @file Notification types and constants
 * Centralized type definitions and constants for the notification system
 */

import { z } from 'zod';

// WebSocket Message Types - Use constants instead of string literals
export const WS_MESSAGE_TYPES = {
  WELCOME: 'WELCOME',
  ADMIN_NOTIFICATION: 'ADMIN_NOTIFICATION',
  ECHO: 'ECHO',
  HEARTBEAT: 'HEARTBEAT',
  ERROR: 'ERROR'
} as const;

export type WSMessageType = typeof WS_MESSAGE_TYPES[keyof typeof WS_MESSAGE_TYPES];

// Notification Level Constants
export const NOTIFICATION_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
} as const;

export type NotificationLevel = typeof NOTIFICATION_LEVELS[keyof typeof NOTIFICATION_LEVELS];

// WebSocket Message Schemas
export const WSNotificationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().optional(),
  level: z.enum(['info', 'warning', 'critical']).default('info'),
  createdAt: z.number().positive(),
  data: z.record(z.string(), z.unknown()).optional()
});

export const WSMessageSchema = z.object({
  type: z.enum([
    'WELCOME',
    'ADMIN_NOTIFICATION', 
    'ECHO',
    'HEARTBEAT',
    'ERROR'
  ] as const),
  data: z.unknown().optional(),
  timestamp: z.number().optional()
});

export const WSAdminNotificationMessageSchema = WSMessageSchema.extend({
  type: z.literal(WS_MESSAGE_TYPES.ADMIN_NOTIFICATION),
  data: WSNotificationSchema
});

// Type exports
export type WSNotification = z.infer<typeof WSNotificationSchema>;
export type WSMessage = z.infer<typeof WSMessageSchema>;
export type WSAdminNotificationMessage = z.infer<typeof WSAdminNotificationMessageSchema>;

// Connection Status Constants
export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting'
} as const;

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];

// Notification Categories and Types (from schema)
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

// API Response schemas
export const NotificationResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    notifications: z.array(z.object({
      notification_id: z.string().uuid(),
      type: z.string(),
      category: z.string(),
      title: z.string(),
      message: z.string(),
      data: z.record(z.unknown()).nullable().optional(),
      created_at: z.string().datetime(),
      village_name: z.string().optional(),
      seen_at: z.string().datetime().nullable().optional(),
      read_at: z.string().datetime().nullable().optional(),
      is_read: z.boolean()
    })),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number()
    })
  }).optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime().optional()
});

export const NotificationCountsSchema = z.object({
  success: z.boolean(),
  data: z.object({
    total: z.number(),
    unread: z.number(),
    unseen: z.number().optional()
  }).optional(),
  error: z.string().optional()
});

export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
export type NotificationCounts = z.infer<typeof NotificationCountsSchema>;

// Error Types
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
