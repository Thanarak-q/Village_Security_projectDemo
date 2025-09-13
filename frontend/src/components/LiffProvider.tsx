"use client";

import { useEffect } from 'react';

interface LiffProviderProps {
  children: React.ReactNode;
}

export function LiffProvider({ children }: LiffProviderProps) {
  useEffect(() => {
    // Load LIFF SDK if not already loaded
    if (typeof window !== 'undefined' && !window.liff) {
      const script = document.createElement('script');
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return <>{children}</>;
}