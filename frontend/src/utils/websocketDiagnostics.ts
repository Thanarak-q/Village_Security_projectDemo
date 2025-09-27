/**
 * @file WebSocket Connection Diagnostics
 * Provides detailed diagnostics for WebSocket connection issues
 */

export interface WebSocketDiagnosticsData {
  isSupported: boolean;
  protocol: string;
  userAgent: string;
  url: string;
  readyState: number;
  readyStateText: string;
  lastError?: string;
  connectionTime?: number;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export class WebSocketDiagnostics {
  private static instance: WebSocketDiagnostics;
  private diagnostics: WebSocketDiagnosticsData = {
    isSupported: false,
    protocol: '',
    userAgent: '',
    url: '',
    readyState: 0,
    readyStateText: 'CONNECTING',
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
  };

  private constructor() {
    this.initialize();
  }

  public static getInstance(): WebSocketDiagnostics {
    if (!WebSocketDiagnostics.instance) {
      WebSocketDiagnostics.instance = new WebSocketDiagnostics();
    }
    return WebSocketDiagnostics.instance;
  }

  private initialize(): void {
    this.diagnostics.isSupported = typeof WebSocket !== 'undefined';
    
    // Check if we're in a browser environment before accessing browser APIs
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.diagnostics.userAgent = navigator.userAgent;
      this.diagnostics.protocol = window.location.protocol;
    } else {
      // Fallback values for server-side rendering
      this.diagnostics.userAgent = 'Server-side rendering';
      this.diagnostics.protocol = 'unknown';
    }
  }

  public updateConnection(url: string, ws: WebSocket | null): void {
    this.diagnostics.url = url;
    
    // Re-initialize browser-specific data if we're now in a browser environment
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.diagnostics.userAgent = navigator.userAgent;
      this.diagnostics.protocol = window.location.protocol;
    }
    
    if (ws) {
      this.diagnostics.readyState = ws.readyState;
      this.diagnostics.readyStateText = this.getReadyStateText(ws.readyState);
      this.diagnostics.connectionTime = Date.now();
    } else {
      this.diagnostics.readyState = 0;
      this.diagnostics.readyStateText = 'CLOSED';
    }
  }

  public updateReconnectAttempts(attempts: number, maxAttempts: number): void {
    this.diagnostics.reconnectAttempts = attempts;
    this.diagnostics.maxReconnectAttempts = maxAttempts;
  }

  public reinitializeForBrowser(): void {
    // Call this method when you're sure we're in a browser environment
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.diagnostics.userAgent = navigator.userAgent;
      this.diagnostics.protocol = window.location.protocol;
    }
  }

  public setLastError(error: string): void {
    this.diagnostics.lastError = error;
  }

  private getReadyStateText(readyState: number): string {
    switch (readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }

  public getDiagnostics(): WebSocketDiagnosticsData {
    return { ...this.diagnostics };
  }

  public logDiagnostics(): void {
    console.group('🔍 WebSocket Diagnostics');
    console.log('✅ WebSocket Supported:', this.diagnostics.isSupported);
    console.log('🌐 Protocol:', this.diagnostics.protocol);
    console.log('🔗 URL:', this.diagnostics.url);
    console.log('📊 Ready State:', `${this.diagnostics.readyState} (${this.diagnostics.readyStateText})`);
    console.log('🔄 Reconnect Attempts:', `${this.diagnostics.reconnectAttempts}/${this.diagnostics.maxReconnectAttempts}`);
    
    if (this.diagnostics.lastError) {
      console.error('❌ Last Error:', this.diagnostics.lastError);
    }
    
    if (this.diagnostics.connectionTime) {
      const connectionAge = Date.now() - this.diagnostics.connectionTime;
      console.log('⏱️ Connection Age:', `${Math.round(connectionAge / 1000)}s`);
    }
    
    console.groupEnd();
  }

  public checkConnectionHealth(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check WebSocket support
    if (!this.diagnostics.isSupported) {
      issues.push('WebSocket not supported in this browser');
      recommendations.push('Use a modern browser that supports WebSocket');
    }

    // Check protocol
    if (this.diagnostics.protocol === 'http:' && this.diagnostics.url.startsWith('ws://')) {
      // This is fine
    } else if (this.diagnostics.protocol === 'https:' && this.diagnostics.url.startsWith('wss://')) {
      // This is fine
    } else if (this.diagnostics.protocol === 'https:' && this.diagnostics.url.startsWith('ws://')) {
      issues.push('Mixed content: HTTPS page trying to connect to WS (not WSS)');
      recommendations.push('Use WSS URL for HTTPS pages or serve over HTTP');
    }

    // Check URL format
    if (!this.diagnostics.url.startsWith('ws://') && !this.diagnostics.url.startsWith('wss://')) {
      issues.push('Invalid WebSocket URL format');
      recommendations.push('URL must start with ws:// or wss://');
    }

    // Check connection state
    if (this.diagnostics.readyState === WebSocket.CLOSED) {
      issues.push('WebSocket connection is closed');
      recommendations.push('Check if the WebSocket server is running');
    }

    // Check reconnect attempts
    if (this.diagnostics.reconnectAttempts >= this.diagnostics.maxReconnectAttempts) {
      issues.push('Max reconnect attempts reached');
      recommendations.push('Check server availability and network connectivity');
    }

    // Check for recent errors
    if (this.diagnostics.lastError) {
      issues.push('Recent connection error detected');
      recommendations.push('Check server logs and network connectivity');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations
    };
  }

  public generateReport(): string {
    const health = this.checkConnectionHealth();
    const diagnostics = this.getDiagnostics();
    
    let report = 'WebSocket Connection Report\n';
    report += '==========================\n\n';
    
    report += `Status: ${health.isHealthy ? '✅ Healthy' : '❌ Issues Detected'}\n`;
    report += `URL: ${diagnostics.url}\n`;
    report += `Ready State: ${diagnostics.readyStateText}\n`;
    report += `Reconnect Attempts: ${diagnostics.reconnectAttempts}/${diagnostics.maxReconnectAttempts}\n`;
    report += `User Agent: ${diagnostics.userAgent}\n`;
    report += `Protocol: ${diagnostics.protocol}\n\n`;
    
    if (health.issues.length > 0) {
      report += 'Issues:\n';
      health.issues.forEach((issue, index) => {
        report += `${index + 1}. ${issue}\n`;
      });
      report += '\n';
    }
    
    if (health.recommendations.length > 0) {
      report += 'Recommendations:\n';
      health.recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
    }
    
    return report;
  }
}

// Export singleton instance
export const websocketDiagnostics = WebSocketDiagnostics.getInstance();
