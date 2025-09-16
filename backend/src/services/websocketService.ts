/**
 * @file WebSocket service for real-time notifications
 * This service manages WebSocket connections and broadcasts notifications to connected clients
 */

import * as jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket {
  userId?: string;
  userRole?: string;
  villageKey?: string;
  isAlive?: boolean;
  send: (data: string) => void;
  close: () => void;
  readyState?: number;
  [key: string]: any; // Allow additional properties
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
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set of connectionIds

  /**
   * Initialize WebSocket server (no longer needed with Elysia)
   */
  initialize(server: any) {
    console.log('🔌 WebSocket service initialized for notifications');
  }

  /**
   * Handle new WebSocket connection (called by Elysia)
   */
  handleConnection(ws: AuthenticatedWebSocket) {
    const connectionId = this.generateConnectionId();
    
    // Set up connection properties
    ws.isAlive = true;
    ws.readyState = 1; // OPEN

    // Store connection
    this.clients.set(connectionId, ws);

    // Send authentication request
    ws.send(JSON.stringify({ 
      type: 'auth_required', 
      message: 'Please provide authentication token' 
    }));

    console.log(`🔌 WebSocket connection opened: ${connectionId}`);
  }

  /**
   * Authenticate WebSocket connection using JWT token
   */
  private authenticateConnection(ws: AuthenticatedWebSocket, token: string, connectionId: string) {
    try {
      if (!token) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Authentication token required' 
        }));
        ws.close();
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, 'super-secret') as any;
      
      if (!decoded.id || !decoded.role) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid token payload' 
        }));
        ws.close();
        return;
      }

      // Set user information
      ws.userId = decoded.id;
      ws.userRole = decoded.role;
      ws.villageKey = decoded.village_key;
      
      // Track user connections
      if (!this.userConnections.has(ws.userId)) {
        this.userConnections.set(ws.userId, new Set());
      }
      this.userConnections.get(ws.userId)!.add(connectionId);

      // Send authentication success
      const authMessage = { 
        type: 'authenticated', 
        message: 'Connection authenticated successfully' 
      };
      ws.send(JSON.stringify(authMessage));
      console.log(`🔐 Sent authentication success message:`, authMessage);

      console.log(`🔐 WebSocket authenticated: ${ws.userRole} ${ws.userId} (${connectionId})`);
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Authentication failed' 
      }));
      ws.close();
    }
  }

  /**
   * Handle incoming WebSocket messages (called by Elysia)
   */
  handleMessage(ws: AuthenticatedWebSocket, message: any) {
    switch (message.type) {
      case 'auth':
        // Find connection ID for this WebSocket
        const connectionId = this.findConnectionId(ws);
        if (connectionId) {
          this.authenticateConnection(ws, message.token, connectionId);
        }
        break;
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
   * Handle WebSocket disconnection (called by Elysia)
   */
  handleDisconnection(ws: AuthenticatedWebSocket) {
    const connectionId = this.findConnectionId(ws);
    if (connectionId) {
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
  }

  /**
   * Broadcast notification to specific user
   */
  broadcastToUser(userId: string, message: WebSocketMessage) {
    console.log(`📡 Attempting to broadcast to user: ${userId}`);
    console.log(`📡 Message type: ${message.type}`);
    console.log(`📡 Total connections: ${this.clients.size}`);
    console.log(`📡 User connections: ${this.userConnections.size}`);
    
    const userConnections = this.userConnections.get(userId);
    if (!userConnections) {
      console.log(`❌ No WebSocket connections found for user: ${userId}`);
      console.log(`📡 Available users: ${Array.from(this.userConnections.keys()).join(', ')}`);
      return;
    }

    console.log(`📡 Found ${userConnections.size} connections for user ${userId}`);

    let sentCount = 0;
    userConnections.forEach(connectionId => {
      const ws = this.clients.get(connectionId);
      if (ws && ws.readyState === 1) { // OPEN
        try {
          ws.send(JSON.stringify(message));
          sentCount++;
          console.log(`✅ Sent message to connection ${connectionId}`);
        } catch (error) {
          console.error('❌ Error sending WebSocket message:', error);
          this.handleDisconnection(ws);
        }
      } else {
        console.log(`❌ Connection ${connectionId} is not open (readyState: ${ws?.readyState})`);
      }
    });

    console.log(`📡 Broadcasted notification to user ${userId} (${sentCount}/${userConnections.size} connections)`);
  }

  /**
   * Broadcast notification to all admins in a village
   */
  broadcastToVillageAdmins(villageKey: string, message: WebSocketMessage) {
    let sentCount = 0;
    
    this.clients.forEach((ws, connectionId) => {
      if (ws.readyState === 1 && // OPEN
          ws.userRole === 'admin' && 
          ws.villageKey === villageKey) {
        try {
          ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          this.handleDisconnection(ws);
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
      if (ws.readyState === 1) { // OPEN
        try {
          ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          this.handleDisconnection(ws);
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
        this.handleDisconnection(ws);
        ws.close();
        return;
      }

      ws.isAlive = false;
      // Send ping message instead of ws.ping()
      ws.send(JSON.stringify({ type: 'ping' }));
    });
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Find connection ID for a WebSocket instance
   */
  private findConnectionId(ws: AuthenticatedWebSocket): string | null {
    for (const [connectionId, client] of this.clients.entries()) {
      if (client === ws) {
        return connectionId;
      }
    }
    return null;
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
