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

      this.ws.onclose = () => {
        console.log('🔌 Disconnected from WebSocket service');
        this.ws = null;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

    } catch (error) {
      console.error('❌ Failed to connect to WebSocket service:', error);
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

  public sendNotification(notification: WebSocketNotification) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'ADMIN_NOTIFICATION',
        data: notification
      };
      
      this.ws.send(JSON.stringify(message));
      console.log('📤 Notification sent to WebSocket service:', notification.title);
      return true;
    } else {
      console.warn('⚠️ WebSocket not connected, notification not sent:', notification.title);
      return false;
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
export const websocketClient = new WebSocketClient();
