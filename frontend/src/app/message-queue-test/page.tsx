/**
 * @file Message Queue Test Page
 * Test page for message deduplication and queuing features
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useMessageDeduplication } from '../../hooks/useMessageDeduplication';
import { useWebSocketNotifications } from '../../hooks/useWebSocketNotifications';
import MessageQueueDashboard from '../../components/MessageQueueDashboard';

export default function MessageQueueTestPage() {
  const {
    sendMessage,
    sendNotification,
    sendPing,
    sendEcho,
    queueStatus,
    clearQueue,
    removeMessage,
    getMessage
  } = useMessageDeduplication();

  const { isConnected, connectionStatus } = useWebSocketNotifications();

  const [testResults, setTestResults] = useState<string[]>([]);
  const [messageId, setMessageId] = useState('');
  const [testMessage, setTestMessage] = useState('Test message');
  const [notificationTitle, setNotificationTitle] = useState('Test Notification');
  const [notificationBody, setNotificationBody] = useState('This is a test notification');

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleSendTestMessage = () => {
    try {
      const id = sendEcho({ 
        message: testMessage, 
        timestamp: Date.now(),
        testId: Math.random().toString(36).substr(2, 9)
      });
      addTestResult(`Test message sent: ${id}`);
    } catch (error) {
      addTestResult(`Failed to send test message: ${error}`);
    }
  };

  const handleSendNotification = () => {
    try {
      const id = sendNotification(notificationTitle, notificationBody, {
        priority: 'normal',
        level: 'info',
        metadata: { test: true }
      });
      addTestResult(`Notification sent: ${id}`);
    } catch (error) {
      addTestResult(`Failed to send notification: ${error}`);
    }
  };

  const handleSendPing = () => {
    try {
      const id = sendPing();
      addTestResult(`Ping sent: ${id}`);
    } catch (error) {
      addTestResult(`Failed to send ping: ${error}`);
    }
  };

  const handleSendDuplicateMessage = () => {
    try {
      // Send the same message multiple times to test deduplication
      const messageData = { 
        message: 'Duplicate test message', 
        timestamp: Date.now(),
        duplicateTest: true
      };
      
      const id1 = sendEcho(messageData);
      const id2 = sendEcho(messageData);
      const id3 = sendEcho(messageData);
      
      addTestResult(`Duplicate messages sent: ${id1}, ${id2}, ${id3}`);
    } catch (error) {
      addTestResult(`Failed to send duplicate messages: ${error}`);
    }
  };

  const handleSendHighPriorityMessage = () => {
    try {
      const id = sendMessage('HIGH_PRIORITY_TEST', {
        message: 'High priority test message',
        timestamp: Date.now()
      }, {
        priority: 'high',
        maxRetries: 5,
        metadata: { priority: 'high' }
      });
      addTestResult(`High priority message sent: ${id}`);
    } catch (error) {
      addTestResult(`Failed to send high priority message: ${error}`);
    }
  };

  const handleSendCriticalMessage = () => {
    try {
      const id = sendMessage('CRITICAL_TEST', {
        message: 'Critical test message',
        timestamp: Date.now()
      }, {
        priority: 'critical',
        maxRetries: 10,
        metadata: { priority: 'critical' }
      });
      addTestResult(`Critical message sent: ${id}`);
    } catch (error) {
      addTestResult(`Failed to send critical message: ${error}`);
    }
  };

  const handleGetMessage = () => {
    if (!messageId) {
      addTestResult('Please enter a message ID');
      return;
    }
    
    try {
      const message = getMessage(messageId);
      if (message) {
        addTestResult(`Message found: ${JSON.stringify(message, null, 2)}`);
      } else {
        addTestResult(`Message not found: ${messageId}`);
      }
    } catch (error) {
      addTestResult(`Failed to get message: ${error}`);
    }
  };

  const handleRemoveMessage = () => {
    if (!messageId) {
      addTestResult('Please enter a message ID');
      return;
    }
    
    try {
      const removed = removeMessage(messageId);
      addTestResult(`Message ${removed ? 'removed' : 'not found'}: ${messageId}`);
    } catch (error) {
      addTestResult(`Failed to remove message: ${error}`);
    }
  };

  const handleClearQueue = () => {
    try {
      clearQueue();
      addTestResult('Queue cleared');
    } catch (error) {
      addTestResult(`Failed to clear queue: ${error}`);
    }
  };

  const handleClearResults = () => {
    setTestResults([]);
  };

  // Auto-scroll to bottom of results
  useEffect(() => {
    const resultsContainer = document.getElementById('test-results');
    if (resultsContainer) {
      resultsContainer.scrollTop = resultsContainer.scrollHeight;
    }
  }, [testResults]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Message Queue Test Page
          </h1>
          <p className="text-gray-600">
            Test message deduplication, queuing, and delivery features
          </p>
          
          {/* Connection Status */}
          <div className="mt-4 flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              WebSocket: {connectionStatus}
            </div>
            <div className="text-sm text-gray-600">
              Queue: {queueStatus.size} messages
            </div>
          </div>
        </div>

        {/* Message Queue Dashboard */}
        <MessageQueueDashboard />

        {/* Test Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Tests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Message Tests
            </h2>
            
            <div className="space-y-4">
              {/* Test Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Message
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter test message"
                  />
                  <button
                    onClick={handleSendTestMessage}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Send Echo
                  </button>
                </div>
              </div>

              {/* Notification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notification title"
                  />
                  <input
                    type="text"
                    value={notificationBody}
                    onChange={(e) => setNotificationBody(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notification body"
                  />
                  <button
                    onClick={handleSendNotification}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Send Notification
                  </button>
                </div>
              </div>

              {/* Priority Tests */}
              <div className="space-y-2">
                <button
                  onClick={handleSendPing}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Send Ping
                </button>
                
                <button
                  onClick={handleSendHighPriorityMessage}
                  className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  Send High Priority Message
                </button>
                
                <button
                  onClick={handleSendCriticalMessage}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Send Critical Message
                </button>
                
                <button
                  onClick={handleSendDuplicateMessage}
                  className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Send Duplicate Messages (Test Deduplication)
                </button>
              </div>
            </div>
          </div>

          {/* Message Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Message Management
            </h2>
            
            <div className="space-y-4">
              {/* Message ID Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message ID
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={messageId}
                    onChange={(e) => setMessageId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter message ID"
                  />
                  <button
                    onClick={handleGetMessage}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Get
                  </button>
                  <button
                    onClick={handleRemoveMessage}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Queue Management */}
              <div className="space-y-2">
                <button
                  onClick={handleClearQueue}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Clear Queue
                </button>
                
                <button
                  onClick={handleClearResults}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Clear Results
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Test Results
          </h2>
          
          <div
            id="test-results"
            className="bg-gray-50 rounded-md p-4 h-64 overflow-y-auto font-mono text-sm"
          >
            {testResults.length === 0 ? (
              <div className="text-gray-500">No test results yet...</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
