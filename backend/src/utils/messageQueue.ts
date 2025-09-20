/**
 * @file Backend Message Queue System
 * Provides server-side message queuing and deduplication
 */

import { WebSocket } from 'ws';

export interface QueuedMessage {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  expiresAt?: number;
  targetClients?: string[];
  metadata?: Record<string, unknown>;
}

export interface MessageQueueOptions {
  maxQueueSize: number;
  maxRetries: number;
  retryDelay: number;
  maxRetryDelay: number;
  cleanupInterval: number;
  deduplicationWindow: number;
}

const defaultOptions: MessageQueueOptions = {
  maxQueueSize: 10000,
  maxRetries: 5,
  retryDelay: 1000,
  maxRetryDelay: 60000,
  cleanupInterval: 60000, // 1 minute
  deduplicationWindow: 300000 // 5 minutes
};

export class BackendMessageQueue {
  private queue: QueuedMessage[] = [];
  private processing = false;
  private options: MessageQueueOptions;
  private seenMessages = new Set<string>();
  private cleanupInterval?: NodeJS.Timeout;
  private processingTimeout?: NodeJS.Timeout;
  private clients = new Map<string, WebSocket>();

  constructor(options: Partial<MessageQueueOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
    this.startCleanup();
  }

  private generateMessageId(type: string, data: unknown): string {
    const dataString = JSON.stringify(data);
    const timestamp = Date.now();
    return `${type}_${Buffer.from(dataString).toString('base64').slice(0, 8)}_${timestamp}`;
  }

  private isDuplicate(messageId: string): boolean {
    return this.seenMessages.has(messageId);
  }

  private addToSeen(messageId: string): void {
    this.seenMessages.add(messageId);
    
    // Clean up old seen messages
    setTimeout(() => {
      this.seenMessages.delete(messageId);
    }, this.options.deduplicationWindow);
  }

