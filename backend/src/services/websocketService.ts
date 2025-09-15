/**
 * @file WebSocket service for real-time notifications
 * This service manages WebSocket connections and broadcasts notifications to connected clients
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import * as jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userRole?: string;
  villageKey?: string;
  isAlive?: boolean;
}

interface NotificationMessage {
  type: 'notification';
  data: {
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
  };
}

interface NotificationCountMessage {
  type: 'notification_count';
  data: {
    total: number;
    unread: number;
  };
}

type WebSocketMessage = NotificationMessage | NotificationCountMessage;

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set of connectionIds

  /**
   * Initialize WebSocket server
   */
  initialize(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/notifications'
    });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    // Ping clients every 30 seconds to keep connections alive
    setInterval(() => {
      this.pingClients();
    }, 30000);

    console.log('🔌 WebSocket server initialized for notifications');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: AuthenticatedWebSocket, request: IncomingMessage) {
    const connectionId = this.generateConnectionId();
    
    // Set up connection properties
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle authentication
    this.authenticateConnection(ws, request, connectionId);

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      this.handleDisconnection(connectionId, ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection(connectionId, ws);
    });
  }

  /**
   * Authenticate WebSocket connection using JWT token
   */
  private authenticateConnection(ws: AuthenticatedWebSocket, request: IncomingMessage, connectionId: string) {
    try {
      // Extract token from query parameters or Authorization header
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const token = url.searchParams.get('token') || 
                   request.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Authentication token required' 
        }));
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, 'super-secret') as any;
      
      if (!decoded.id || !decoded.role) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid token payload' 
        }));
        ws.close(1008, 'Invalid token');
        return;
      }

      // Set user information
      ws.userId = decoded.id;
      ws.userRole = decoded.role;
      ws.villageKey = decoded.village_key;

      // Store connection
      this.clients.set(connectionId, ws);
      
      // Track user connections
      if (!this.userConnections.has(ws.userId)) {
        this.userConnections.set(ws.userId, new Set());
      }
      this.userConnections.get(ws.userId)!.add(connectionId);

      // Send authentication success
      ws.send(JSON.stringify({ 
        type: 'authenticated', 
        message: 'Connection authenticated successfully' 
      }));

      console.log(`🔐 WebSocket authenticated: ${ws.userRole} ${ws.userId} (${connectionId})`);
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Authentication failed' 
      }));
      ws.close(1008, 'Authentication failed');
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(ws: AuthenticatedWebSocket, message: any) {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      case 'subscribe':
        // Client can subscribe to specific notification types
        ws.send(JSON.stringify({ 
          type: 'subscribed', 
          message: 'Subscribed to notifications' 
        }));
        break;
      default:
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Unknown message type' 
        }));
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(connectionId: string, ws: AuthenticatedWebSocket) {
    this.clients.delete(connectionId);
    
    if (ws.userId) {
      const userConnections = this.userConnections.get(ws.userId);
      if (userConnections) {
        userConnections.delete(connectionId);
        if (userConnections.size === 0) {
          this.userConnections.delete(ws.userId);
        }
      }
    }

    console.log(`🔌 WebSocket disconnected: ${connectionId}`);
  }

  /**
   * Broadcast notification to specific user
   */
  broadcastToUser(userId: string, message: WebSocketMessage) {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections) {
      console.log(`No WebSocket connections found for user: ${userId}`);
      return;
    }

    let sentCount = 0;
    userConnections.forEach(connectionId => {
      const ws = this.clients.get(connectionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          this.handleDisconnection(connectionId, ws);
        }
      }
    });

    console.log(`📡 Broadcasted notification to user ${userId} (${sentCount} connections)`);
  }

  /**
   * Broadcast notification to all admins in a village
   */
  broadcastToVillageAdmins(villageKey: string, message: WebSocketMessage) {
    let sentCount = 0;
    
    this.clients.forEach((ws, connectionId) => {
      if (ws.readyState === WebSocket.OPEN && 
          ws.userRole === 'admin' && 
          ws.villageKey === villageKey) {
        try {
          ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          this.handleDisconnection(connectionId, ws);
        }
      }
    });

    console.log(`📡 Broadcasted notification to village ${villageKey} admins (${sentCount} connections)`);
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcastToAll(message: WebSocketMessage) {
    let sentCount = 0;
    
    this.clients.forEach((ws, connectionId) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          this.handleDisconnection(connectionId, ws);
        }
      }
    });

    console.log(`📡 Broadcasted notification to all clients (${sentCount} connections)`);
  }

  /**
   * Ping all clients to check if they're alive
   */
  private pingClients() {
    this.clients.forEach((ws, connectionId) => {
      if (ws.isAlive === false) {
        console.log(`🔌 Terminating dead connection: ${connectionId}`);
        this.handleDisconnection(connectionId, ws);
        ws.terminate();
        return;
      }

      ws.isAlive = false;
      ws.ping();
    });
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.clients.size,
      uniqueUsers: this.userConnections.size,
      connectionsByUser: Object.fromEntries(
        Array.from(this.userConnections.entries()).map(([userId, connections]) => [
          userId, 
          connections.size
        ])
      )
    };
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export type { WebSocketMessage, NotificationMessage, NotificationCountMessage };
