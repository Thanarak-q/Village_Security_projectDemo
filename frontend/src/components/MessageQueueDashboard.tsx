/**
 * @file Message Queue Dashboard
 * Displays message queue status and management controls
 */

import React, { useState, useEffect } from 'react';
import { useMessageDeduplication } from '../hooks/useMessageDeduplication';

interface MessageQueueDashboardProps {
  className?: string;
}

export const MessageQueueDashboard: React.FC<MessageQueueDashboardProps> = ({
  className = ''
}) => {
  const {
    queueStatus,
    getDeduplicationStats,
    clearQueue,
    sendPing,
    sendEcho
  } = useMessageDeduplication();

  const [isExpanded, setIsExpanded] = useState(false);
  const [testMessage, setTestMessage] = useState('Hello World');
  const [stats, setStats] = useState(getDeduplicationStats());

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getDeduplicationStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [getDeduplicationStats]);

  const handleSendTestMessage = () => {
    try {
      sendEcho({ message: testMessage, timestamp: Date.now() });
      console.log('📤 Test message sent');
    } catch (error) {
      console.error('❌ Failed to send test message:', error);
    }
  };

  const handleSendPing = () => {
    try {
      sendPing();
      console.log('🏓 Ping sent');
    } catch (error) {
      console.error('❌ Failed to send ping:', error);
    }
  };

  const handleClearQueue = () => {
    if (window.confirm('Are you sure you want to clear the message queue?')) {
      clearQueue();
      console.log('🧹 Queue cleared');
    }
  };

  const getStatusColor = () => {
    if (queueStatus.size === 0) return 'text-green-600';
    if (queueStatus.size < 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (queueStatus.processing) return '🔄';
    if (queueStatus.size === 0) return '✅';
    if (queueStatus.size < 10) return '⚠️';
    return '❌';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Message Queue Status
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Basic Status */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getStatusIcon()}</span>
          <span className={`font-medium ${getStatusColor()}`}>
            {queueStatus.size} messages
          </span>
        </div>
        
        {queueStatus.processing && (
          <span className="text-blue-600 text-sm">Processing...</span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={handleSendPing}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          🏓 Ping
        </button>
        
        <button
          onClick={handleClearQueue}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          disabled={queueStatus.size === 0}
        >
          🧹 Clear
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Queue Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Total Messages</div>
              <div className="text-lg font-semibold">{stats.totalMessages}</div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Queue Size</div>
              <div className="text-lg font-semibold">{stats.queueSize}</div>
            </div>
          </div>

          {/* Priority Breakdown */}
          {Object.keys(stats.priorityCounts).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Priority Breakdown</h4>
              <div className="space-y-1">
                {Object.entries(stats.priorityCounts).map(([priority, count]) => (
                  <div key={priority} className="flex justify-between text-sm">
                    <span className="capitalize">{priority}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Message */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Test Message</h4>
            <div className="flex space-x-2">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                placeholder="Enter test message"
              />
              <button
                onClick={handleSendTestMessage}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Send
              </button>
            </div>
          </div>

          {/* Timestamps */}
          {stats.oldestMessage && (
            <div className="text-xs text-gray-500">
              <div>Oldest: {new Date(stats.oldestMessage).toLocaleTimeString()}</div>
              {stats.newestMessage && (
                <div>Newest: {new Date(stats.newestMessage).toLocaleTimeString()}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageQueueDashboard;
