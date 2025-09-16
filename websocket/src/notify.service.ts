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
          // Try to parse incoming message and broadcast when appropriate
          try {
            let text: string
            if (typeof m === 'string') text = m
            else if (m instanceof ArrayBuffer) text = new TextDecoder().decode(m)
            else if (m instanceof Uint8Array) text = new TextDecoder().decode(m)
            else text = String(m)

            const payload = JSON.parse(text)
            // If backend pushes an ADMIN_NOTIFICATION, broadcast to all admins
            if (payload && payload.type === 'ADMIN_NOTIFICATION') {
              server.publish('admin', JSON.stringify(payload))
              console.log('📣 Broadcast ADMIN_NOTIFICATION to admin topic')
              return
            }
          } catch (_) {
            // fall through to echo for debugging when parsing fails
          }

          // echo for debugging
          ws.send(JSON.stringify({ type: 'ECHO', data: String(m) }))
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
  