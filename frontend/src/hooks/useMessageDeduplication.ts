/**
 * @file Message Deduplication Hook
 * Provides message deduplication and queuing capabilities
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { websocketMessageManager } from '../utils/websocketMessageManager';
import { useAuth } from './useAuth';

export interface MessageDeduplicationOptions {
  enableDeduplication: boolean;
  enableQueuing: boolean;
  maxQueueSize: number;
  retryDelay: number;
  maxRetries: number;
  deduplicationWindow: number;
}

const defaultOptions: MessageDeduplicationOptions = {
  enableDeduplication: true,
  enableQueuing: true,
  maxQueueSize: 100,
  retryDelay: 1000,
  maxRetries: 3,
  deduplicationWindow: 300000 // 5 minutes
};

export function useMessageDeduplication(options: Partial<MessageDeduplicationOptions> & { villageKey?: string } = {}) {
  const { villageKey: overrideVillageKey, ...dedupOptions } = options;
  const config = useMemo(() => ({ ...defaultOptions, ...dedupOptions }), [dedupOptions]);
  const { user } = useAuth();
  const resolvedVillageKey = useMemo(() => {
    const fromOptions = typeof overrideVillageKey === 'string' ? overrideVillageKey.trim() : '';
    const fromUser = typeof user?.village_key === 'string' ? user.village_key.trim() : '';
    const fromEnv = typeof process.env.NEXT_PUBLIC_DEFAULT_VILLAGE_KEY === 'string'
      ? process.env.NEXT_PUBLIC_DEFAULT_VILLAGE_KEY.trim()
      : '';

    return fromOptions || fromUser || fromEnv || null;
  }, [overrideVillageKey, user?.village_key]);
  const [queueStatus, setQueueStatus] = useState(websocketMessageManager.getQueueStatus());
  const statusUpdateInterval = useRef<NodeJS.Timeout>();

  // Update queue status periodically
  useEffect(() => {
    const updateStatus = () => {
      setQueueStatus(websocketMessageManager.getQueueStatus());
    };

    // Update immediately
    updateStatus();

    // Update every 5 seconds
    statusUpdateInterval.current = setInterval(updateStatus, 5000);

    return () => {
      if (statusUpdateInterval.current) {
        clearInterval(statusUpdateInterval.current);
      }
    };
  }, []);

  // Send message with deduplication and queuing
  const sendMessage = useCallback((
    type: string,
    data: unknown,
    messageOptions: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      maxRetries?: number;
      expiresAt?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ) => {
    try {
      let payload = data;

      if (type === 'ADMIN_NOTIFICATION') {
        if (!resolvedVillageKey) {
          throw new Error('Village key is required to send admin notifications');
        }

        if (data && typeof data === 'object') {
          payload = {
            villageKey: resolvedVillageKey,
            ...(data as Record<string, unknown>)
          };
        } else {
          payload = {
            villageKey: resolvedVillageKey,
            value: data
          };
        }
      }

      const messageId = websocketMessageManager.sendMessage(type, payload, {
        priority: messageOptions.priority || 'normal',
        maxRetries: messageOptions.maxRetries || config.maxRetries,
        expiresAt: messageOptions.expiresAt,
        metadata: messageOptions.metadata
      });

      console.log(`📤 Message sent/queued: ${messageId}`);
      return messageId;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }, [config, resolvedVillageKey]);

  // Send notification with deduplication
  const sendNotification = useCallback((
    title: string,
    body: string,
    options: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      level?: 'info' | 'warning' | 'critical';
      metadata?: Record<string, unknown>;
    } = {}
  ) => {
    if (!resolvedVillageKey) {
      throw new Error('Village key is required to send notifications');
    }

    const notificationData = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      body,
      level: options.level || 'info',
      createdAt: Date.now(),
      villageKey: resolvedVillageKey,
      metadata: options.metadata
    };

    return sendMessage('ADMIN_NOTIFICATION', notificationData, {
      priority: options.priority || 'normal',
      metadata: {
        type: 'notification',
        level: options.level || 'info',
        villageKey: resolvedVillageKey,
        ...options.metadata
      }
    });
  }, [sendMessage, resolvedVillageKey]);

  // Send ping message
  const sendPing = useCallback(() => {
    return sendMessage('PING', { timestamp: Date.now() }, {
      priority: 'low',
      maxRetries: 1,
      metadata: { type: 'ping' }
    });
  }, [sendMessage]);

  // Send echo message
  const sendEcho = useCallback((data: unknown) => {
    return sendMessage('ECHO', data, {
      priority: 'low',
      maxRetries: 1,
      metadata: { type: 'echo' }
    });
  }, [sendMessage]);

  // Clear queue
  const clearQueue = useCallback(() => {
    websocketMessageManager.clearQueue();
    setQueueStatus(websocketMessageManager.getQueueStatus());
    console.log('🧹 Message queue cleared');
  }, []);

  // Remove specific message
  const removeMessage = useCallback((messageId: string) => {
    const removed = websocketMessageManager.removeMessage(messageId);
    if (removed) {
      setQueueStatus(websocketMessageManager.getQueueStatus());
      console.log(`🗑️ Message removed: ${messageId}`);
    }
    return removed;
  }, []);

  // Get message by ID
  const getMessage = useCallback((messageId: string) => {
    return websocketMessageManager.getMessage(messageId);
  }, []);

  // Check if message is duplicate
  const isDuplicate = useCallback((type: string, data: unknown) => {
    // Simple duplicate check based on content hash
    // This is a simplified check - in a real implementation,
    // you'd want to check against actual message content
    return false;
  }, []);

  // Get deduplication stats
  const getDeduplicationStats = useCallback(() => {
    return {
      queueSize: queueStatus.size,
      isProcessing: queueStatus.processing,
      oldestMessage: queueStatus.oldestMessage,
      newestMessage: queueStatus.newestMessage,
      priorityCounts: queueStatus.priorityCounts,
      totalMessages: Object.values(queueStatus.priorityCounts).reduce((sum, count) => sum + count, 0)
    };
  }, [queueStatus]);

  // Auto-ping to keep connection alive
  useEffect(() => {
    if (!config.enableQueuing) return;

    const pingInterval = setInterval(() => {
      if (queueStatus.size === 0) {
        sendPing();
      }
    }, 30000); // Ping every 30 seconds if queue is empty

    return () => clearInterval(pingInterval);
  }, [config.enableQueuing, queueStatus.size, sendPing]);

  return {
    // Message sending
    sendMessage,
    sendNotification,
    sendPing,
    sendEcho,
    
    // Queue management
    clearQueue,
    removeMessage,
    getMessage,
    
    // Deduplication
    isDuplicate,
    
    // Status and stats
    queueStatus,
    getDeduplicationStats
  };
}