  private cleanupExpiredMessages(): void {
    const now = Date.now();
    const initialSize = this.queue.length;
    
    this.queue = this.queue.filter(message => {
      if (message.expiresAt && message.expiresAt < now) {
        console.log(`🗑️ Message expired: ${message.id}`);
        return false;
      }
      return true;
    });

    const cleanedCount = initialSize - this.queue.length;
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired messages`);
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredMessages();
    }, this.options.cleanupInterval);
  }

  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Then by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  public addClient(clientId: string, ws: WebSocket): void {
    this.clients.set(clientId, ws);
    console.log(`👤 Client added: ${clientId} (total: ${this.clients.size})`);
  }

  public removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`👤 Client removed: ${clientId} (total: ${this.clients.size})`);
  }

  public enqueue(
    type: string,
    data: unknown,
    options: {
      priority?: QueuedMessage['priority'];
      maxRetries?: number;
      expiresAt?: number;
      targetClients?: string[];
      metadata?: Record<string, unknown>;
    } = {}
  ): string {
    const messageId = this.generateMessageId(type, data);
    
    // Check for duplicates
    if (this.isDuplicate(messageId)) {
      console.log(`🔄 Duplicate message ignored: ${messageId}`);
      return messageId;
    }

    // Check queue size
    if (this.queue.length >= this.options.maxQueueSize) {
      // Remove oldest low priority message
      const oldestLowPriorityIndex = this.queue.findIndex(m => m.priority === 'low');
      if (oldestLowPriorityIndex !== -1) {
        this.queue.splice(oldestLowPriorityIndex, 1);
        console.log(`🗑️ Removed oldest low priority message to make room`);
      } else {
        console.warn(`⚠️ Queue full, message dropped: ${messageId}`);
        return messageId;
      }
    }

    const message: QueuedMessage = {
      id: messageId,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: options.maxRetries || this.options.maxRetries,
      priority: options.priority || 'normal',
      expiresAt: options.expiresAt,
      targetClients: options.targetClients,
      metadata: options.metadata
    };

    this.queue.push(message);
    this.addToSeen(messageId);
    this.sortQueue();

    console.log(`📥 Message queued: ${messageId} (priority: ${message.priority})`);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return messageId;
  }

  public async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const message = this.queue[0];
      
      try {
        const success = await this.sendMessage(message);
        
        if (success) {
          // Message sent successfully, remove from queue
          this.queue.shift();
          console.log(`✅ Message processed: ${message.id}`);
        } else {
          // Sending failed, handle retry logic
          await this.handleRetry(message);
        }
      } catch (error) {
        console.error(`❌ Error processing message ${message.id}:`, error);
        await this.handleRetry(message);
      }
    }

    this.processing = false;
  }

  private async sendMessage(message: QueuedMessage): Promise<boolean> {
    const messageData = {
      type: message.type,
      data: message.data,
      id: message.id,
      timestamp: message.timestamp
    };

    const messageString = JSON.stringify(messageData);
    let successCount = 0;
    let totalTargets = 0;

    if (message.targetClients && message.targetClients.length > 0) {
      // Send to specific clients
      totalTargets = message.targetClients.length;
      for (const clientId of message.targetClients) {
        const client = this.clients.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
          try {
            client.send(messageString);
            successCount++;
          } catch (error) {
            console.error(`❌ Failed to send to client ${clientId}:`, error);
          }
        }
      }
    } else {
      // Broadcast to all clients
      totalTargets = this.clients.size;
      for (const [clientId, client] of this.clients.entries()) {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(messageString);
            successCount++;
          } catch (error) {
            console.error(`❌ Failed to send to client ${clientId}:`, error);
          }
        }
      }
    }

    // Consider successful if at least one client received the message
    return successCount > 0;
  }

  private async handleRetry(message: QueuedMessage): Promise<void> {
    message.retryCount++;
    
    if (message.retryCount > message.maxRetries) {
      // Max retries exceeded, remove from queue
      this.queue.shift();
      console.error(`❌ Message failed after ${message.maxRetries} retries: ${message.id}`);
      return;
    }

    // Calculate retry delay with exponential backoff
    const delay = Math.min(
      this.options.retryDelay * Math.pow(2, message.retryCount - 1),
      this.options.maxRetryDelay
    );

    console.log(`🔄 Retrying message ${message.id} in ${delay}ms (attempt ${message.retryCount}/${message.maxRetries})`);
    
    // Move message to end of queue for retry
    this.queue.shift();
    this.queue.push(message);

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  public getQueueStatus(): {
    size: number;
    processing: boolean;
    clientCount: number;
    oldestMessage?: number;
    newestMessage?: number;
    priorityCounts: Record<string, number>;
  } {
    const priorityCounts: Record<string, number> = {};
    this.queue.forEach(message => {
      priorityCounts[message.priority] = (priorityCounts[message.priority] || 0) + 1;
    });

    return {
      size: this.queue.length,
      processing: this.processing,
      clientCount: this.clients.size,
      oldestMessage: this.queue.length > 0 ? this.queue[0].timestamp : undefined,
      newestMessage: this.queue.length > 0 ? this.queue[this.queue.length - 1].timestamp : undefined,
      priorityCounts
    };
  }

  public clearQueue(): void {
    this.queue = [];
    this.seenMessages.clear();
    console.log(`🧹 Message queue cleared`);
  }

  public removeMessage(messageId: string): boolean {
    const index = this.queue.findIndex(m => m.id === messageId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      console.log(`🗑️ Message removed: ${messageId}`);
      return true;
    }
    return false;
  }

  public getMessage(messageId: string): QueuedMessage | undefined {
    return this.queue.find(m => m.id === messageId);
  }

  public destroy(): void {
    this.stopCleanup();
    this.clearQueue();
    this.clients.clear();
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }
  }
}

// Singleton instance
export const backendMessageQueue = new BackendMessageQueue();
