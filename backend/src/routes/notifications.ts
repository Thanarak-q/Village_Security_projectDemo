/**
 * @file API routes for admin notifications
 * Handles CRUD operations for admin notifications including:
 * - Fetching notifications for a specific admin
 * - Marking notifications as read
 * - Creating new notifications
 * - Getting notification counts
 */

import { Elysia, t } from 'elysia';
import { eq, and, desc, count } from 'drizzle-orm';
import db from '../db/drizzle';
import { admin_notifications, villages, admins } from '../db/schema';
import { requireRole } from '../hooks/requireRole';
import { websocketClient } from '../services/websocketClient';

export const notificationsRoutes = new Elysia({ prefix: '/api/notifications' })
  .onBeforeHandle(requireRole(['admin', 'staff', 'superadmin']))

  // GET /api/notifications - Get all notifications for the authenticated admin
  .get('/', async (context: any) => {
    try {
      const { currentUser, query } = context;
      const { page = 1, limit = 20, type, category } = query;
      const offset = (Number(page) - 1) * Number(limit);

      // Build where conditions - get notifications for the admin's village
      const whereConditions = [eq(admin_notifications.village_key, currentUser.village_key)];
      
      if (type) {
        whereConditions.push(eq(admin_notifications.type, type as any));
      }
      if (category) {
        whereConditions.push(eq(admin_notifications.category, category as any));
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
          created_at: admin_notifications.created_at,
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

      return {
        success: true,
        data: {
          notifications,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      };
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to fetch notifications';
      if (error instanceof Error) {
        if (error.message.includes('database')) {
          errorMessage = 'Database connection error. Please try again later.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout. Please try again.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Insufficient permissions to access notifications.';
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  })

  // GET /api/notifications/count - Get notification counts
  .get('/count', async (context: any) => {
    try {
      const { currentUser } = context;

      // Get total and unread counts
      const [totalResult] = await Promise.all([
        db.select({ count: count() })
          .from(admin_notifications)
          .where(eq(admin_notifications.village_key, currentUser.village_key))
      ]);

      return {
        success: true,
        data: {
          total: totalResult[0]?.count || 0
        }
      };
    } catch (error) {
      console.error('❌ Error fetching notification counts:', error);
      return {
        success: false,
        error: 'Failed to fetch notification counts',
        timestamp: new Date().toISOString()
      };
    }
  })




  // POST /api/notifications/test - Create test notification (development only)
  .post('/test', async (context: any) => {
    try {
      const { currentUser } = context;
      
      // Only allow in development environment
      if (process.env.NODE_ENV === 'production') {
        return {
          success: false,
          error: 'Test notifications not allowed in production'
        };
      }

      // Import notification service here to avoid circular dependencies
      const { notificationService } = await import('../services/notificationService');

      const testNotifications = [
        {
          type: 'resident_pending' as const,
          category: 'user_approval' as const,
          title: 'เทส ต้องกรทดสอบ webhook',
          message: 'การทดสอบระบบแจ้งเตือนผ่าน webhook - ตรวจสอบการทำงานของระบบ',
        },
        {
          type: 'visitor_pending_too_long' as const,
          category: 'visitor_management' as const,
          title: 'ผู้เยี่ยมรอการอนุมัตินานเกินไป',
          message: 'ผู้เยี่ยม นายทดสอบ รอการอนุมัติเป็นเวลานานแล้ว',
        },
        {
          type: 'house_updated' as const,
          category: 'house_management' as const,
          title: 'สถานะบ้านเปลี่ยนแปลง',
          message: 'บ้านเลขที่ 123/45 เปลี่ยนสถานะจาก "ว่าง" เป็น "มีผู้อยู่อาศัย"',
        }
      ];

      // Create random test notification
      const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)];

      const notification = await notificationService.createNotification({
        village_key: currentUser.village_key || 'test-village',
        ...randomNotification,
        data: {
          test: true,
          timestamp: new Date().toISOString(),
          user_agent: context.headers['user-agent'] || 'unknown'
        }
      });

      return {
        success: true,
        data: {
          message: 'Test notification created successfully',
          notification_id: notification.notification_id,
          type: notification.type,
          title: notification.title
        }
      };
    } catch (error) {
      console.error('Error creating test notification:', error);
      return {
        success: false,
        error: 'Failed to create test notification'
      };
    }
  })

  // POST /api/notifications/test-webhook - Create specific webhook test notification
  .post('/test-webhook', async (context: any) => {
    try {
      const { currentUser } = context;
      
      // Only allow in development environment
      if (process.env.NODE_ENV === 'production') {
        return {
          success: false,
          error: 'Test notifications not allowed in production'
        };
      }

      // Import notification service here to avoid circular dependencies
      const { notificationService } = await import('../services/notificationService');

      const webhookTestNotification = {
        type: 'resident_pending' as const,
        category: 'user_approval' as const,
        title: 'เทส ต้องกรทดสอบ webhook',
        message: 'การทดสอบระบบแจ้งเตือนผ่าน webhook - ตรวจสอบการทำงานของระบบ',
      };

      const notification = await notificationService.createNotification({
        village_key: currentUser.village_key || 'test-village',
        ...webhookTestNotification,
        data: {
          test: true,
          webhook_test: true,
          timestamp: new Date().toISOString(),
          user_agent: context.headers['user-agent'] || 'unknown'
        }
      });

      return {
        success: true,
        data: {
          message: 'Webhook test notification created successfully',
          notification_id: notification.notification_id,
          type: notification.type,
          title: notification.title
        }
      };
    } catch (error) {
      console.error('Error creating webhook test notification:', error);
      return {
        success: false,
        error: 'Failed to create webhook test notification'
      };
    }
  })

  // POST /api/notifications/realtime - Create and broadcast real-time notification
  .post('/realtime', async (context: any) => {
    try {
      const { currentUser, body } = context;
      const { title, message, type = 'system', category = 'realtime', target = 'admin', level } = body;

      if (!title) {
        return {
          success: false,
          error: 'Title is required'
        };
      }

      // Get the admin's village_key
      const admin = await db.query.admins.findFirst({
        where: eq(admins.admin_id, currentUser.admin_id)
      });

      console.log('🔍 Admin found:', admin);

      // Use admin's village_key or default to 'default-village' for testing
      const villageKey = admin?.village_key || 'default-village';
      console.log('🏘️ Using village_key:', villageKey);

      // Create notification in database
      const [newNotification] = await db
        .insert(admin_notifications)
        .values({
          village_key: villageKey,
          title,
          message: message || '',
          type: type as any,
          category: category as any,
          created_at: new Date(),
        })
        .returning();

      // Broadcast via WebSocket
      const wsNotification = {
        id: newNotification.notification_id,
        title: newNotification.title,
        body: newNotification.message,
        level: level || 'info',
        createdAt: newNotification.created_at ? newNotification.created_at.getTime() : Date.now()
      };

      let wsSent = false;
      let wsError = null;

      try {
        wsSent = await websocketClient.sendNotification(wsNotification);
      } catch (error) {
        console.error('❌ WebSocket broadcast failed:', error);
        wsError = error instanceof Error ? error.message : 'Unknown WebSocket error';
      }

      return {
        success: true,
        data: {
          notification: newNotification,
          websocket_sent: wsSent,
          websocket_error: wsError,
          message: wsSent 
            ? 'Notification created and broadcasted successfully'
            : wsError 
              ? `Notification created but WebSocket failed: ${wsError}`
              : 'Notification created but WebSocket service unavailable'
        }
      };
    } catch (error) {
      console.error('Error creating real-time notification:', error);
      return {
        success: false,
        error: 'Failed to create real-time notification'
      };
    }
  });
