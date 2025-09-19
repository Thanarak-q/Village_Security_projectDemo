/**
 * WebSocket client for sending notifications to the WebSocket service
 */

interface WebSocketNotification {
  id: string;
  title: string;
  body?: string;
  level?: 'info' | 'warning' | 'critical';
  createdAt: number;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      // Use Docker service name when running in Docker, localhost when running locally
      const wsUrl = 'ws://websocket:3002/ws';
      console.log('🔗 Attempting to connect to:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🔗 Connected to WebSocket service');
        this.reconnectAttempts = 0;
      };

      this.ws.onclose = (event) => {
        console.log('🔌 Disconnected from WebSocket service:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        this.ws = null;
        
        // Only attempt reconnect if it wasn't a clean close
        if (!event.wasClean) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', {
          type: error.type,
          target: error.target,
          currentTarget: error.currentTarget,
          timestamp: new Date().toISOString()
        });
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Reconnecting to WebSocket service in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached. WebSocket service unavailable.');
    }
  }

  public sendNotification(notification: WebSocketNotification): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          console.warn('⚠️ WebSocket not connected, notification not sent:', notification.title);
          resolve(false);
          return;
        }

        const message = {
          type: 'ADMIN_NOTIFICATION',
          data: notification
        };
        
        // Add error handling for JSON serialization
        let serializedMessage: string;
        try {
          serializedMessage = JSON.stringify(message);
        } catch (jsonError) {
          console.error('❌ Failed to serialize notification:', jsonError);
          resolve(false);
          return;
        }

        // Add error handling for WebSocket send
        try {
          this.ws.send(serializedMessage);
          console.log('📤 Notification sent to WebSocket service:', notification.title);
          resolve(true);
        } catch (sendError) {
          console.error('❌ Failed to send notification via WebSocket:', sendError);
          resolve(false);
        }
      } catch (error) {
        console.error('❌ Unexpected error in sendNotification:', error);
        resolve(false);
      }
    });
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
export const websocketClient = new WebSocketClient();
