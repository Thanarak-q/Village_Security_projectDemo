/**
 * @file Safe State Hook
 * Prevents infinite re-render loops by providing safe state management
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

interface SafeStateOptions {
  maxUpdates?: number;
  updateTimeout?: number;
  onMaxUpdatesReached?: () => void;
}

export function useSafeState<T>(
  initialState: T | (() => T),
  options: SafeStateOptions = {}
) {
  const {
    maxUpdates = 100,
    updateTimeout = 1000,
    onMaxUpdatesReached
  } = options;

  const [state, setState] = useState(initialState);
  const updateCountRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset update count periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current > updateTimeout) {
        updateCountRef.current = 0;
      }
    }, updateTimeout);

    return () => clearInterval(interval);
  }, [updateTimeout]);

  const safeSetState = useCallback((newState: T | ((prevState: T) => T)) => {
    const now = Date.now();
    
    // Check if we're updating too frequently
    if (now - lastUpdateTimeRef.current < 100) { // Less than 100ms between updates
      updateCountRef.current++;
      
      if (updateCountRef.current > maxUpdates) {
        console.warn('⚠️ Too many state updates detected, preventing infinite loop');
        
        if (onMaxUpdatesReached) {
          onMaxUpdatesReached();
        }
        
        return;
      }
    } else {
      // Reset counter if enough time has passed
      updateCountRef.current = 0;
    }

    lastUpdateTimeRef.current = now;
    setState(newState);
  }, [maxUpdates, onMaxUpdatesReached]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, safeSetState] as const;
}

// Safe callback hook
export function useSafeCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList = []
): T {
  const callbackRef = useRef(callback);
  const callCountRef = useRef(0);
  const lastCallTimeRef = useRef(Date.now());

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    // Prevent too frequent calls
    if (now - lastCallTimeRef.current < 50) { // Less than 50ms between calls
      callCountRef.current++;
      
      if (callCountRef.current > 50) {
        console.warn('⚠️ Too many callback calls detected, preventing infinite loop');
        return;
      }
    } else {
      callCountRef.current = 0;
    }

    lastCallTimeRef.current = now;
    return callbackRef.current(...args);
  }, []) as T;
}

// Safe effect hook
export function useSafeEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  const effectRef = useRef(effect);
  const runCountRef = useRef(0);
  const lastRunTimeRef = useRef(Date.now());

  // Update effect ref when dependencies change
  useEffect(() => {
    effectRef.current = effect;
  }, deps);

  useEffect(() => {
    const now = Date.now();
    
    // Prevent too frequent effect runs
    if (now - lastRunTimeRef.current < 100) { // Less than 100ms between runs
      runCountRef.current++;
      
      if (runCountRef.current > 20) {
        console.warn('⚠️ Too many effect runs detected, preventing infinite loop');
        return;
      }
    } else {
      runCountRef.current = 0;
    }

    lastRunTimeRef.current = now;
    return effectRef.current();
  }, deps);
}

// Safe memo hook
export function useSafeMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  const factoryRef = useRef(factory);
  const computeCountRef = useRef(0);
  const lastComputeTimeRef = useRef(Date.now());
  const resultRef = useRef<T | null>(null);

  // Update factory ref when dependencies change
  useEffect(() => {
    factoryRef.current = factory;
  }, deps);

  // Use a more stable approach
  const shouldCompute = useMemo(() => {
    const now = Date.now();
    
    // Prevent too frequent computations
    if (now - lastComputeTimeRef.current < 50) { // Less than 50ms between computations
      computeCountRef.current++;
      
      if (computeCountRef.current > 30) {
        console.warn('⚠️ Too many memo computations detected, preventing infinite loop');
        return false;
      }
    } else {
      computeCountRef.current = 0;
    }

    lastComputeTimeRef.current = now;
    return true;
  }, deps);

  if (shouldCompute || resultRef.current === null) {
    resultRef.current = factoryRef.current();
  }

  return resultRef.current as T;
}
