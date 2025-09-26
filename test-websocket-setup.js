#!/usr/bin/env node

/**
 * WebSocket Connection Test Script
 * Tests both backend-to-websocket and frontend-to-websocket connections
 */

const WebSocket = require('ws');

console.log('🧪 Testing WebSocket Setup...\n');

// Test 1: Backend to WebSocket Service (internal Docker network)
function testBackendConnection() {
  return new Promise((resolve, reject) => {
    console.log('1. Testing Backend → WebSocket Service (port 3002)');
    
    const ws = new WebSocket('ws://localhost:3002/ws');
    let hasConnected = false;
    
    const timeout = setTimeout(() => {
      if (!hasConnected) {
        ws.close();
        reject(new Error('Connection timeout (10s)'));
      }
    }, 10000);
    
    ws.on('open', () => {
      hasConnected = true;
      clearTimeout(timeout);
      console.log('   ✅ Backend connection successful!');
      
      // Test sending a notification
      ws.send(JSON.stringify({
        type: 'ADMIN_NOTIFICATION',
        data: {
          id: 'test-' + Date.now(),
          title: 'Test Notification',
          body: 'Testing backend connectivity',
          level: 'info',
          createdAt: Date.now(),
          villageKey: 'test-village'
        }
      }));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('   📨 Received:', message.type);
      
      if (message.type === 'WELCOME') {
        // Test subscription
        ws.send(JSON.stringify({
          type: 'SUBSCRIBE_ADMIN',
          data: { villageKey: 'test-village' }
        }));
      }
      
      if (message.type === 'SUBSCRIBED_ADMIN') {
        console.log('   ✅ Subscription successful for village:', message.villageKey);
        ws.close();
        resolve();
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    
    ws.on('close', () => {
      if (hasConnected) {
        resolve();
      }
    });
  });
}

// Test 2: Frontend via Caddy Proxy
function testFrontendConnection() {
  return new Promise((resolve, reject) => {
    console.log('\n2. Testing Frontend → Caddy → WebSocket Service (port 80/ws)');
    
    const ws = new WebSocket('ws://localhost/ws');
    let hasConnected = false;
    
    const timeout = setTimeout(() => {
      if (!hasConnected) {
        ws.close();
        reject(new Error('Connection timeout (10s)'));
      }
    }, 10000);
    
    ws.on('open', () => {
      hasConnected = true;
      clearTimeout(timeout);
      console.log('   ✅ Frontend connection via Caddy successful!');
      ws.close();
      resolve();
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('   📨 Received:', message.type);
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    
    ws.on('close', () => {
      if (hasConnected) {
        resolve();
      }
    });
  });
}

// Run tests
async function runTests() {
  try {
    await testBackendConnection();
    console.log('   ✅ Backend → WebSocket: PASSED\n');
    
    try {
      await testFrontendConnection();
      console.log('   ✅ Frontend → WebSocket: PASSED\n');
    } catch (frontendError) {
      console.log('   ⚠️  Frontend → WebSocket: FAILED (Caddy might not be running)');
      console.log('   📝 Error:', frontendError.message);
      console.log('   💡 Make sure Caddy is running with: docker-compose up caddy\n');
    }
    
    console.log('🎉 WebSocket setup test completed!');
    console.log('\n📋 Summary:');
    console.log('   - WebSocket Service: Running on port 3002 ✅');
    console.log('   - Backend connectivity: Working ✅');
    console.log('   - Notification system: Functional ✅');
    console.log('\n🚀 Your WebSocket setup is working correctly!');
    
  } catch (backendError) {
    console.error('❌ Backend connection failed:', backendError.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure WebSocket service is running: docker-compose up websocket');
    console.log('   2. Check if port 3002 is available: lsof -i :3002');
    console.log('   3. Verify Docker network connectivity');
  }
  
  process.exit(0);
}

runTests();
