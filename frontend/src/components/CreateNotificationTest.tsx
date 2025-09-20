'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWebSocketNotifications } from '@/hooks/useWebSocketNotifications';

export default function CreateNotificationTest() {
  const { isConnected } = useWebSocketNotifications();
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    level: 'info' as 'info' | 'warning' | 'critical',
    target: 'admin' as 'admin' | 'guard' | 'resident' | 'all'
  });
  
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState<{
    api: {
      notification_id: string;
      title: string;
      message: string;
      type: string;
      category: string;
      created_at: string;
    };
    websocket_sent: boolean;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsSending(true);
    
    try {
      // Send to backend API (which will save to database)
      const response = await fetch('/api/notifications/realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          message: formData.body,
          type: 'system',
          category: 'realtime',
          target: formData.target
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create notification');
      }

      setLastSent({
        api: result.data.notification,
        websocket_sent: result.data.websocket_sent
      });
      
      // Reset form
      setFormData({
        title: '',
        body: '',
        level: 'info',
        target: 'admin'
      });
      
      console.log('📤 Notification created and sent:', result.data.notification);
      
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      alert('Failed to send notification: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickSend = (type: string) => {
    const quickNotifications = {
      visitor: {
        title: 'New Visitor Registration',
        body: 'A new visitor has registered and is waiting for approval',
        level: 'info' as const
      },
      security: {
        title: 'Security Alert',
        body: 'Unauthorized access detected at the main gate',
        level: 'critical' as const
      },
      system: {
        title: 'System Maintenance',
        body: 'Scheduled maintenance will begin in 30 minutes',
        level: 'warning' as const
      },
      test: {
        title: 'Test Notification',
        body: 'This is a test notification to verify the system is working',
        level: 'info' as const
      }
    };

    const notification = quickNotifications[type as keyof typeof quickNotifications];
    if (notification) {
      setFormData(prev => ({
        ...prev,
        ...notification
      }));
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTargetColor = (target: string) => {
    switch (target) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'guard': return 'bg-green-100 text-green-800';
      case 'resident': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📤 Create Notification Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test real-time notifications with WebSocket connection
          </p>
        </div>
      
        {/* Connection Status */}
        <div className="mb-6">
          <Card className="border-l-4 border-l-green-500 dark:border-l-green-400">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg">
                <span>Connection Status</span>
                <Badge 
                  className={`${
                    isConnected 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  } w-fit`}
                >
                  {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isConnected 
                  ? 'WebSocket is connected. Notifications will be sent in real-time.'
                  : 'WebSocket is disconnected. Notifications cannot be sent.'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Send Buttons */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Send</CardTitle>
              <CardDescription>Click to quickly fill the form with sample notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleQuickSend('visitor')}
                  disabled={!isConnected}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">👤</span>
                  <span className="text-sm">Visitor Alert</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleQuickSend('security')}
                  disabled={!isConnected}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">🚨</span>
                  <span className="text-sm">Security Alert</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleQuickSend('system')}
                  disabled={!isConnected}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">⚙️</span>
                  <span className="text-sm">System Maintenance</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleQuickSend('test')}
                  disabled={!isConnected}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">🧪</span>
                  <span className="text-sm">Test Notification</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Notification Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New Notification</CardTitle>
            <CardDescription>Fill out the form to send a real-time notification</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter notification title..."
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Body (Optional)
                </label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Enter notification body..."
                  rows={3}
                  className="w-full resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Level
                  </label>
                  <Select 
                    value={formData.level} 
                    onValueChange={(value: 'info' | 'warning' | 'critical') => 
                      setFormData(prev => ({ ...prev, level: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">ℹ️ Info</SelectItem>
                      <SelectItem value="warning">⚠️ Warning</SelectItem>
                      <SelectItem value="critical">🚨 Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Target
                  </label>
                  <Select 
                    value={formData.target} 
                    onValueChange={(value: 'admin' | 'guard' | 'resident' | 'all') => 
                      setFormData(prev => ({ ...prev, target: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">👑 Admin</SelectItem>
                      <SelectItem value="guard">🛡️ Guard</SelectItem>
                      <SelectItem value="resident">🏠 Resident</SelectItem>
                      <SelectItem value="all">🌐 All Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  type="submit" 
                  disabled={!isConnected || isSending || !formData.title.trim()}
                  className="flex-1 h-12 text-base"
                >
                  {isSending ? '📤 Sending...' : '📤 Send Notification'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        {formData.title && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">{formData.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getLevelColor(formData.level)}>
                      {formData.level}
                    </Badge>
                    <Badge className={getTargetColor(formData.target)}>
                      {formData.target}
                    </Badge>
                  </div>
                </div>
                {formData.body && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formData.body}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Last Sent Notification */}
        {lastSent && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Last Sent Notification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                <pre className="text-sm overflow-x-auto text-gray-800 dark:text-gray-200">
                  {JSON.stringify(lastSent, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>Make sure WebSocket is connected (green status above)</li>
              <li>Open another tab and go to <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">/dashboard</code> to see the notification bell</li>
              <li>Fill out the form above and click &quot;Send Notification&quot;</li>
              <li>Check the other tab - you should see the notification appear instantly!</li>
              <li>Try different levels and targets to test various scenarios</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
