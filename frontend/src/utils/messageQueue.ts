/**
 * @file Message Queue System
 * Provides message deduplication, queuing, and delivery guarantees
 */

export interface QueuedMessage {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  expiresAt?: number;
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
  maxQueueSize: 1000,
  maxRetries: 3,
  retryDelay: 1000,
  maxRetryDelay: 30000,
  cleanupInterval: 60000, // 1 minute
  deduplicationWindow: 300000 // 5 minutes
};

export class MessageQueue {
  private queue: QueuedMessage[] = [];
  private processing = false;
  private options: MessageQueueOptions;
  private seenMessages = new Set<string>();
  private cleanupInterval?: NodeJS.Timeout;
  private processingTimeout?: NodeJS.Timeout;

  constructor(options: Partial<MessageQueueOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
    this.startCleanup();
  }

  private generateMessageId(type: string, data: unknown): string {
    const dataString = JSON.stringify(data);
    const timestamp = Date.now();
    return `${type}_${btoa(dataString).slice(0, 8)}_${timestamp}`;
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
    this.queue = this.queue.filter(message => {
      if (message.expiresAt && message.expiresAt < now) {
        console.log(`🗑️ Message expired: ${message.id}`);
        return false;
      }
      return true;
    });
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

  public enqueue(
    type: string,
    data: unknown,
    options: {
      priority?: QueuedMessage['priority'];
      maxRetries?: number;
      expiresAt?: number;
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
      metadata: options.metadata
    };

    this.queue.push(message);
    this.addToSeen(messageId);
    this.sortQueue();

    console.log(`📥 Message queued: ${messageId} (priority: ${message.priority})`);
    
    // Start processing if not already running.
    // The queue cannot process without a processor, which must be registered externally.

    return messageId;
  }

  public async processQueue(processor: (message: QueuedMessage) => Promise<boolean>): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const message = this.queue[0];
      
      try {
        const success = await processor(message);
        
        if (success) {
          // Message processed successfully, remove from queue
          this.queue.shift();
          console.log(`✅ Message processed: ${message.id}`);
        } else {
          // Processing failed, handle retry logic
          await this.handleRetry(message);
        }
      } catch (error) {
        console.error(`❌ Error processing message ${message.id}:`, error);
        await this.handleRetry(message);
      }
    }

    this.processing = false;
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
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }
  }
}

// Singleton instance
export const messageQueue = new MessageQueue();
