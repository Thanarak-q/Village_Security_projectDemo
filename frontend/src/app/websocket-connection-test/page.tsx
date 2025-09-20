/**
 * @file WebSocket Connection Test Page
 * Comprehensive WebSocket connection testing and diagnostics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocketNotifications } from '../../hooks/useWebSocketNotifications';
import { useMessageDeduplication } from '../../hooks/useMessageDeduplication';
import WebSocketConnectionTest from '../../components/WebSocketConnectionTest';
import MessageQueueDashboard from '../../components/MessageQueueDashboard';

export default function WebSocketConnectionTestPage() {
  const {
    isConnected,
    connectionStatus,
    clearNotifications,
    errorStats,
    healthStatus,
    queueStatus
  } = useWebSocketNotifications();

  const {
    sendMessage: sendQueuedMessage,
    sendNotification,
    sendPing,
    sendEcho,
    clearQueue
  } = useMessageDeduplication();

  const [testResults, setTestResults] = useState<string[]>([]);
  const [isAutoTesting, setIsAutoTesting] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testWebSocketFeatures = async () => {
    addTestResult('Testing WebSocket features...');
    
    try {
      // Test basic message sending
      if (isConnected) {
        addTestResult('✅ WebSocket is connected');
        
        // Test ping
        try {
          sendPing();
          addTestResult('✅ Ping sent successfully');
        } catch (error) {
          addTestResult(`❌ Ping failed: ${error}`);
        }
        
        // Test echo
        try {
          const echoData = { message: 'Test echo', timestamp: Date.now() };
          sendEcho(echoData);
          addTestResult('✅ Echo sent successfully');
        } catch (error) {
          addTestResult(`❌ Echo failed: ${error}`);
        }
        
        // Test notification
        try {
          sendNotification('Test Notification', 'This is a test notification', {
            priority: 'normal',
            level: 'info'
          });
          addTestResult('✅ Notification sent successfully');
        } catch (error) {
          addTestResult(`❌ Notification failed: ${error}`);
        }
        
      } else {
        addTestResult(`❌ WebSocket is not connected (status: ${connectionStatus})`);
      }
      
    } catch (error) {
      addTestResult(`❌ WebSocket feature test failed: ${error}`);
    }
  };

  const testMessageQueue = async () => {
    addTestResult('Testing message queue...');
    
    try {
      // Test queued message sending
      const queuedMessage = {
        type: 'TEST_MESSAGE',
        data: { message: 'Test queued message', timestamp: Date.now() },
        priority: 'normal' as const
      };
      
      sendQueuedMessage(queuedMessage.type, queuedMessage.data, {
        priority: queuedMessage.priority,
        maxRetries: 3
      });
      
      addTestResult(`✅ Queued message sent (queue size: ${queueStatus.size})`);
      
    } catch (error) {
      addTestResult(`❌ Message queue test failed: ${error}`);
    }
  };

  const testErrorHandling = async () => {
    addTestResult('Testing error handling...');
    
    try {
      // Test error stats
      addTestResult(`Error stats: ${JSON.stringify(errorStats)}`);
      
      // Test health status
      addTestResult(`Health status: ${healthStatus.status} - ${healthStatus.message}`);
      
      // Test queue status
      addTestResult(`Queue status: ${queueStatus.size} messages, processing: ${queueStatus.processing}`);
      
      addTestResult('✅ Error handling test completed');
      
    } catch (error) {
      addTestResult(`❌ Error handling test failed: ${error}`);
    }
  };

  const runComprehensiveTest = async () => {
    addTestResult('Starting comprehensive WebSocket test...');
    
    await testWebSocketFeatures();
    await testMessageQueue();
    await testErrorHandling();
    
    addTestResult('✅ Comprehensive test completed');
  };

  const startAutoTesting = () => {
    setIsAutoTesting(true);
    addTestResult('Auto-testing started (every 30 seconds)');
    
    const interval = setInterval(() => {
      if (!isAutoTesting) {
        clearInterval(interval);
        return;
      }
      
      addTestResult('Auto-test running...');
      testWebSocketFeatures();
    }, 30000);
    
    // Store interval ID for cleanup
    (window as unknown as { autoTestInterval?: NodeJS.Timeout }).autoTestInterval = interval;
  };

  const stopAutoTesting = () => {
    setIsAutoTesting(false);
    const windowWithInterval = window as unknown as { autoTestInterval?: NodeJS.Timeout };
    if (windowWithInterval.autoTestInterval) {
      clearInterval(windowWithInterval.autoTestInterval);
      windowWithInterval.autoTestInterval = undefined;
    }
    addTestResult('Auto-testing stopped');
  };

  const clearAllData = () => {
    clearNotifications();
    clearQueue();
    setTestResults([]);
    addTestResult('All data cleared');
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
            WebSocket Connection Test Page
          </h1>
          <p className="text-gray-600">
            Comprehensive WebSocket connection testing and diagnostics
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
            <div className="text-sm text-gray-600">
              Health: {healthStatus.status}
            </div>
          </div>
        </div>

        {/* WebSocket Connection Test */}
        <WebSocketConnectionTest />

        {/* Message Queue Dashboard */}
        <MessageQueueDashboard />

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Test Controls
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={testWebSocketFeatures}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              🔗 Test WebSocket
            </button>
            
            <button
              onClick={testMessageQueue}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              📬 Test Queue
            </button>
            
            <button
              onClick={testErrorHandling}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              ⚠️ Test Errors
            </button>
            
            <button
              onClick={runComprehensiveTest}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              🧪 Full Test
            </button>
          </div>
          
          <div className="mt-4 flex space-x-4">
            <button
              onClick={isAutoTesting ? stopAutoTesting : startAutoTesting}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                isAutoTesting
                  ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
                  : 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
              }`}
            >
              {isAutoTesting ? '⏹️ Stop Auto-Test' : '▶️ Start Auto-Test'}
            </button>
            
            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              🧹 Clear All
            </button>
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
