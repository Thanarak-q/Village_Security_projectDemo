"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useWebSocketNotifications } from "@/hooks/useWebSocketNotifications"
import { useHybridNotifications } from "@/hooks/useHybridNotifications"
import { NOTIFICATION_LEVELS } from "@/types/notification.types"
import { 
  Wifi, 
  WifiOff, 
  Send, 
  RefreshCw, 
  Trash2, 
  Bell, 
  AlertTriangle, 
  Info, 
  XCircle,
  Clock
} from "lucide-react"

export default function WebSocketTestPage() {
  const [testTitle, setTestTitle] = useState("Test Notification")
  const [testMessage, setTestMessage] = useState("This is a test WebSocket notification")
  const [testLevel, setTestLevel] = useState<"info" | "warning" | "critical">("info")
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)

  // WebSocket notifications hook
  const {
    notifications: wsNotifications,
    isConnected,
    connectionStatus,
    clearNotifications
  } = useWebSocketNotifications()

  // Hybrid notifications hook (includes both HTTP and WebSocket)
  const {
    counts
  } = useHybridNotifications()

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!testTitle.trim() || !testMessage.trim()) {
      setSendResult({ success: false, message: "Please fill in title and message" })
      return
    }

    setIsSending(true)
    setSendResult(null)

    try {
      const response = await fetch('/api/notifications/realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: testTitle,
          message: testMessage,
          level: testLevel,
          data: {
            test: true,
            timestamp: Date.now(),
            source: 'websocket-test-page'
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      await response.json()
      setSendResult({ success: true, message: "Test notification sent successfully!" })
      
      // Clear form after successful send
      setTimeout(() => {
        setTestTitle("Test Notification")
        setTestMessage("This is a test WebSocket notification")
        setTestLevel("info")
        setSendResult(null)
      }, 2000)

    } catch (error) {
      console.error('Failed to send test notification:', error)
      setSendResult({ 
        success: false, 
        message: `Failed to send: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setIsSending(false)
    }
  }, [testTitle, testMessage, testLevel])

  // Get connection status icon and color
  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: Wifi, color: 'text-green-500', bg: 'bg-green-100', text: 'Connected' }
      case 'connecting':
        return { icon: RefreshCw, color: 'text-yellow-500', bg: 'bg-yellow-100', text: 'Connecting...' }
      case 'disconnected':
        return { icon: WifiOff, color: 'text-gray-500', bg: 'bg-gray-100', text: 'Disconnected' }
      case 'error':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', text: 'Error' }
      default:
        return { icon: WifiOff, color: 'text-gray-500', bg: 'bg-gray-100', text: 'Unknown' }
    }
  }

  // Get level icon and color
  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'critical':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' }
      case 'warning':
        return { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-100' }
      case 'info':
      default:
        return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100' }
    }
  }

  const connectionStatusInfo = getConnectionStatus()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WebSocket Notification Test</h1>
          <p className="text-muted-foreground">Test real-time WebSocket notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
            <connectionStatusInfo.icon className="h-3 w-3" />
            {connectionStatusInfo.text}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Test Notification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Test Notification
            </CardTitle>
            <CardDescription>
              Send a test notification via WebSocket to see real-time updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="Enter notification title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter notification message"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select value={testLevel} onValueChange={(value: "info" | "warning" | "critical") => setTestLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NOTIFICATION_LEVELS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const levelInfo = getLevelInfo(key)
                          return <levelInfo.icon className="h-4 w-4" />
                        })()}
                        {value}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={sendTestNotification} 
              disabled={isSending || !isConnected}
              className="w-full"
            >
              {isSending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Notification
                </>
              )}
            </Button>

            {sendResult && (
              <div className={`p-3 rounded-md ${sendResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {sendResult.message}
              </div>
            )}

            {!isConnected && (
              <div className="p-3 rounded-md bg-yellow-50 text-yellow-700">
                WebSocket is not connected. Click &quot;Reconnect&quot; to establish connection.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connection Status & Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Connection Status
            </CardTitle>
            <CardDescription>
              WebSocket connection information and statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
                <connectionStatusInfo.icon className="h-3 w-3" />
                {connectionStatusInfo.text}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Received</span>
                <span className="text-sm text-muted-foreground">{wsNotifications.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection Status</span>
                <span className="text-sm text-muted-foreground">{connectionStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Notifications</span>
                <span className="text-sm text-muted-foreground">
                  {wsNotifications.length > 0 ? `${wsNotifications.length} messages` : 'No messages'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Message</span>
                <span className="text-sm text-muted-foreground">
                  {wsNotifications.length > 0 ? 'Recent' : 'Never'}
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={reconnect}
                disabled={isConnected}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reconnect
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retryConnection}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WebSocket Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                WebSocket Notifications ({wsNotifications.length})
              </CardTitle>
              <CardDescription>
                Real-time notifications received via WebSocket
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearNotifications}
              disabled={wsNotifications.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {wsNotifications.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No WebSocket notifications received yet</p>
                  <p className="text-sm">Send a test notification to see it here</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {wsNotifications.map((notification) => {
                  const levelInfo = getLevelInfo(notification.level || 'info')
                  return (
                    <div key={notification.id} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${levelInfo.bg}`}>
                          <levelInfo.icon className={`h-4 w-4 ${levelInfo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium truncate">{notification.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(notification.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                          {notification.body && (
                            <p className="text-sm text-muted-foreground mb-2">{notification.body}</p>
                          )}
                          {notification.data && (
                            <div className="text-xs text-muted-foreground">
                              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(notification.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Hybrid Notifications Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            All Notifications Summary
          </CardTitle>
          <CardDescription>
            Combined HTTP and WebSocket notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{counts?.total || 0}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{counts?.unread || 0}</div>
              <div className="text-sm text-muted-foreground">Unread</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{wsNotifications.length}</div>
              <div className="text-sm text-muted-foreground">WebSocket</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
