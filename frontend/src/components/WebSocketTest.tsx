'use client';

import { useWebSocketNotifications } from '@/hooks/useWebSocketNotifications';
import { useState } from 'react';

export default function WebSocketTest() {
  const { 
    notifications, 
    isConnected, 
    connectionStatus, 
    sendMessage, 
    clearNotifications 
  } = useWebSocketNotifications();
  
  const [testMessage, setTestMessage] = useState('');

  const handleSendTest = () => {
    if (testMessage.trim()) {
      sendMessage({
        type: 'test',
        message: testMessage,
        timestamp: new Date().toISOString()
      });
      setTestMessage('');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔔 WebSocket Notifications Test</h1>
      
      {/* Connection Status */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getStatusIcon()}</span>
          <span className={`font-medium ${getStatusColor()}`}>
            {connectionStatus.toUpperCase()}
          </span>
          {isConnected && <span className="text-sm text-gray-500">(Connected)</span>}
        </div>
      </div>

      {/* Test Message Sender */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Send Test Message</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter test message..."
            className="flex-1 px-3 py-2 border rounded-md"
            onKeyPress={(e) => e.key === 'Enter' && handleSendTest()}
          />
          <button
            onClick={handleSendTest}
            disabled={!isConnected || !testMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
          >
            Send
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="mb-6 p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Real-time Notifications ({notifications.length})
          </h2>
          <button
            onClick={clearNotifications}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Clear All
          </button>
        </div>
        
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No notifications yet. Wait for ping messages (every 15 seconds) or send a test message.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border-l-4 ${
                  notification.level === 'critical' 
                    ? 'bg-red-50 border-red-400' 
                    : notification.level === 'warning'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{notification.title}</h3>
                    {notification.body && (
                      <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>{new Date(notification.createdAt).toLocaleTimeString()}</div>
                    <div className="capitalize">{notification.level}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Debug Info</h2>
        <div className="text-sm space-y-1">
          <div>WebSocket URL: {process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost/ws'}</div>
          <div>Connection State: {isConnected ? 'Open' : 'Closed'}</div>
          <div>Total Notifications: {notifications.length}</div>
          <div>Browser Notifications: {typeof window !== 'undefined' && 'Notification' in window ? 'Supported' : 'Not Supported'}</div>
        </div>
      </div>
    </div>
  );
}
