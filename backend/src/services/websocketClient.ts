/**
 * WebSocket client for sending notifications to the WebSocket service
 */

import { 
  AppError, 
  WebSocketError, 
  ErrorType, 
  ErrorSeverity, 
  errorHandler,
  handleAsyncError 
} from '../utils/errorHandler';
import { errorRecoveryManager, webSocketCircuitBreaker } from '../utils/errorRecovery';
import { errorMonitor } from '../utils/errorMonitoring';

interface WebSocketNotification {
  id: string;
  title: string;
  body?: string;
  level?: 'info' | 'warning' | 'critical';
  createdAt: number;
  villageKey: string;
  type?: string;
  category?: string;
  data?: Record<string, unknown> | null;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private readonly wsEndpoints: string[] = ['ws://websocket:3002/ws'];
  private endpointIndex = 0;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting) {
      console.log('⏳ Connection already in progress, skipping...');
      return;
    }

    try {
      this.isConnecting = true;
      const wsUrl = this.getCurrentWebSocketUrl();
      console.log('🔗 Attempting to connect to:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Connected to WebSocket service');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        const successfulIndex = this.wsEndpoints.indexOf(wsUrl);
        if (successfulIndex > -1) {
          this.endpointIndex = successfulIndex;
        }
        
        // Record successful connection
        errorMonitor.recordError(new AppError(
          'WebSocket connected successfully',
          ErrorType.WEBSOCKET_CONNECTION,
          ErrorSeverity.LOW,
          { timestamp: new Date().toISOString() }
        ));
      };

      this.ws.onclose = (event) => {
        const closeError = new WebSocketError(
          `WebSocket disconnected: ${event.reason || 'Unknown reason'}`,
          {
            websocketId: 'main',
            timestamp: new Date().toISOString()
          }
        );
        
        errorHandler.handleError(closeError);
        errorMonitor.recordError(closeError);
        
        this.ws = null;
        this.isConnecting = false;
        
        // Only attempt reconnect if it wasn't a clean close
        if (!event.wasClean) {
          this.advanceEndpoint();
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        const wsError = new WebSocketError(
          'WebSocket connection error',
          {
            websocketId: 'main',
            timestamp: new Date().toISOString()
          },
          error instanceof Error ? error : new Error('Unknown WebSocket error')
        );
        
        errorHandler.handleError(wsError);
        errorMonitor.recordError(wsError);
        this.isConnecting = false;
      };

    } catch (error) {
      const connectionError = new WebSocketError(
        'Failed to create WebSocket connection',
        {
          websocketId: 'main',
          timestamp: new Date().toISOString()
        },
        error instanceof Error ? error : new Error('Unknown connection error')
      );
      
      errorHandler.handleError(connectionError);
      errorMonitor.recordError(connectionError);
      this.isConnecting = false;
      this.advanceEndpoint();
      this.attemptReconnect();
    }
  }

  private getCurrentWebSocketUrl(): string {
    return this.wsEndpoints[this.endpointIndex] ?? this.wsEndpoints[0];
  }

  private advanceEndpoint() {
    if (this.wsEndpoints.length > 1) {
      this.endpointIndex = (this.endpointIndex + 1) % this.wsEndpoints.length;
      console.log('🔁 Switching WebSocket endpoint to:', this.wsEndpoints[this.endpointIndex]);
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
    return webSocketCircuitBreaker.execute(async () => {
      return await handleAsyncError(
        async () => {
          if (!notification.villageKey || typeof notification.villageKey !== 'string') {
            throw new AppError(
              'Notification missing village key',
              ErrorType.WEBSOCKET_SEND,
              ErrorSeverity.MEDIUM,
              {
                notificationId: notification.id,
                timestamp: new Date().toISOString()
              }
            );
          }

          if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new WebSocketError(
              'WebSocket not connected',
              {
                notificationId: notification.id,
                timestamp: new Date().toISOString()
              }
            );
          }

          const message = {
            type: 'ADMIN_NOTIFICATION',
            data: notification
          };
          
          // Serialize message with error handling
          let serializedMessage: string;
          try {
            serializedMessage = JSON.stringify(message);
          } catch (jsonError) {
            throw new AppError(
              'Failed to serialize notification',
              ErrorType.WEBSOCKET_SEND,
              ErrorSeverity.MEDIUM,
              {
                notificationId: notification.id,
                timestamp: new Date().toISOString()
              },
              false,
              jsonError instanceof Error ? jsonError : new Error('JSON serialization failed')
            );
          }

          // Send message with error handling
          try {
            this.ws.send(serializedMessage);
            console.log('📤 Notification sent to WebSocket service:', notification.title);
            
            // Record successful send
            errorMonitor.recordError(new AppError(
              'Notification sent successfully',
              ErrorType.WEBSOCKET_SEND,
              ErrorSeverity.LOW,
              {
                notificationId: notification.id,
                timestamp: new Date().toISOString()
              }
            ));
            
            return true;
          } catch (sendError) {
            throw new AppError(
              'Failed to send notification via WebSocket',
              ErrorType.WEBSOCKET_SEND,
              ErrorSeverity.HIGH,
              {
                notificationId: notification.id,
                timestamp: new Date().toISOString()
              },
              true,
              sendError instanceof Error ? sendError : new Error('WebSocket send failed')
            );
          }
        },
        ErrorType.WEBSOCKET_SEND,
        {
          notificationId: notification.id,
          timestamp: new Date().toISOString()
        }
      ) || false;
    });
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
export const websocketClient = new WebSocketClient();
