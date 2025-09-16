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
  const { sendMessage, isConnected } = useWebSocketNotifications();
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    level: 'info' as 'info' | 'warning' | 'critical',
    target: 'admin' as 'admin' | 'guard' | 'resident' | 'all'
  });
  
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState<any>(null);

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
          priority: formData.level === 'critical' ? 'high' : formData.level === 'warning' ? 'medium' : 'low',
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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📤 Create Notification Test</h1>
      
      {/* Connection Status */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Connection Status
              <Badge className={isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
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
            <CardTitle>Quick Send</CardTitle>
            <CardDescription>Click to quickly fill the form with sample notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleQuickSend('visitor')}
                disabled={!isConnected}
              >
                👤 Visitor Alert
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleQuickSend('security')}
                disabled={!isConnected}
              >
                🚨 Security Alert
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleQuickSend('system')}
                disabled={!isConnected}
              >
                ⚙️ System Maintenance
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleQuickSend('test')}
                disabled={!isConnected}
              >
                🧪 Test Notification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Notification Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Notification</CardTitle>
          <CardDescription>Fill out the form to send a real-time notification</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter notification title..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Body (Optional)</label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Enter notification body..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Level</label>
                <Select 
                  value={formData.level} 
                  onValueChange={(value: 'info' | 'warning' | 'critical') => 
                    setFormData(prev => ({ ...prev, level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">ℹ️ Info</SelectItem>
                    <SelectItem value="warning">⚠️ Warning</SelectItem>
                    <SelectItem value="critical">🚨 Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target</label>
                <Select 
                  value={formData.target} 
                  onValueChange={(value: 'admin' | 'guard' | 'resident' | 'all') => 
                    setFormData(prev => ({ ...prev, target: value }))
                  }
                >
                  <SelectTrigger>
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

            <div className="flex items-center gap-4">
              <Button 
                type="submit" 
                disabled={!isConnected || isSending || !formData.title.trim()}
                className="flex-1"
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
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium">{formData.title}</h3>
                <Badge className={getLevelColor(formData.level)}>
                  {formData.level}
                </Badge>
                <Badge className={getTargetColor(formData.target)}>
                  {formData.target}
                </Badge>
              </div>
              {formData.body && (
                <p className="text-sm text-gray-600">{formData.body}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Sent Notification */}
      {lastSent && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Last Sent Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-green-50">
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(lastSent, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Make sure WebSocket is connected (green status above)</li>
            <li>Open another tab and go to <code className="bg-gray-100 px-1 rounded">/dashboard</code> to see the notification bell</li>
            <li>Fill out the form above and click "Send Notification"</li>
            <li>Check the other tab - you should see the notification appear instantly!</li>
            <li>Try different levels and targets to test various scenarios</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
