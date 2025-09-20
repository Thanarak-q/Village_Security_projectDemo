/**
 * @file Simple Message Queue for WebSocket Service
 * Lightweight message queue for WebSocket service
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
  targetClients?: string[];
  metadata?: Record<string, unknown>;
}

export class SimpleMessageQueue {
  private queue: QueuedMessage[] = [];
  private processing = false;
  private seenMessages = new Set<string>();
  private maxQueueSize = 1000;
  private maxRetries = 3;
  private retryDelay = 1000;
  private maxRetryDelay = 30000;

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
    
    // Clean up old seen messages after 5 minutes
    setTimeout(() => {
      this.seenMessages.delete(messageId);
    }, 300000);
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
    if (this.queue.length >= this.maxQueueSize) {
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
      maxRetries: options.maxRetries || this.maxRetries,
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

  public async processQueue(sendFunction: (message: QueuedMessage) => Promise<boolean>): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const message = this.queue[0];
      
      try {
        const success = await sendFunction(message);
        
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
      this.retryDelay * Math.pow(2, message.retryCount - 1),
      this.maxRetryDelay
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
}

// Singleton instance
export const simpleMessageQueue = new SimpleMessageQueue();
