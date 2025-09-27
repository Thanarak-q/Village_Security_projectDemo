/**
 * @file Debug Info Component
 * Helps debug infinite re-render loops and performance issues
 */

import React, { useState, useEffect, useRef } from 'react';

interface DebugInfoProps {
  componentName: string;
  enabled?: boolean;
  showProps?: boolean;
  showState?: boolean;
  showRenderCount?: boolean;
  showPerformance?: boolean;
}

export function DebugInfo({
  componentName,
  enabled = process.env.NODE_ENV === 'development',
  showProps = false,
  showState = false,
  showRenderCount = true,
  showPerformance = true
}: DebugInfoProps) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  const renderTimesRef = useRef<number[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Move useEffect before early return
  useEffect(() => {
    if (!enabled) return;
    
    renderCountRef.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    lastRenderTimeRef.current = now;

    // Track render times
    renderTimesRef.current.push(timeSinceLastRender);
    if (renderTimesRef.current.length > 10) {
      renderTimesRef.current.shift();
    }

    // Detect potential infinite loops
    const avgRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;
    const isRenderingTooFast = avgRenderTime < 100 && renderCountRef.current > 5;
    const isRenderingTooOften = renderCountRef.current > 20;

    if (isRenderingTooFast || isRenderingTooOften) {
      console.warn(`⚠️ Potential infinite loop detected in ${componentName}:`, {
        renderCount: renderCountRef.current,
        avgRenderTime: avgRenderTime.toFixed(2) + 'ms',
        isRenderingTooFast,
        isRenderingTooOften
      });
    }
  }, [componentName, enabled]);

  if (!enabled) return null;

  renderCountRef.current++;
  const now = Date.now();
  const timeSinceLastRender = now - lastRenderTimeRef.current;
  lastRenderTimeRef.current = now;

  // Track render times
  renderTimesRef.current.push(timeSinceLastRender);
  if (renderTimesRef.current.length > 10) {
    renderTimesRef.current.shift();
  }

  // Detect potential infinite loops
  const avgRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;
  const isRenderingTooFast = avgRenderTime < 100 && renderCountRef.current > 5;
  const isRenderingTooOften = renderCountRef.current > 20;

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-xs z-50"
        title="Show debug info"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug: {componentName}</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>

      {showRenderCount && (
        <div className="mb-2">
          <div className="text-gray-300">Render Count:</div>
          <div className={`font-mono ${isRenderingTooOften ? 'text-red-400' : 'text-green-400'}`}>
            {renderCountRef.current}
          </div>
        </div>
      )}

      {showPerformance && (
        <div className="mb-2">
          <div className="text-gray-300">Performance:</div>
          <div className={`font-mono ${isRenderingTooFast ? 'text-red-400' : 'text-green-400'}`}>
            Avg: {avgRenderTime.toFixed(2)}ms
          </div>
          <div className="text-gray-400">
            Last: {timeSinceLastRender}ms
          </div>
        </div>
      )}

      {(isRenderingTooFast || isRenderingTooOften) && (
        <div className="mb-2 p-2 bg-red-900 rounded">
          <div className="text-red-300 font-bold">⚠️ Warning:</div>
          <div className="text-red-200 text-xs">
            {isRenderingTooFast && 'Rendering too fast'}
            {isRenderingTooFast && isRenderingTooOften && ' • '}
            {isRenderingTooOften && 'Too many renders'}
          </div>
        </div>
      )}

      <div className="text-gray-400 text-xs">
        Check console for detailed logs
      </div>
    </div>
  );
}

// Hook for tracking component renders
export function useRenderTracker(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  const renderTimesRef = useRef<number[]>([]);

  renderCountRef.current++;
  const now = Date.now();
  const timeSinceLastRender = now - lastRenderTimeRef.current;
  lastRenderTimeRef.current = now;

  renderTimesRef.current.push(timeSinceLastRender);
  if (renderTimesRef.current.length > 10) {
    renderTimesRef.current.shift();
  }

  const avgRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;
  const isRenderingTooFast = avgRenderTime < 100 && renderCountRef.current > 5;
  const isRenderingTooOften = renderCountRef.current > 20;

  useEffect(() => {
    if (isRenderingTooFast || isRenderingTooOften) {
      console.warn(`⚠️ Potential infinite loop in ${componentName}:`, {
        renderCount: renderCountRef.current,
        avgRenderTime: avgRenderTime.toFixed(2) + 'ms',
        isRenderingTooFast,
        isRenderingTooOften
      });
    }
  }, [componentName, avgRenderTime, isRenderingTooFast, isRenderingTooOften]);

  return {
    renderCount: renderCountRef.current,
    avgRenderTime,
    isRenderingTooFast,
    isRenderingTooOften
  };
}

// HOC for wrapping components with debug info
export function withDebugInfo<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    
    return (
      <>
        <DebugInfo componentName={name} />
        <Component {...props} />
      </>
    );
  };

  WrappedComponent.displayName = `withDebugInfo(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
