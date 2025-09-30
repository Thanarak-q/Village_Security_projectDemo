// src/ws/notify.service.ts
import { simpleMessageQueue } from './messageQueue';

const ADMIN_TOPIC_PREFIX = 'admin:';

const sanitizeVillageId = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // UUID format validation: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(trimmed)) {
    return null;
  }

  return trimmed.toLowerCase();
};

const getAdminTopic = (villageId: string) => `${ADMIN_TOPIC_PREFIX}${villageId}`;

export type AdminNotification = {
    id: string
    title: string
    body?: string
    level?: 'info' | 'warning' | 'critical'
    createdAt: number // epoch ms
    villageId: string
    type?: string
    category?: string
    data?: Record<string, unknown> | null
  }
  
export type NotifyService = {
    port: number
    path: string
    publishAdmin: (n: AdminNotification) => string
    publishTopic: (topic: string, payload: unknown) => number
  }
  
  type StartOptions = {
    port?: number      // ค่าเริ่มต้น 3002
    path?: string      // ค่าเริ่มต้น /ws
    idleTimeout?: number // ค่าเริ่มต้น 120 วินาที
  }
  
  export function startNotifyService(
    { port = 3002, path = '/ws', idleTimeout = 120 }: StartOptions = {}
  ): NotifyService {
    const server = Bun.serve({
      port,
      fetch(req, s) {
        const { pathname } = new URL(req.url)
        if (pathname === path) {
          if (s.upgrade(req)) return
          return new Response('WebSocket upgrade required', { 
            status: 426,
            headers: {
              'Upgrade': 'websocket',
              'Connection': 'Upgrade',
              'Sec-WebSocket-Accept': 'websocket'
            }
          })
        }
        return new Response('WebSocket Notification Service', { 
          status: 200,
          headers: {
            'Content-Type': 'text/plain'
          }
        })
      },
      websocket: {
        idleTimeout,
        open(ws) {
          ws.data = {
            currentAdminTopic: null as string | null,
            villageId: null as string | null,
            connectionId: Math.random().toString(36).substring(7),
            connectedAt: Date.now()
          };

          console.log('🔗 New WebSocket connection:', ws.data.connectionId);
          ws.send(JSON.stringify({ 
            type: 'WELCOME', 
            msg: 'connected',
            connectionId: ws.data.connectionId,
            timestamp: Date.now()
          }))
        },
        message(ws, m) {
          try {
            let text: string
            if (typeof m === 'string') text = m
            else if (m instanceof ArrayBuffer) text = new TextDecoder().decode(m)
            else if (m instanceof Uint8Array) text = new TextDecoder().decode(m)
            else text = String(m)

            const payload = JSON.parse(text)
            
            // Validate payload structure
            if (!payload || typeof payload !== 'object') {
              console.warn('⚠️ Invalid payload structure received:', payload);
              ws.send(JSON.stringify({ 
                type: 'ERROR', 
                error: 'Invalid payload structure',
                timestamp: Date.now()
              }));
              return;
            }

            // Handle admin subscription requests
            if (payload.type === 'SUBSCRIBE_ADMIN') {
              const requestedVillageId = sanitizeVillageId(payload.data?.villageId);

              if (!requestedVillageId) {
                ws.send(JSON.stringify({
                  type: 'ERROR',
                  error: 'Invalid village ID',
                  timestamp: Date.now()
                }));
                return;
              }

              const topic = getAdminTopic(requestedVillageId);

              if (ws.data?.currentAdminTopic && ws.data.currentAdminTopic !== topic) {
                ws.unsubscribe(ws.data.currentAdminTopic);
              }

              ws.subscribe(topic);
              ws.data = {
                ...ws.data,
                currentAdminTopic: topic,
                villageId: requestedVillageId
              };

              ws.send(JSON.stringify({
                type: 'SUBSCRIBED_ADMIN',
                villageId: requestedVillageId,
                timestamp: Date.now()
              }));
              return;
            }

            // If backend pushes an ADMIN_NOTIFICATION, broadcast to the correct village topic
            if (payload.type === 'ADMIN_NOTIFICATION') {
              try {
                // Validate notification structure
                if (!payload.data || !payload.data.id || !payload.data.title) {
                  console.warn('⚠️ Invalid ADMIN_NOTIFICATION structure:', payload);
                  ws.send(JSON.stringify({ 
                    type: 'ERROR', 
                    error: 'Invalid notification structure',
                    timestamp: Date.now()
                  }));
                  return;
                }

                const targetVillageId = sanitizeVillageId(payload.data.villageId);

                if (!targetVillageId) {
                  console.warn('⚠️ ADMIN_NOTIFICATION missing valid village ID:', payload);
                  ws.send(JSON.stringify({
                    type: 'ERROR',
                    error: 'Notification missing village ID',
                    timestamp: Date.now()
                  }));
                  return;
                }

                const topic = getAdminTopic(targetVillageId);
                server.publish(topic, JSON.stringify(payload));
                console.log('📣 Broadcast ADMIN_NOTIFICATION to topic', topic, 'title:', payload.data.title);
                return;
              } catch (broadcastError) {
                console.error('❌ Failed to broadcast notification:', broadcastError);
                ws.send(JSON.stringify({ 
                  type: 'ERROR', 
                  error: 'Broadcast failed',
                  timestamp: Date.now()
                }));
                return;
              }
            }

            // Handle other message types
            if (payload.type === 'PING') {
              ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
              return;
            }

          } catch (parseError) {
            console.error('❌ Failed to parse WebSocket message:', {
              error: parseError instanceof Error ? parseError.message : String(parseError),
              message: String(m).substring(0, 100), // Log first 100 chars
              timestamp: Date.now()
            });
            
            // Send error response instead of echo
            try {
              ws.send(JSON.stringify({ 
                type: 'ERROR', 
                error: 'Message parsing failed',
                timestamp: Date.now()
              }));
            } catch (sendError) {
              console.error('❌ Failed to send error response:', sendError);
            }
            return;
          }

          // echo for debugging (fallback)
          try {
            ws.send(JSON.stringify({ type: 'ECHO', data: String(m), timestamp: Date.now() }));
          } catch (echoError) {
            console.error('❌ Failed to send echo response:', echoError);
          }
        },
        close(ws) {
          if (ws.data?.connectionId) {
            console.log('🔌 WebSocket disconnected:', ws.data.connectionId);
          }
        }
      }
    })
  
    console.log(`🔔 WS notify on http://localhost:${server.port}${path}`)
  
    const publishTopic = (topic: string, payload: unknown) =>
      server.publish(topic, JSON.stringify(payload))

    const publishAdmin = (n: AdminNotification) => {
      const sanitizedVillageId = sanitizeVillageId(n.villageId);

      if (!sanitizedVillageId) {
        console.error('❌ Cannot queue admin notification without valid village ID:', n);
        return 'invalid_village_id';
      }

      const topic = getAdminTopic(sanitizedVillageId);
      const payload = {
        ...n,
        villageId: sanitizedVillageId
      };

      // Use simple message queue for deduplication and queuing
      const messageId = simpleMessageQueue.enqueue('ADMIN_NOTIFICATION', payload, {
        priority: n.level === 'critical' ? 'critical' : 'normal',
        maxRetries: 3,
        metadata: { 
          type: 'admin_notification',
          level: n.level || 'info',
          notificationId: n.id,
          topic
        }
      });
      
      console.log(`📤 Admin notification queued: ${messageId}`);
      
      // Process queued messages
      simpleMessageQueue.processQueue(async (message) => {
        try {
          const targetTopic = typeof message.metadata?.topic === 'string'
            ? message.metadata.topic
            : getAdminTopic(
                sanitizeVillageId(
                  (message.data && typeof message.data === 'object' && 'villageId' in (message.data as Record<string, unknown>))
                    ? (message.data as Record<string, unknown>).villageId
                    : ''
                ) || 'unknown'
              );

          if (!targetTopic || targetTopic.endsWith('unknown')) {
            console.warn('⚠️ Skipping message with unknown village topic:', message.id);
            return true;
          }

          server.publish(targetTopic, JSON.stringify({ type: message.type, data: message.data }));
          return true;
        } catch (error) {
          console.error(`❌ Failed to publish message ${message.id}:`, error);
          return false;
        }
      });
      
      return messageId;
    }
  
    return { port: server.port ?? 0, path, publishAdmin, publishTopic }
  }
  
