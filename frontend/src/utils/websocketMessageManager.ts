/**
 * @file WebSocket Message Manager
 * Manages WebSocket message deduplication, queuing, and delivery
 */

import { messageQueue, QueuedMessage } from './messageQueue';

export interface WebSocketMessage {
  type: string;
  data: unknown;
  id?: string;
  timestamp?: number;
}

export interface WebSocketMessageManagerOptions {
  enableDeduplication: boolean;
  enableQueuing: boolean;
  maxQueueSize: number;
  retryDelay: number;
  maxRetries: number;
  deduplicationWindow: number;
}

const defaultOptions: WebSocketMessageManagerOptions = {
  enableDeduplication: true,
  enableQueuing: true,
  maxQueueSize: 100,
  retryDelay: 1000,
  maxRetries: 3,
  deduplicationWindow: 300000 // 5 minutes
};

export class WebSocketMessageManager {
  private options: WebSocketMessageManagerOptions;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private messageHandlers = new Map<string, (data: unknown) => void>();
  private defaultHandler: ((message: WebSocketMessage) => void) | null = null;
  private connectionHandlers = new Set<(connected: boolean) => void>();
  private messageQueue = messageQueue;

  constructor(options: Partial<WebSocketMessageManagerOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
    this.setupMessageProcessor();
  }

  private setupMessageProcessor(): void {
    // Process queued messages when WebSocket is available
    this.messageQueue.processQueue(async (message: QueuedMessage) => {
      if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return false; // Will retry later
      }

      try {
        this.ws.send(JSON.stringify({
          type: message.type,
          data: message.data,
          id: message.id,
          timestamp: message.timestamp
        }));
        
        console.log(`📤 Queued message sent: ${message.id}`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to send queued message ${message.id}:`, error);
        return false;
      }
    });
  }

  public setWebSocket(ws: WebSocket | null): void {
    this.ws = ws;
    this.isConnected = ws !== null && ws.readyState === WebSocket.OPEN;
    
    // Notify connection handlers
    this.connectionHandlers.forEach(handler => handler(this.isConnected));
    
    if (this.isConnected) {
      console.log('🔗 WebSocket connected, processing queued messages');
      this.messageQueue.processQueue(async (message: QueuedMessage) => {
        try {
          this.ws!.send(JSON.stringify({
            type: message.type,
            data: message.data,
            id: message.id,
            timestamp: message.timestamp
          }));
          return true;
        } catch (error) {
          console.error(`❌ Failed to send queued message:`, error);
          return false;
        }
      });
    }
  }

  public sendMessage(
    type: string,
    data: unknown,
    options: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      maxRetries?: number;
      expiresAt?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): string {
    const messageId = this.generateMessageId(type, data);
    
    if (this.options.enableDeduplication && this.isDuplicate(messageId)) {
      console.log(`🔄 Duplicate message ignored: ${messageId}`);
      return messageId;
    }

    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Send immediately if connected
      try {
        this.ws.send(JSON.stringify({
          type,
          data,
          id: messageId,
          timestamp: Date.now()
        }));
        
        console.log(`📤 Message sent immediately: ${messageId}`);
        return messageId;
      } catch (error) {
        console.error(`❌ Failed to send message immediately:`, error);
        // Fall through to queuing
      }
    }

    if (this.options.enableQueuing) {
      // Queue message for later delivery
      return this.messageQueue.enqueue(type, data, {
        priority: options.priority || 'normal',
        maxRetries: options.maxRetries,
        expiresAt: options.expiresAt,
        metadata: options.metadata
      });
    }

    console.warn(`⚠️ Message not sent (no connection and queuing disabled): ${messageId}`);
    return messageId;
  }

  private generateMessageId(type: string, data: unknown): string {
    const dataString = JSON.stringify(data);
    const timestamp = Date.now();
    return `${type}_${btoa(dataString).slice(0, 8)}_${timestamp}`;
  }

  private isDuplicate(_messageId: string): boolean {
    void _messageId;
    // Check if message was recently sent
    // This is a simplified check - in a real implementation,
    // you'd want to check against actual message content
    return false;
  }

  public onMessage(handler: (message: WebSocketMessage) => void): void {
    this.defaultHandler = handler;
  }

  public onMessageType(type: string, handler: (data: unknown) => void): void {
    this.messageHandlers.set(type, handler);
  }

  public onConnectionChange(handler: (connected: boolean) => void): void {
    this.connectionHandlers.add(handler);
  }

  public removeConnectionHandler(handler: (connected: boolean) => void): void {
    this.connectionHandlers.delete(handler);
  }

  public handleIncomingMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Call type-specific handler if exists
      const typeHandler = this.messageHandlers.get(message.type);
      if (typeHandler) {
        typeHandler(message.data);
        return;
      }
      
      // Call default handler
      if (this.defaultHandler) {
        this.defaultHandler(message);
        return;
      }
      
      console.warn(`⚠️ No handler for message type: ${message.type}`);
    } catch (error) {
      console.error(`❌ Failed to parse incoming message:`, error);
    }
  }

  public getQueueStatus() {
    return this.messageQueue.getQueueStatus();
  }

  public clearQueue(): void {
    this.messageQueue.clearQueue();
  }

  public removeMessage(messageId: string): boolean {
    return this.messageQueue.removeMessage(messageId);
  }

  public getMessage(messageId: string) {
    return this.messageQueue.getMessage(messageId);
  }

  public destroy(): void {
    this.messageQueue.destroy();
    this.messageHandlers.clear();
    this.defaultHandler = null;
    this.connectionHandlers.clear();
  }
}

// Singleton instance
export const websocketMessageManager = new WebSocketMessageManager();
