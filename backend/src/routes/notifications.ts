/**
 * @file API routes for admin notifications
 * Handles CRUD operations for admin notifications including:
 * - Fetching notifications for a specific admin
 * - Marking notifications as read
 * - Creating new notifications
 * - Getting notification counts
 */

import { Elysia, t } from 'elysia';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import db from '../db/drizzle';
import { admin_notifications, admins, villages } from '../db/schema';
import { requireRole } from '../hooks/requireRole';

// Type definitions for API responses
interface NotificationResponse {
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

interface NotificationCountResponse {
  total: number;
  unread: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

// Helper function to format notification for frontend
function formatNotificationForFrontend(notification: any): NotificationResponse {
  return {
    notification_id: notification.notification_id,
    type: notification.type,
    category: notification.category,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    is_read: notification.is_read,
    priority: notification.priority,
    created_at: notification.created_at,
    read_at: notification.read_at,
    village_name: notification.village_name
  };
}

// Helper function to get time ago string
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} วินาทีที่แล้ว`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} นาทีที่แล้ว`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ชั่วโมงที่แล้ว`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} วันที่แล้ว`;
  }
}

export const notificationsRoutes = new Elysia({ prefix: '/api/notifications' })
  .use(requireRole(['admin', 'staff', 'superadmin']))

  // GET /api/notifications - Get all notifications for the authenticated admin
  .get('/', async ({ user, query }) => {
    try {
      const { page = 1, limit = 20, type, category, is_read, priority } = query;
      const offset = (Number(page) - 1) * Number(limit);

      // Build where conditions
      const whereConditions = [eq(admin_notifications.admin_id, user.admin_id)];
      
      if (type) {
        whereConditions.push(eq(admin_notifications.type, type));
      }
      if (category) {
        whereConditions.push(eq(admin_notifications.category, category));
      }
      if (is_read !== undefined) {
        whereConditions.push(eq(admin_notifications.is_read, is_read === 'true'));
      }
      if (priority) {
        whereConditions.push(eq(admin_notifications.priority, priority));
      }

      // Fetch notifications with village name
      const notifications = await db
        .select({
          notification_id: admin_notifications.notification_id,
          type: admin_notifications.type,
          category: admin_notifications.category,
          title: admin_notifications.title,
          message: admin_notifications.message,
          data: admin_notifications.data,
          is_read: admin_notifications.is_read,
          priority: admin_notifications.priority,
          created_at: admin_notifications.created_at,
          read_at: admin_notifications.read_at,
          village_name: villages.village_name,
        })
        .from(admin_notifications)
        .leftJoin(villages, eq(admin_notifications.village_key, villages.village_key))
        .where(and(...whereConditions))
        .orderBy(desc(admin_notifications.created_at))
        .limit(Number(limit))
        .offset(offset);

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(admin_notifications)
        .where(and(...whereConditions));

      const total = totalResult[0]?.count || 0;

      // Format notifications for frontend
      const formattedNotifications = notifications.map(notification => ({
        ...formatNotificationForFrontend(notification),
        time: getTimeAgo(new Date(notification.created_at)),
        village: notification.village_name || 'ไม่ระบุ'
      }));

      return {
        success: true,
        data: {
          notifications: formattedNotifications,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        error: 'Failed to fetch notifications'
      };
    }
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      type: t.Optional(t.String()),
      category: t.Optional(t.String()),
      is_read: t.Optional(t.String()),
      priority: t.Optional(t.String())
    })
  })

  // GET /api/notifications/count - Get notification counts
  .get('/count', async ({ user }) => {
    try {
      // Get total and unread counts
      const [totalResult, unreadResult] = await Promise.all([
        db.select({ count: count() })
          .from(admin_notifications)
          .where(eq(admin_notifications.admin_id, user.admin_id)),
        
        db.select({ count: count() })
          .from(admin_notifications)
          .where(and(
            eq(admin_notifications.admin_id, user.admin_id),
            eq(admin_notifications.is_read, false)
          ))
      ]);

      // Get counts by type
      const typeCounts = await db
        .select({
          type: admin_notifications.type,
          count: count()
        })
        .from(admin_notifications)
        .where(eq(admin_notifications.admin_id, user.admin_id))
        .groupBy(admin_notifications.type);

      // Get counts by priority
      const priorityCounts = await db
        .select({
          priority: admin_notifications.priority,
          count: count()
        })
        .from(admin_notifications)
        .where(eq(admin_notifications.admin_id, user.admin_id))
        .groupBy(admin_notifications.priority);

      const by_type = typeCounts.reduce((acc, item) => {
        acc[item.type] = item.count;
        return acc;
      }, {} as Record<string, number>);

      const by_priority = priorityCounts.reduce((acc, item) => {
        acc[item.priority] = item.count;
        return acc;
      }, {} as Record<string, number>);

      const response: NotificationCountResponse = {
        total: totalResult[0]?.count || 0,
        unread: unreadResult[0]?.count || 0,
        by_type,
        by_priority
      };

      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error fetching notification counts:', error);
      return {
        success: false,
        error: 'Failed to fetch notification counts'
      };
    }
  })

  // PUT /api/notifications/:id/read - Mark notification as read
  .put('/:id/read', async ({ user, params }) => {
    try {
      const { id } = params;

      const result = await db
        .update(admin_notifications)
        .set({
          is_read: true,
          read_at: new Date()
        })
        .where(and(
          eq(admin_notifications.notification_id, id),
          eq(admin_notifications.admin_id, user.admin_id)
        ))
        .returning();

      if (result.length === 0) {
        return {
          success: false,
          error: 'Notification not found or access denied'
        };
      }

      return {
        success: true,
        data: formatNotificationForFrontend(result[0])
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: 'Failed to mark notification as read'
      };
    }
  }, {
    params: t.Object({
      id: t.String()
    })
  })

  // PUT /api/notifications/read-all - Mark all notifications as read
  .put('/read-all', async ({ user }) => {
    try {
      const result = await db
        .update(admin_notifications)
        .set({
          is_read: true,
          read_at: new Date()
        })
        .where(and(
          eq(admin_notifications.admin_id, user.admin_id),
          eq(admin_notifications.is_read, false)
        ))
        .returning();

      return {
        success: true,
        data: {
          updated_count: result.length
        }
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        error: 'Failed to mark all notifications as read'
      };
    }
  })

  // DELETE /api/notifications/:id - Delete a notification
  .delete('/:id', async ({ user, params }) => {
    try {
      const { id } = params;

      const result = await db
        .delete(admin_notifications)
        .where(and(
          eq(admin_notifications.notification_id, id),
          eq(admin_notifications.admin_id, user.admin_id)
        ))
        .returning();

      if (result.length === 0) {
        return {
          success: false,
          error: 'Notification not found or access denied'
        };
      }

      return {
        success: true,
        data: {
          deleted_id: id
        }
      };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        error: 'Failed to delete notification'
      };
    }
  }, {
    params: t.Object({
      id: t.String()
    })
  })

  // POST /api/notifications - Create a new notification (for system use)
  .post('/', async ({ body }) => {
    try {
      const {
        admin_id,
        village_key,
        type,
        category,
        title,
        message,
        data,
        priority = 'medium'
      } = body;

      const result = await db
        .insert(admin_notifications)
        .values({
          admin_id,
          village_key,
          type,
          category,
          title,
          message,
          data,
          priority,
          is_read: false
        })
        .returning();

      return {
        success: true,
        data: formatNotificationForFrontend(result[0])
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        error: 'Failed to create notification'
      };
    }
  }, {
    body: t.Object({
      admin_id: t.String(),
      village_key: t.String(),
      type: t.Union([
        t.Literal('resident_pending'),
        t.Literal('guard_pending'),
        t.Literal('admin_pending'),
        t.Literal('house_updated'),
        t.Literal('member_added'),
        t.Literal('member_removed'),
        t.Literal('status_changed'),
        t.Literal('visitor_pending_too_long'),
        t.Literal('visitor_rejected_review')
      ]),
      category: t.Union([
        t.Literal('user_approval'),
        t.Literal('house_management'),
        t.Literal('visitor_management')
      ]),
      title: t.String(),
      message: t.String(),
      data: t.Optional(t.Record(t.String(), t.Any())),
      priority: t.Optional(t.Union([
        t.Literal('low'),
        t.Literal('medium'),
        t.Literal('high'),
        t.Literal('urgent')
      ]))
    })
  });
