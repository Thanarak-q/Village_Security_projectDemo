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

// Constants for validation and limits
const MAX_MESSAGE_SIZE = 64 * 1024; // 64KB
const MAX_CONNECTIONS_PER_USER = 5;
const VALID_MESSAGE_TYPES = ['auth', 'ping', 'subscribe', 'pong'];

class WebSocketService {
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set of connectionIds
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Validate incoming WebSocket message
   */
  private validateMessage(data: any, messageSize: number): { valid: boolean; error?: string } {
    // Check message size
    if (messageSize > MAX_MESSAGE_SIZE) {
      return { valid: false, error: 'Message too large' };
    }

    // Check if data is valid object
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid message format' };
    }

    // Check message type
    if (!data.type || !VALID_MESSAGE_TYPES.includes(data.type)) {
      return { valid: false, error: 'Invalid message type' };
    }

    // Validate auth message
    if (data.type === 'auth') {
      if (!data.token || typeof data.token !== 'string') {
        return { valid: false, error: 'Auth message requires valid token' };
      }
    }

    return { valid: true };
  }

  /**
   * Check rate limiting for WebSocket messages
   */
  private checkRateLimit(connectionId: string): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 60; // 60 requests per minute

    // Clean expired entries
    this.rateLimitMap.forEach((value, key) => {
      if (now > value.resetTime) {
        this.rateLimitMap.delete(key);
      }
    });

    const rateData = this.rateLimitMap.get(connectionId);
    if (!rateData) {
      this.rateLimitMap.set(connectionId, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (rateData.count >= maxRequests) {
      return false;
    }

    rateData.count++;
    return true;
  }

  /**
   * Check connection limits per user
   */
  private checkConnectionLimit(userId: string): boolean {
    const userConnections = this.userConnections.get(userId);
    return !userConnections || userConnections.size < MAX_CONNECTIONS_PER_USER;
  }

  /**
   * Clean up dead connections
   */
  private cleanupDeadConnections() {
    const deadConnections: string[] = [];
    
    this.clients.forEach((ws, connectionId) => {
      if (!ws.readyState || ws.readyState !== 1) { // Not OPEN
        deadConnections.push(connectionId);
      }
    });

    deadConnections.forEach(connectionId => {
      const ws = this.clients.get(connectionId);
      if (ws) {
        this.handleDisconnection(ws);
      }
    });

    if (deadConnections.length > 0) {
      console.log(`🧹 Cleaned up ${deadConnections.length} dead connections`);
    }
  }

  /**
   * Initialize WebSocket server (no longer needed with Elysia)
   */
  initialize(server: any) {
    console.log('🔌 WebSocket service initialized for notifications');
    
    // Set up periodic cleanup of dead connections
    setInterval(() => {
      this.cleanupDeadConnections();
    }, 30000); // Clean up every 30 seconds
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

    console.log(`🔌 WebSocket connection opened: ${connectionId} (Total: ${this.clients.size})`);
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

      // Verify JWT token using environment variable
      const jwtSecret = process.env.JWT_SECRET || 'super-secret';
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Validate decoded token has required fields
      if (!decoded.id || !decoded.role) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid token payload' 
        }));
        ws.close();
        return;
      }

      // Check connection limit for this user
      if (!this.checkConnectionLimit(decoded.id)) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Too many connections for this user' 
        }));
        ws.close();
        return;
      }

      // Set user information
      ws.userId = decoded.id;
      ws.userRole = decoded.role;
      ws.villageKey = decoded.village_key || undefined;
      
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
    const connectionId = this.findConnectionId(ws);
    if (!connectionId) {
      console.error('❌ Connection ID not found for WebSocket message');
      return;
    }

    // Check rate limiting
    if (!this.checkRateLimit(connectionId)) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Rate limit exceeded. Please slow down.' 
      }));
      return;
    }

    // Validate message
    const messageStr = JSON.stringify(message);
    const validation = this.validateMessage(message, messageStr.length);
    if (!validation.valid) {
      console.error('❌ Invalid WebSocket message:', validation.error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: validation.error || 'Invalid message' 
      }));
      return;
    }

    // Handle valid messages
    try {
      switch (message.type) {
        case 'auth':
          this.authenticateConnection(ws, message.token, connectionId);
          break;
        case 'ping':
          ws.isAlive = true; // Mark as alive
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        case 'pong':
          ws.isAlive = true; // Mark as alive
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
    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Internal server error' 
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
          ws.villageKey && 
          ws.villageKey === villageKey) {
        try {
          ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error('❌ Error sending WebSocket message:', error);
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
