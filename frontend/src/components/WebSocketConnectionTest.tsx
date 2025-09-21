/**
 * @file WebSocket Connection Test Component
 * Provides detailed WebSocket connection testing and diagnostics
 */

import React, { useState, useEffect } from 'react';
import { websocketDiagnostics } from '../utils/websocketDiagnostics';
import { buildApiUrl, getApiBaseUrl } from '../utils/apiBase';

interface WebSocketConnectionTestProps {
  className?: string;
}

export const WebSocketConnectionTest: React.FC<WebSocketConnectionTestProps> = ({
  className = ''
}) => {
  const [diagnostics, setDiagnostics] = useState(websocketDiagnostics.getDiagnostics());
  const [isExpanded, setIsExpanded] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  // Update diagnostics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setDiagnostics(websocketDiagnostics.getDiagnostics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testWebSocketConnection = async () => {
    addTestResult('Starting WebSocket connection test...');
    
    try {
      // Test basic WebSocket support
      if (typeof WebSocket === 'undefined') {
        addTestResult('❌ WebSocket not supported in this browser');
        return;
      }
      addTestResult('✅ WebSocket is supported');

      // Test URL format
      // Determine WebSocket URL based on environment
      let testUrl: string;
      
      if (process.env.NEXT_PUBLIC_WS_URL) {
        testUrl = process.env.NEXT_PUBLIC_WS_URL;
      } else if (typeof window !== 'undefined') {
        const currentHost = window.location.hostname;
        const currentProtocol = window.location.protocol;
        
        if (currentHost.includes('ngrok.io') || currentHost.includes('ngrok-free.app')) {
          testUrl = `wss://${currentHost}/ws`;
        } else if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
          testUrl = 'ws://localhost/ws';
        } else {
          testUrl = `${currentProtocol === 'https:' ? 'wss:' : 'ws:'}//${currentHost}/ws`;
        }
      } else {
        testUrl = 'ws://localhost/ws';
      }
      if (!testUrl.startsWith('ws://') && !testUrl.startsWith('wss://')) {
        addTestResult('❌ Invalid WebSocket URL format');
        return;
      }
      addTestResult(`✅ WebSocket URL format is valid: ${testUrl}`);

      // Test protocol compatibility
      const protocol = window.location.protocol;
      if (protocol === 'https:' && testUrl.startsWith('ws://')) {
        addTestResult('⚠️ Mixed content warning: HTTPS page with WS URL');
      } else if (protocol === 'http:' && testUrl.startsWith('wss://')) {
        addTestResult('⚠️ Mixed content warning: HTTP page with WSS URL');
      } else {
        addTestResult('✅ Protocol compatibility check passed');
      }

      // Test actual connection
      addTestResult('Attempting to connect to WebSocket...');
      
      const ws = new WebSocket(testUrl);
      
      const connectionTest = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout after 5 seconds'));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          addTestResult('✅ WebSocket connection successful');
          ws.close();
          resolve('Connected');
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          addTestResult(`❌ WebSocket connection failed: ${error.type || 'Unknown error'}`);
          reject(error);
        };

        ws.onclose = (event) => {
          clearTimeout(timeout);
          if (event.code === 1000) {
            addTestResult('✅ WebSocket connection closed normally');
          } else {
            addTestResult(`⚠️ WebSocket connection closed with code: ${event.code}`);
          }
        };
      });

      await connectionTest;
      addTestResult('✅ WebSocket connection test completed successfully');

    } catch (error) {
      addTestResult(`❌ WebSocket connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testServerAvailability = async () => {
    addTestResult('Testing server availability...');
    
    try {
      // Test HTTP endpoint first
      const resolvedBase = getApiBaseUrl();
      const healthUrl = buildApiUrl('/api/health');
      addTestResult(`Checking HTTP endpoint via: ${resolvedBase ? healthUrl : '/api/health (relative)'}`);
      const response = await fetch(healthUrl);
      
      if (response.ok) {
        addTestResult('✅ HTTP server is responding');
      } else {
        addTestResult(`⚠️ HTTP server responded with status: ${response.status}`);
      }
    } catch (error) {
      addTestResult(`❌ HTTP server test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runFullDiagnostics = () => {
    addTestResult('Running full diagnostics...');
    websocketDiagnostics.logDiagnostics();
    
    const health = websocketDiagnostics.checkConnectionHealth();
    addTestResult(`Health Status: ${health.isHealthy ? '✅ Healthy' : '❌ Issues Detected'}`);
    
    if (health.issues.length > 0) {
      addTestResult('Issues found:');
      health.issues.forEach((issue, index) => {
        addTestResult(`${index + 1}. ${issue}`);
      });
    }
    
    if (health.recommendations.length > 0) {
      addTestResult('Recommendations:');
      health.recommendations.forEach((rec, index) => {
        addTestResult(`${index + 1}. ${rec}`);
      });
    }
  };

  const generateReport = () => {
    const report = websocketDiagnostics.generateReport();
    console.log('WebSocket Diagnostics Report:', report);
    addTestResult('Diagnostics report generated (check console)');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusColor = () => {
    if (diagnostics.readyState === 1) return 'text-green-600';
    if (diagnostics.readyState === 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (diagnostics.readyState === 1) return '✅';
    if (diagnostics.readyState === 0) return '🔄';
    return '❌';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          WebSocket Connection Test
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
            {diagnostics.readyStateText}
          </span>
        </div>
        
        <div className="text-sm text-gray-600">
          {diagnostics.reconnectAttempts}/{diagnostics.maxReconnectAttempts} attempts
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={testWebSocketConnection}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          🔗 Test Connection
        </button>
        
        <button
          onClick={testServerAvailability}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          🖥️ Test Server
        </button>
        
        <button
          onClick={runFullDiagnostics}
          className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
        >
          🔍 Full Diagnostics
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Connection Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">URL</div>
              <div className="text-sm font-mono break-all">{diagnostics.url}</div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Protocol</div>
              <div className="text-sm font-mono">{diagnostics.protocol}</div>
            </div>
          </div>

          {/* Test Results */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">Test Results</h4>
              <button
                onClick={clearResults}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-md p-3 h-32 overflow-y-auto font-mono text-xs">
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

          {/* Additional Actions */}
          <div className="flex space-x-2">
            <button
              onClick={generateReport}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              📄 Generate Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketConnectionTest;
