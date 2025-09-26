# 🔌 WebSocket Setup Documentation

## 📋 Architecture Overview

Your Village Security project uses a **dedicated WebSocket service** architecture:

```
Frontend (3000) ──→ Caddy (80) ──→ WebSocket Service (3002)
                        ↓
Backend (3001) ─────────→ WebSocket Service (3002)
```

### ✅ Current Configuration (CORRECT)

1. **WebSocket Service**: Dedicated service on port 3002
2. **Backend**: API server on port 3001, connects to WebSocket service
3. **Frontend**: Connects through Caddy proxy at `/ws`
4. **Caddy**: Routes `/ws` to WebSocket service

## 🚀 Services & Ports

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | Next.js React app |
| Backend | 3001 | Elysia API server |
| **WebSocket** | **3002** | **Real-time notifications** |
| Caddy | 80/443 | Reverse proxy |
| Database | 5432 | PostgreSQL |

## 🔧 Key Configuration Files

### 1. WebSocket Service (`websocket/`)
- **Main file**: `websocket/src/notify.service.ts`
- **Port**: 3002
- **Features**: Village-based notifications, message queuing, error handling

### 2. Backend WebSocket Client (`backend/src/services/websocketClient.ts`)
- **Purpose**: Sends notifications from backend to WebSocket service
- **Connection**: `ws://websocket:3002/ws` (Docker) or `ws://localhost:3002/ws` (local)
- **Features**: Auto-reconnection, error handling, circuit breaker

### 3. Frontend WebSocket Hook (`frontend/src/hooks/useWebSocketNotifications.ts`)
- **Purpose**: Receives real-time notifications in React components
- **Connection**: `ws://localhost/ws` (through Caddy proxy)
- **Features**: Message deduplication, error recovery, village subscription

## 🛠️ What Was Fixed

### ❌ **REMOVED**: Unused WebSocket server in backend
- **File deleted**: `backend/src/server.ts`
- **Reason**: Duplicate WebSocket implementation causing confusion

### ✅ **IMPROVED**: WebSocket client connection logic
- Added Docker environment detection
- Better error handling and reconnection
- Configurable WebSocket URL via environment variables

### ✅ **ENHANCED**: WebSocket service
- Added connection IDs for better debugging
- Improved logging and error handling
- Better connection lifecycle management

## 🧪 Testing Your Setup

Run the test script to verify everything is working:

```bash
# Install dependencies if needed
npm install ws

# Run the test
node test-websocket-setup.js
```

### Expected Output:
```
🧪 Testing WebSocket Setup...

1. Testing Backend → WebSocket Service (port 3002)
   ✅ Backend connection successful!
   📨 Received: WELCOME
   📨 Received: SUBSCRIBED_ADMIN
   ✅ Subscription successful for village: test-village
   ✅ Backend → WebSocket: PASSED

2. Testing Frontend → Caddy → WebSocket Service (port 80/ws)
   ✅ Frontend connection via Caddy successful!
   ✅ Frontend → WebSocket: PASSED

🎉 WebSocket setup test completed!
```

## 🚨 Troubleshooting

### Backend Can't Connect to WebSocket Service
```bash
# Check if WebSocket service is running
docker-compose ps websocket

# Check WebSocket service logs
docker-compose logs websocket

# Restart WebSocket service
docker-compose restart websocket
```

### Frontend Can't Connect Through Caddy
```bash
# Check Caddy configuration
docker-compose logs caddy

# Verify Caddy is routing /ws correctly
curl -I http://localhost/ws
```

### Port Conflicts
```bash
# Check what's using port 3002
lsof -i :3002

# Kill process if needed
sudo kill -9 <PID>
```

## 🔄 Development vs Production

### Development (`docker-compose.yml`)
- Backend connects to: `ws://websocket:3002/ws`
- Frontend connects to: `ws://localhost/ws`
- Environment: `DOCKER_ENV=true`

### Production (`docker-compose-server.yml`)
- Backend connects to: `ws://websocket:3002/ws`
- Frontend connects to: `wss://yourdomain.com/ws`
- Environment: `NODE_ENV=production`

## 📝 Environment Variables

### Backend
```env
# WebSocket connection URL (optional, auto-detected)
WEBSOCKET_URL=ws://websocket:3002/ws

# Docker environment detection
DOCKER_ENV=true
NODE_ENV=production
```

### WebSocket Service
```env
# WebSocket server configuration
WS_PORT=3002
WS_PATH=/ws
WS_IDLE_TIMEOUT=120
NODE_ENV=development
```

## 🎯 How Notifications Work

1. **Backend creates notification** → Sends to WebSocket service
2. **WebSocket service** → Broadcasts to subscribed village clients
3. **Frontend receives** → Shows in UI + browser notification

### Example Notification Flow:
```typescript
// Backend sends notification
await websocketClient.sendNotification({
  id: 'notif-123',
  title: 'New Visitor',
  body: 'Someone is at the gate',
  level: 'info',
  villageKey: 'village-abc',
  createdAt: Date.now()
});

// WebSocket service broadcasts to village subscribers
// Frontend receives and displays notification
```

## ✅ Status Summary

- **✅ WebSocket Service**: Running correctly on port 3002
- **✅ Backend Integration**: Properly connects and sends notifications
- **✅ Frontend Integration**: Receives real-time updates
- **✅ Error Handling**: Comprehensive error recovery
- **✅ Docker Networking**: Correctly configured
- **✅ Caddy Routing**: Properly routes `/ws` to WebSocket service

Your WebSocket setup is **fully functional and optimized**! 🚀
