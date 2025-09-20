# WebSocket Notification Service

This is a dedicated WebSocket service for the Village Security project that handles real-time notifications.

## Features

- Real-time WebSocket connections
- Admin notification broadcasting
- Topic-based messaging
- Automatic ping for connection testing
- Graceful shutdown handling

## Environment Variables

- `WS_PORT`: WebSocket server port (default: 3002)
- `WS_PATH`: WebSocket endpoint path (default: /ws)
- `WS_IDLE_TIMEOUT`: Connection idle timeout in seconds (default: 120)
- `NODE_ENV`: Environment mode (development/production)

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Run in production mode
bun run start
```

## Docker

```bash
# Build and run with docker-compose
docker-compose -f ../docker-compose.ws.yml up websocket

# Or build standalone
docker build -t village-security-websocket .
docker run -p 3002:3002 village-security-websocket
```

## Testing WebSocket Connection

```javascript
// Browser console
const ws = new WebSocket('ws://localhost:3002/ws');
ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Received:', JSON.parse(event.data));
```

## API

The service provides a `NotifyService` interface:

```typescript
type NotifyService = {
  port: number
  path: string
  publishAdmin: (notification: AdminNotification) => number
  publishTopic: (topic: string, payload: unknown) => number
}
```
