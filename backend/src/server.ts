// ws-server.ts
const server = Bun.serve({
    port: 3001,
    fetch(req, server) {
      const { pathname } = new URL(req.url);
      if (pathname === "/ws") {
        // อัปเกรดเป็น WebSocket
        if (server.upgrade(req)) return; // ห้าม return Response ถ้าอัปเกรดสำเร็จ
        return new Response("Upgrade failed", { status: 500 });
      }
      return new Response("OK");
    },
    websocket: {
      open(ws) {
        // ใครเข้ามา เราให้เข้าห้อง "admin" ไว้ยิงรวม
        ws.subscribe("admin");
        ws.send(JSON.stringify({ type: "WELCOME", msg: "connected" }));
      },
      message(ws, message) {
        // แค่ echo กลับไว้ดูว่ารับ-ส่งได้
        ws.send(JSON.stringify({ type: "ECHO", data: String(message) }));
      },
      close(ws) {
        // ปิดก็แค่เงียบ ๆ
      },
    },
  });
  
  console.log(`HTTP/WS on http://localhost:${server.port}`);
  
  // ตัวอย่าง broadcast ทุก 15 วิ (เอาออกได้)
  setInterval(() => {
    server.publish("admin", JSON.stringify({
      type: "ADMIN_NOTIFICATION",
      data: { title: "Ping", createdAt: Date.now() }
    }));
  }, 15000);
  
  // export helper เผื่อคุณอยาก import ไปยิงจากไฟล์อื่น
  export function notifyAdmin(payload: unknown) {
    server.publish("admin", JSON.stringify(payload));
  }
  