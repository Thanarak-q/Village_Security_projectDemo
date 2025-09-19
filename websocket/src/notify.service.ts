// src/ws/notify.service.ts
export type AdminNotification = {
    id: string
    title: string
    body?: string
    level?: 'info' | 'warning' | 'critical'
    createdAt: number // epoch ms
  }
  
  export type NotifyService = {
    port: number
    path: string
    publishAdmin: (n: AdminNotification) => number
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
          return new Response('Upgrade failed', { status: 500 })
        }
        return new Response('OK')
      },
      websocket: {
        idleTimeout,
        open(ws) {
          // ใครเข้ามาให้เข้าห้อง "admin" สำหรับ broadcast
          ws.subscribe('admin')
          ws.send(JSON.stringify({ type: 'WELCOME', msg: 'connected' }))
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

            // If backend pushes an ADMIN_NOTIFICATION, broadcast to all admins
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

                server.publish('admin', JSON.stringify(payload));
                console.log('📣 Broadcast ADMIN_NOTIFICATION to admin topic:', payload.data.title);
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
        close() {
          // no-op
        }
      }
    })
  
    console.log(`🔔 WS notify on http://localhost:${server.port}${path}`)
  
    const publishTopic = (topic: string, payload: unknown) =>
      server.publish(topic, JSON.stringify(payload))
  
    const publishAdmin = (n: AdminNotification) =>
      publishTopic('admin', { type: 'ADMIN_NOTIFICATION', data: n })
  
    return { port: server.port ?? 0, path, publishAdmin, publishTopic }
  }
  