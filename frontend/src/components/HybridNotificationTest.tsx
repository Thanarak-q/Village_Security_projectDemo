'use client';

import { useHybridNotifications } from '@/hooks/useHybridNotifications';
import { useState } from 'react';

export default function HybridNotificationTest() {
  const { 
    notifications, 
    counts, 
    loading, 
    error, 
    isWebSocketConnected,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotificationById
  } = useHybridNotifications();
  
  const [testMessage, setTestMessage] = useState('');

  const handleSendTest = () => {
    if (testMessage.trim()) {
      // This will send a test message to WebSocket
      // We'll implement this in the next step
      console.log('Sending test message:', testMessage);
      setTestMessage('');
    }
  };

  const getStatusColor = () => {
    return isWebSocketConnected ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = () => {
    return isWebSocketConnected ? '🟢' : '🔴';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔔 Hybrid Notifications Test</h1>
      
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Connection Status</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getStatusIcon()}</span>
            <span className={`font-medium ${getStatusColor()}`}>
              {isWebSocketConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Notification Counts</h3>
          <div className="text-2xl font-bold">
            {counts ? (
              <>
                <span className="text-blue-600">{counts.total}</span>
                <span className="text-gray-400">/</span>
                <span className="text-red-600">{counts.unread}</span>
              </>
            ) : (
              <span className="text-gray-400">Loading...</span>
            )}
          </div>
          <div className="text-sm text-gray-500">Total / Unread</div>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Loading Status</h3>
          <div className={`font-medium ${loading ? 'text-yellow-600' : 'text-green-600'}`}>
            {loading ? '⏳ Loading...' : '✅ Ready'}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Test Controls */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
        <div className="flex gap-2 mb-4">
          <button
            onClick={refreshNotifications}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300 hover:bg-blue-600"
          >
            🔄 Refresh Notifications
          </button>
          <button
            onClick={markAllAsRead}
            disabled={loading || !counts?.unread}
            className="px-4 py-2 bg-green-500 text-white rounded-md disabled:bg-gray-300 hover:bg-green-600"
          >
            ✅ Mark All Read
          </button>
        </div>
        
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
            disabled={!isWebSocketConnected || !testMessage.trim()}
            className="px-4 py-2 bg-purple-500 text-white rounded-md disabled:bg-gray-300 hover:bg-purple-600"
          >
            📤 Send Test
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            All Notifications ({notifications.length})
          </h2>
        </div>
        
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>No notifications yet</p>
            <p className="text-sm">Try refreshing or wait for real-time notifications</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={`p-4 rounded-lg border-l-4 ${
                  notification.is_read 
                    ? 'bg-gray-50 border-gray-300' 
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{notification.title}</h3>
                      {notification.isRealtime && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          🔴 LIVE
                        </span>
                      )}
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Type: {notification.type}</span>
                      <span>Category: {notification.category}</span>
                      <span>Priority: {notification.priority}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500 ml-4">
                    <div>{new Date(notification.created_at).toLocaleTimeString()}</div>
                    <div className="flex gap-1 mt-2">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.notification_id)}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotificationById(notification.notification_id)}
                        className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Debug Info</h2>
        <div className="text-sm space-y-1">
          <div>WebSocket Connected: {isWebSocketConnected ? 'Yes' : 'No'}</div>
          <div>Total Notifications: {notifications.length}</div>
          <div>HTTP Notifications: {notifications.filter(n => !n.isRealtime).length}</div>
          <div>WebSocket Notifications: {notifications.filter(n => n.isRealtime).length}</div>
          <div>Unread Count: {counts?.unread || 0}</div>
        </div>
      </div>
    </div>
  );
}
